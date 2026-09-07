import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Clock, CheckCheck, RefreshCw, Image, Trash2, MoreVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { socket, joinUserRoom } from '../services/socket';
import { formatRelativeTime, formatExactMessageTime, formatChatDividerDate, shouldShowDateDivider } from '../utils/dateUtils';
import './ChatWidget.css';

const ChatWidget = () => {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const headerMenuRef = useRef(null);

  // Close header menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target)) {
        setShowHeaderMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time Socket.io & Polling for messages
  useEffect(() => {
    if (!isAuthenticated || user?.role === 'admin' || !user?._id) return;

    joinUserRoom(user._id);

    const handleNewMsg = (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === newMsg._id)) return prev;
        const updated = [...prev, newMsg];
        if (!isOpen) {
          const unreads = updated.filter((m) => m.sender === 'admin' && !m.isRead).length;
          setUnreadCount(unreads);
        }
        return updated;
      });

      if (isOpen) {
        api.get('/chat/messages?markRead=true').catch(() => {});
      }
    };

    const handleReadReceipt = () => {
      setMessages((prev) =>
        prev.map((m) => (m.sender === 'user' ? { ...m, isRead: true, status: 'read' } : m))
      );
    };

    const handleConvDeleted = () => {
      setMessages([]);
      setUnreadCount(0);
    };

    const handleMsgDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    };

    socket.on('new_chat_message', handleNewMsg);
    socket.on('messages_read_by_recipient', handleReadReceipt);
    socket.on('conversation_deleted', handleConvDeleted);
    socket.on('message_deleted', handleMsgDeleted);

    fetchMessages();

    const interval = setInterval(() => {
      fetchMessages(true);
    }, 5000);

    return () => {
      socket.off('new_chat_message', handleNewMsg);
      socket.off('messages_read_by_recipient', handleReadReceipt);
      socket.off('conversation_deleted', handleConvDeleted);
      socket.off('message_deleted', handleMsgDeleted);
      clearInterval(interval);
    };
  }, [isAuthenticated, user, isOpen]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
      if (isAuthenticated) {
        api.get('/chat/messages?markRead=true').catch(() => {});
      }
    }
  }, [isOpen, isAuthenticated]);

  // Custom event listener to open chat widget from notification bell
  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
      setUnreadCount(0);
      if (isAuthenticated) {
        api.get('/chat/messages?markRead=true').catch(() => {});
      }
    };

    window.addEventListener('open_chat_widget', handleOpenChat);
    return () => {
      window.removeEventListener('open_chat_widget', handleOpenChat);
    };
  }, [isAuthenticated]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('Kích thước ảnh tối đa 8MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const fetchMessages = async (isBackground = false, forceMarkRead = false) => {
    if (!isBackground) setLoading(true);
    try {
      const shouldMarkRead = forceMarkRead || isOpen;
      const res = await api.get(`/chat/messages${shouldMarkRead ? '?markRead=true' : ''}`);
      if (res.data.success) {
        setMessages(res.data.messages);

        if (!isOpen) {
          const unreads = res.data.messages.filter(
            (m) => m.sender === 'admin' && !m.isRead
          ).length;
          setUnreadCount(unreads);
        } else {
          setUnreadCount(0);
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!inputMsg.trim() && !selectedImage) || sending) return;

    const textToSend = inputMsg.trim();
    const imageToSend = selectedImage;

    setInputMsg('');
    setSelectedImage(null);
    setSending(true);

    // Optimistic UI update
    const tempMsg = {
      _id: Date.now().toString(),
      sender: 'user',
      senderName: user?.username || 'Bạn',
      text: textToSend,
      imageUrl: imageToSend,
      status: 'sent',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await api.post('/chat/send', {
        text: textToSend,
        imageUrl: imageToSend,
      });
      if (res.data.success) {
        fetchMessages(true);
      }
    } catch (err) {
      console.error('Gửi tin nhắn thất bại:', err);
      alert('Gửi tin nhắn thất bại. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteSingleMessage = async (messageId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tin nhắn này khỏi lịch sử phía bạn không?')) return;
    try {
      const res = await api.delete(`/chat/messages/${messageId}`);
      if (res.data.success) {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa tin nhắn.');
    }
  };

  const handleDeleteConversation = async () => {
    if (
      !window.confirm(
        'Bạn có chắc chắn muốn xóa toàn bộ lịch sử cuộc trò chuyện phía bạn không? (Phía Admin vẫn lưu trữ toàn bộ lịch sử)'
      )
    )
      return;
    try {
      const res = await api.delete('/chat/conversations');
      if (res.data.success) {
        setMessages([]);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa cuộc trò chuyện.');
    }
  };

  // Don't render floating widget for admin
  if (user?.role === 'admin') return null;

  return (
    <div className="chat-widget-wrapper">
      {/* Floating Chat Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setUnreadCount(0);
            fetchMessages();
          }
        }}
        className={`chat-toggle-btn ${isOpen ? 'active' : ''}`}
        title="Trò chuyện hỗ trợ trực tuyến"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={26} />}
        {!isOpen && unreadCount > 0 && <span className="chat-unread-badge">{unreadCount}</span>}
      </button>

      {/* Floating Chat Modal Window */}
      {isOpen && (
        <div className="chat-modal-window animate-slide-up">
          {/* Header */}
          <div className="chat-modal-header">
            <div className="chat-header-info">
              <div className="chat-avatar-circle">
                <Bot size={20} />
              </div>
              <div>
                <h4>Hỗ Trợ Phúc Long</h4>
                <span className="online-indicator">🟢 Trực tuyến 24/7</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isAuthenticated && messages.length > 0 && (
                <div style={{ position: 'relative' }} ref={headerMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                    className="btn-close-chat"
                    title="Tùy chọn cuộc trò chuyện"
                  >
                    <MoreVertical size={18} />
                  </button>
                  {showHeaderMenu && (
                    <div
                      className="chat-header-menu-dropdown animate-fade-in"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="menu-item-delete"
                        onClick={() => {
                          setShowHeaderMenu(false);
                          handleDeleteConversation();
                        }}
                      >
                        <Trash2 size={14} />
                        <span>Xóa cuộc trò chuyện</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              <button onClick={() => setIsOpen(false)} className="btn-close-chat" title="Đóng chat">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body Messages Container */}
          <div className="chat-modal-body">
            {!isAuthenticated ? (
              <div className="chat-login-prompt">
                <Bot size={36} className="prompt-icon" />
                <p>Vui lòng đăng nhập để bắt đầu trò chuyện trực tiếp với tư vấn viên cửa hàng!</p>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    window.location.href = '/login';
                  }}
                  className="btn-chat-login"
                >
                  Đăng nhập ngay
                </button>
              </div>
            ) : loading ? (
              <div className="chat-loading">
                <RefreshCw size={24} className="spin" />
                <p>Đang tải tin nhắn...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="chat-empty">
                <Bot size={32} />
                <p>Xin chào <strong>{user?.username}</strong>! Phúc Long có thể hỗ trợ gì cho bạn hôm nay?</p>
              </div>
            ) : (
              <div className="messages-list">
                {messages.map((msg, idx) => {
                  const isMe = msg.sender === 'user';
                  const prevMsg = idx > 0 ? messages[idx - 1] : null;
                  const showDivider = idx === 0 || shouldShowDateDivider(prevMsg?.createdAt, msg.createdAt);
                  const statusText =
                    msg.status === 'read' || msg.isRead
                      ? 'Đã xem'
                      : msg.status === 'delivered'
                      ? 'Đã nhận'
                      : 'Đã gửi';

                  return (
                    <React.Fragment key={msg._id || idx}>
                      {showDivider && (
                        <div className="chat-date-divider">
                          <span>{formatChatDividerDate(msg.createdAt)}</span>
                        </div>
                      )}
                      <div className={`chat-bubble-row ${isMe ? 'row-me' : 'row-them'}`}>
                        <div
                          className={`chat-bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}
                          onDoubleClick={() => {
                            if (msg._id && !msg._id.toString().startsWith('temp-')) {
                              handleDeleteSingleMessage(msg._id);
                            }
                          }}
                          title="Nhấn đúp để xóa tin nhắn này phía bạn"
                          style={{ cursor: 'pointer', userSelect: 'none' }}
                        >
                          <div className="bubble-sender">{isMe ? 'Bạn' : 'Phúc Long Support'}</div>
                          {msg.imageUrl && (
                            <div className="bubble-image-wrap">
                              <img
                                src={msg.imageUrl}
                                alt="Ảnh đính kèm"
                                className="chat-attached-image"
                                onClick={() => window.open(msg.imageUrl, '_blank')}
                                title="Bấm để mở ảnh lớn"
                              />
                            </div>
                          )}
                          {msg.text && <div className="bubble-text">{msg.text}</div>}
                          <div className="bubble-footer-meta">
                            <span className="bubble-time">
                              {formatExactMessageTime(msg.createdAt)}
                            </span>
                            {isMe && <span className="bubble-status-text">{statusText}</span>}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Selected Image Preview Bar */}
          {selectedImage && (
            <div className="image-preview-bar">
              <img src={selectedImage} alt="Preview" className="preview-thumb" />
              <span className="preview-text">Đã chọn 1 hình ảnh</span>
              <button
                type="button"
                className="btn-remove-preview"
                onClick={() => setSelectedImage(null)}
                title="Xóa ảnh"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Footer Input */}
          {isAuthenticated && (
            <form onSubmit={handleSend} className="chat-modal-footer">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
              <button
                type="button"
                className="btn-attach-img"
                onClick={() => fileInputRef.current?.click()}
                title="Gửi hình ảnh phản ánh"
              >
                <Image size={18} />
              </button>
              <input
                type="text"
                placeholder={selectedImage ? 'Nhập chú thích ảnh...' : 'Nhập tin nhắn...'}
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                disabled={sending}
              />
              <button
                type="submit"
                className="btn-send-msg"
                disabled={(!inputMsg.trim() && !selectedImage) || sending}
              >
                <Send size={16} />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
