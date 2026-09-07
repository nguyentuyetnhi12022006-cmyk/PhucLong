import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Clock, CheckCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ChatWidget.css';

const ChatWidget = () => {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  // Poll for messages periodically if logged in
  useEffect(() => {
    if (!isAuthenticated || user?.role === 'admin') return;

    fetchMessages();
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Format message time with the date (dd/mm HH:MM) so customers can see
  // exactly when each message was sent.
  const formatMsgTime = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Hôm nay · ${time}`;
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')} · ${time}`;
  };

  const fetchMessages = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await api.get('/chat/messages');
      if (res.data.success) {
        setMessages(res.data.messages);

        if (!isOpen) {
          const unreads = res.data.messages.filter(
            (m) => m.sender === 'admin' && !m.isRead
          ).length;
          setUnreadCount(unreads);
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
    if (!inputMsg.trim() || sending) return;

    const textToSend = inputMsg.trim();
    setInputMsg('');
    setSending(true);

    // Optimistic UI update
    const tempMsg = {
      _id: Date.now().toString(),
      sender: 'user',
      senderName: user?.username || 'Bạn',
      text: textToSend,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await api.post('/chat/send', { text: textToSend });
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

  // Don't render floating widget for admin
  if (user?.role === 'admin') return null;

  return (
    <div className="chat-widget-wrapper">
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
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
            <button onClick={() => setIsOpen(false)} className="btn-close-chat">
              <X size={18} />
            </button>
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
                {messages.map((msg) => {
                  const isMe = msg.sender === 'user';
                  return (
                    <div
                      key={msg._id}
                      className={`chat-bubble-row ${isMe ? 'row-me' : 'row-them'}`}
                    >
                      <div className={`chat-bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}>
                        <div className="bubble-sender">{isMe ? 'Bạn' : 'Phúc Long Support'}</div>
                        <div className="bubble-text">{msg.text}</div>
                        <div className="bubble-time">
                          {formatMsgTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Footer Input */}
          {isAuthenticated && (
            <form onSubmit={handleSend} className="chat-modal-footer">
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                disabled={sending}
              />
              <button type="submit" className="btn-send-msg" disabled={!inputMsg.trim() || sending}>
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
