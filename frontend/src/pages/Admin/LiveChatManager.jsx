import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, User, RefreshCw, Bot, Search, AlertCircle, Image, X, MoreVertical, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { socket, joinAdminRoom } from '../../services/socket';
import { formatRelativeTime, formatExactMessageTime, formatChatDividerDate, shouldShowDateDivider } from '../../utils/dateUtils';
import './LiveChatManager.css';

const LiveChatManager = ({ initialTargetUser }) => {
  const [conversations, setConversations] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeletedUser, setIsDeletedUser] = useState(false);
  const [activeMenuConvId, setActiveMenuConvId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Close 3-dots menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuConvId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Set initial target user if passed from MemberManager
  useEffect(() => {
    if (initialTargetUser && initialTargetUser._id) {
      setActiveUserId(initialTargetUser._id);
      setActiveUser({
        _id: initialTargetUser._id,
        username: initialTargetUser.username || 'Khách hàng',
        email: initialTargetUser.email || '',
        isDeleted: initialTargetUser.isDeleted || false,
      });
    }
  }, [initialTargetUser]);

  useEffect(() => {
    joinAdminRoom();

    const handleNewMsg = (newMsg) => {
      fetchConversations(true);
      if (activeUserId && (newMsg.userId === activeUserId || newMsg.sender === 'user')) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      }
    };

    const handleReadReceipt = ({ userId }) => {
      if (activeUserId && activeUserId === userId) {
        setMessages((prev) =>
          prev.map((m) => (m.sender === 'admin' ? { ...m, isRead: true, status: 'read' } : m))
        );
      }
    };

    const handleConvDeleted = ({ userId }) => {
      setConversations((prev) => prev.filter((c) => c._id !== userId));
      if (activeUserId === userId) {
        setActiveUserId(null);
        setActiveUser(null);
        setMessages([]);
      }
    };

    const handleMsgDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      fetchConversations(true);
    };

    socket.on('new_chat_message', handleNewMsg);
    socket.on('messages_read_by_recipient', handleReadReceipt);
    socket.on('conversation_deleted', handleConvDeleted);
    socket.on('message_deleted', handleMsgDeleted);

    fetchConversations();
    const interval = setInterval(() => {
      fetchConversations(true);
    }, 5000);

    return () => {
      socket.off('new_chat_message', handleNewMsg);
      socket.off('messages_read_by_recipient', handleReadReceipt);
      socket.off('conversation_deleted', handleConvDeleted);
      socket.off('message_deleted', handleMsgDeleted);
      clearInterval(interval);
    };
  }, [activeUserId]);

  useEffect(() => {
    if (activeUserId) {
      fetchMessages(activeUserId);
    }
  }, [activeUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async (isBackground = false) => {
    if (!isBackground) setLoadingConv(true);
    try {
      const res = await api.get('/chat/conversations');
      if (res.data.success) {
        let convList = res.data.conversations;

        // If initialTargetUser exists and isn't in convList, add it
        if (initialTargetUser && initialTargetUser._id) {
          const exists = convList.some((c) => c._id === initialTargetUser._id);
          if (!exists) {
            convList = [
              {
                _id: initialTargetUser._id,
                username: initialTargetUser.username || 'Khách hàng',
                email: initialTargetUser.email || '',
                lastMessage: 'Bắt đầu cuộc trò chuyện mới...',
                lastSender: 'admin',
                updatedAt: new Date().toISOString(),
                unreadCount: 0,
                isDeleted: initialTargetUser.isDeleted || false,
              },
              ...convList,
            ];
          }
        }

        setConversations(convList);

        if (!activeUserId && convList.length > 0) {
          setActiveUserId(convList[0]._id);
          setActiveUser(convList[0]);
          setIsDeletedUser(!!convList[0].isDeleted);
        }
      }
    } catch (err) {
      console.error('Lỗi tải danh sách hội thoại:', err);
    } finally {
      if (!isBackground) setLoadingConv(false);
    }
  };

  const fetchMessages = async (userId, isBackground = false) => {
    if (!isBackground) setLoadingMsg(true);
    try {
      const res = await api.get(`/chat/messages/${userId}?markRead=true`);
      if (res.data.success) {
        setMessages(res.data.messages);
        setIsDeletedUser(!!res.data.isUserDeleted || activeUser?.isDeleted === true);
      }
    } catch (err) {
      console.error('Lỗi tải tin nhắn:', err);
    } finally {
      if (!isBackground) setLoadingMsg(false);
    }
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

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!inputMsg.trim() && !selectedImage) || !activeUserId || sending || isDeletedUser) return;

    const textToSend = inputMsg.trim();
    const imageToSend = selectedImage;
    setInputMsg('');
    setSelectedImage(null);
    setSending(true);

    const tempMsg = {
      _id: Date.now().toString(),
      sender: 'admin',
      senderName: 'Cửa Hàng Phúc Long',
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
        targetUserId: activeUserId,
      });
      if (res.data.success) {
        fetchMessages(activeUserId, true);
        fetchConversations(true);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể gửi tin nhắn phản hồi.';
      console.error('Gửi phản hồi thất bại:', msg);
      alert(msg);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConversation = async (userId, username) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa toàn bộ lịch sử tin nhắn với ${username}?`)) return;
    try {
      const res = await api.delete(`/chat/conversations/${userId}`);
      if (res.data.success) {
        setConversations((prev) => prev.filter((c) => c._id !== userId));
        if (activeUserId === userId) {
          setActiveUserId(null);
          setActiveUser(null);
          setMessages([]);
        }
        setActiveMenuConvId(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa cuộc trò chuyện.');
    }
  };

  const handleDeleteSingleMessage = async (messageId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tin nhắn này không?')) return;
    try {
      const res = await api.delete(`/chat/messages/${messageId}`);
      if (res.data.success) {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
        fetchConversations(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa tin nhắn.');
    }
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="live-chat-manager-wrapper">
      <div className="chat-manager-header">
        <h2><MessageCircle className="header-icon" /> Quản Lý Live Chat Hỗ Trợ Khách Hàng</h2>
        <button onClick={() => fetchConversations()} className="btn-refresh-chats">
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      <div className="chat-manager-body">
        {/* Left Sidebar Conversations List */}
        <div className="chat-sidebar-list">
          <div className="search-conv-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm theo tên khách hoặc email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loadingConv ? (
            <div className="sidebar-loading">
              <RefreshCw size={20} className="spin" />
              <p>Đang tải hội thoại...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="sidebar-empty">
              <p>Chưa có cuộc hội thoại nào.</p>
            </div>
          ) : (
            <div className="conv-items-group">
              {filteredConversations.map((conv) => {
                const isActive = activeUserId === conv._id;
                const displayName = conv.isDeleted ? 'Khách hàng' : conv.username;
                return (
                  <div
                    key={conv._id}
                    className={`conv-item-card ${isActive ? 'active' : ''} ${conv.isDeleted ? 'deleted-conv' : ''}`}
                    onClick={() => {
                      setActiveUserId(conv._id);
                      setActiveUser(conv);
                      setIsDeletedUser(!!conv.isDeleted);
                    }}
                  >
                    <div className="conv-avatar">
                      {displayName?.[0]?.toUpperCase() || 'K'}
                    </div>
                    <div className="conv-meta">
                      <div className="conv-top-row">
                        <span className="conv-name">{displayName}</span>
                        <span className="conv-time">
                          {formatRelativeTime(conv.updatedAt)}
                        </span>
                      </div>
                      <div className="conv-last-msg">
                        {conv.lastSender === 'admin' ? 'Bạn: ' : ''}
                        {conv.lastMessage}
                      </div>
                    </div>
                    <div className="conv-actions-wrap" onClick={(e) => e.stopPropagation()}>
                      {conv.unreadCount > 0 && (
                        <span className="conv-unread-pill">{conv.unreadCount}</span>
                      )}
                      <button
                        type="button"
                        className="btn-conv-more"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuConvId(activeMenuConvId === conv._id ? null : conv._id);
                        }}
                        title="Tùy chọn cuộc hội thoại"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeMenuConvId === conv._id && (
                        <div className="conv-menu-dropdown animate-fade-in" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="menu-item-delete"
                            onClick={() => handleDeleteConversation(conv._id, displayName)}
                          >
                            <Trash2 size={14} />
                            <span>Xóa cuộc trò chuyện</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Main Chat Thread Window */}
        <div className="chat-main-window">
          {activeUser ? (
            <>
              {/* Active Conversation Header */}
              <div className="active-conv-header">
                <div className="active-user-avatar">
                  {(isDeletedUser ? 'Khách hàng' : activeUser.username)?.[0]?.toUpperCase() || 'K'}
                </div>
                <div>
                  <h4>{isDeletedUser ? 'Khách hàng' : activeUser.username}</h4>
                  <span className="user-email">
                    {isDeletedUser ? 'Tài khoản đã bị xóa' : activeUser.email || 'Khách hàng thân thiết'}
                  </span>
                </div>
              </div>

              {/* Warning Banner if Account Deleted */}
              {isDeletedUser && (
                <div className="alert-message danger-alert" style={{ borderRadius: 0, margin: 0, padding: '10px 16px' }}>
                  <AlertCircle size={18} />
                  <span>Tài khoản này đã bị xóa bởi quản trị viên. Không thể gửi thêm tin nhắn.</span>
                </div>
              )}

              {/* Chat Thread Messages */}
              <div className="admin-chat-messages">
                {loadingMsg ? (
                  <div className="chat-loading">
                    <RefreshCw size={24} className="spin" />
                    <p>Đang tải lịch sử trò chuyện...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="chat-empty">
                    <p>Chưa có tin nhắn nào trong cuộc trò chuyện này.</p>
                  </div>
                ) : (
                  <div className="admin-messages-list">
                    {messages.map((msg, idx) => {
                      const isAdminMsg = msg.sender === 'admin';
                      const prevMsg = idx > 0 ? messages[idx - 1] : null;
                      const showDivider = idx === 0 || shouldShowDateDivider(prevMsg?.createdAt, msg.createdAt);
                      const statusText =
                        msg.status === 'read' || msg.isRead
                          ? 'Đã xem'
                          : msg.status === 'delivered'
                          ? 'Đã nhận'
                          : 'Đã gửi';
                      const senderDisplayName = isAdminMsg
                        ? 'Cửa Hàng Phúc Long'
                        : isDeletedUser
                          ? 'Khách hàng'
                          : activeUser.username;

                      return (
                        <React.Fragment key={msg._id || idx}>
                          {showDivider && (
                            <div className="admin-date-divider">
                              <span>{formatChatDividerDate(msg.createdAt)}</span>
                            </div>
                          )}
                          <div
                            className={`admin-bubble-row ${isAdminMsg ? 'row-admin' : 'row-user'}`}
                          >
                            <div
                              className={`admin-bubble ${isAdminMsg ? 'bubble-admin' : 'bubble-user'}`}
                              onDoubleClick={() => {
                                if (msg._id && !msg._id.toString().startsWith('temp-')) {
                                  handleDeleteSingleMessage(msg._id);
                                }
                              }}
                              title="Nhấn đúp để xóa tin nhắn này"
                            >
                              <div className="bubble-sender">{senderDisplayName}</div>
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
                                {isAdminMsg && <span className="bubble-status-text">{statusText}</span>}
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

              {/* Quick Template Chips */}
              {!isDeletedUser && (
                <div className="quick-template-chips">
                  <span className="chips-label">Mẫu tin nhanh:</span>
                  <button
                    type="button"
                    className="chip-btn"
                    onClick={() =>
                      setInputMsg(
                        `Cảm ơn quý khách ${activeUser.username} đã ủng hộ Phúc Long! Chúc quý khách thưởng thức đồ uống ngon miệng 🍵✨`
                      )
                    }
                  >
                    💌 Cảm ơn khách
                  </button>
                  <button
                    type="button"
                    className="chip-btn"
                    onClick={() =>
                      setInputMsg(
                        'Đơn hàng của quý khách đang được các barista Phúc Long chuẩn bị tươi ngon! 🍹'
                      )
                    }
                  >
                    🍹 Đang chuẩn bị
                  </button>
                  <button
                    type="button"
                    className="chip-btn"
                    onClick={() =>
                      setInputMsg(
                        'Đơn hàng của quý khách đang trên đường giao tới. Quý khách vui lòng chú ý điện thoại nhé! 🚚💨'
                      )
                    }
                  >
                    🚚 Đang giao hàng
                  </button>
                </div>
              )}

              {/* Chat Input Bar */}
              <form onSubmit={handleSend} className="admin-chat-footer">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                  disabled={isDeletedUser}
                />
                <button
                  type="button"
                  className="btn-attach-img"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isDeletedUser}
                  title="Gửi hình ảnh"
                >
                  <Image size={18} />
                </button>
                <input
                  type="text"
                  placeholder={
                    isDeletedUser
                      ? 'Tài khoản đã bị xóa, không thể gửi tin nhắn.'
                      : selectedImage
                      ? 'Nhập chú thích ảnh...'
                      : 'Nhập tin nhắn phản hồi cho khách hàng...'
                  }
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  disabled={sending || isDeletedUser}
                />
                <button
                  type="submit"
                  className="btn-admin-send"
                  disabled={(!inputMsg.trim() && !selectedImage) || sending || isDeletedUser}
                >
                  <Send size={16} />
                  <span>Gửi phản hồi</span>
                </button>
              </form>
            </>
          ) : (
            <div className="no-active-conv">
              <Bot size={48} />
              <p>Chọn một cuộc hội thoại bên trái để bắt đầu trả lời tin nhắn của khách hàng.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveChatManager;
