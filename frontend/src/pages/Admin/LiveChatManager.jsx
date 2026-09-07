import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, User, RefreshCw, Bot, Search } from 'lucide-react';
import api from '../../services/api';
import './LiveChatManager.css';

const LiveChatManager = () => {
  const [conversations, setConversations] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
      fetchConversations(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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

  // Format message time with the date (dd/mm HH:MM) so admins can see
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

  const fetchConversations = async (isBackground = false) => {
    if (!isBackground) setLoadingConv(true);
    try {
      // Returns ALL registered customer accounts (not just users who already
      // have messages), so the admin can start a chat with anyone.
      const res = await api.get('/chat/users');
      if (res.data.success) {
        setConversations(res.data.users);
        if (!activeUserId && res.data.users.length > 0) {
          setActiveUserId(res.data.users[0]._id);
          setActiveUser(res.data.users[0]);
        }
      }
    } catch (err) {
      console.error('Lỗi tải danh sách tài khoản:', err);
    } finally {
      if (!isBackground) setLoadingConv(false);
    }
  };

  const fetchMessages = async (userId, isBackground = false) => {
    if (!isBackground) setLoadingMsg(true);
    try {
      const res = await api.get(`/chat/messages/${userId}`);
      if (res.data.success) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error('Lỗi tải tin nhắn:', err);
    } finally {
      if (!isBackground) setLoadingMsg(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !activeUserId || sending) return;

    const textToSend = inputMsg.trim();
    setInputMsg('');
    setSending(true);

    const tempMsg = {
      _id: Date.now().toString(),
      sender: 'admin',
      senderName: 'Cửa Hàng Phúc Long',
      text: textToSend,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await api.post('/chat/send', {
        text: textToSend,
        targetUserId: activeUserId,
      });
      if (res.data.success) {
        fetchMessages(activeUserId, true);
        fetchConversations(true);
      }
    } catch (err) {
      console.error('Gửi phản hồi thất bại:', err);
      alert('Không thể gửi tin nhắn phản hồi.');
    } finally {
      setSending(false);
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
              <p>Chưa có tài khoản nào.</p>
            </div>
          ) : (
            <div className="conv-items-group">
              {filteredConversations.map((conv) => {
                const isActive = activeUserId === conv._id;
                return (
                  <div
                    key={conv._id}
                    className={`conv-item-card ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setActiveUserId(conv._id);
                      setActiveUser(conv);
                    }}
                  >
                    <div className="conv-avatar">
                      {conv.username?.[0]?.toUpperCase() || 'K'}
                    </div>
                    <div className="conv-meta">
                      <div className="conv-top-row">
                        <span className="conv-name">
                          {conv.username}
                          {conv.phone && <span className="conv-phone"> · {conv.phone}</span>}
                        </span>
                        <span className="conv-time">
                          {new Date(conv.updatedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className={`conv-last-msg ${conv.hasChat ? '' : 'no-chat-yet'}`}>
                        {!conv.hasChat ? (
                          <span>Chưa có tin nhắn — bấm để gửi tin nhắn đầu tiên</span>
                        ) : (
                          <>
                            {conv.lastSender === 'admin' ? 'Bạn: ' : ''}
                            {conv.lastMessage}
                          </>
                        )}
                      </div>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="conv-unread-pill">{conv.unreadCount}</span>
                    )}
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
                  {activeUser.username?.[0]?.toUpperCase() || 'K'}
                </div>
                <div>
                  <h4>{activeUser.username}</h4>
                  <span className="user-email">{activeUser.email || 'Khách hàng thân thiết'}</span>
                </div>
              </div>

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
                    {messages.map((msg) => {
                      const isAdmin = msg.sender === 'admin';
                      return (
                        <div
                          key={msg._id}
                          className={`admin-bubble-row ${isAdmin ? 'row-admin' : 'row-user'}`}
                        >
                          <div className={`admin-bubble ${isAdmin ? 'bubble-admin' : 'bubble-user'}`}>
                            <div className="bubble-sender">{isAdmin ? 'Cửa Hàng Phúc Long' : activeUser.username}</div>
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

              {/* Quick Template Chips */}
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

              {/* Chat Input Bar */}
              <form onSubmit={handleSend} className="admin-chat-footer">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn phản hồi cho khách hàng..."
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  disabled={sending}
                />
                <button type="submit" className="btn-admin-send" disabled={!inputMsg.trim() || sending}>
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
