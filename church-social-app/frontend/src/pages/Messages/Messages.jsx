import { useState, useEffect, useRef } from 'react';
import { messageAPI, userAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaPaperPlane, FaSearch, FaUserPlus, FaTimes, FaCircle } from 'react-icons/fa';
import { format, formatDistance } from 'date-fns';
import useAuthStore from '../../store/authStore';
import socketService from '../../services/socket';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchConversations();
    fetchUsers();

    // Connect socket
    socketService.connect(user?.id);

    // Listen for new messages
    socketService.onNewMessage((message) => {
      if (activeConversation && message.conversation === activeConversation._id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
      // Update conversations list
      fetchConversations();
    });

    // Listen for typing indicators
    socketService.onUserTyping(({ userId, userName }) => {
      setTypingUsers(prev => new Set(prev).add(userName));
    });

    socketService.onUserStopTyping(({ userId }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        // Remove by finding the user
        newSet.forEach(name => {
          if (name.includes(userId)) {
            newSet.delete(name);
          }
        });
        return newSet;
      });
    });

    return () => {
      if (activeConversation) {
        socketService.leaveConversation(activeConversation._id);
      }
      socketService.removeListener('new-message');
      socketService.removeListener('user-typing');
      socketService.removeListener('user-stop-typing');
    };
  }, [user, activeConversation]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages();
      socketService.joinConversation(activeConversation._id);
      markAsRead();
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await messageAPI.getConversations();
      setConversations(response.data.data);
    } catch (error) {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!activeConversation) return;

    try {
      const response = await messageAPI.getMessages(activeConversation._id, { limit: 100 });
      setMessages(response.data.data);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getUsers({ limit: 100 });
      setUsers(response.data.data.filter(u => u._id !== user.id));
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const markAsRead = async () => {
    if (!activeConversation) return;

    try {
      await messageAPI.markAsRead(activeConversation._id);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !activeConversation) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    // Stop typing indicator
    socketService.stopTypingIndicator(activeConversation._id, user.id);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      const response = await messageAPI.sendMessage({
        conversationId: activeConversation._id,
        content: messageContent,
        messageType: 'text'
      });

      // Message will be added via socket event
    } catch (error) {
      toast.error('Failed to send message');
      setNewMessage(messageContent); // Restore message on error
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!activeConversation) return;

    // Send typing indicator
    socketService.sendTypingIndicator(
      activeConversation._id,
      user.id,
      `${user.firstName} ${user.lastName}`
    );

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopTypingIndicator(activeConversation._id, user.id);
    }, 2000);
  };

  const handleStartConversation = async (selectedUser) => {
    try {
      const response = await messageAPI.createConversation({
        participants: [user.id, selectedUser._id],
        isGroup: false
      });

      const newConversation = response.data.data;
      setConversations([newConversation, ...conversations]);
      setActiveConversation(newConversation);
      setShowNewConversation(false);
      setSearchQuery('');
    } catch (error) {
      toast.error('Failed to start conversation');
    }
  };

  const getOtherParticipant = (conversation) => {
    if (conversation.isGroup) {
      return {
        firstName: conversation.groupName,
        lastName: '',
        profilePicture: conversation.groupImage
      };
    }
    return conversation.participants.find(p => p._id !== user.id);
  };

  const filteredUsers = users.filter(u =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-12">Loading messages...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-12rem)]">
      <div className="flex h-full gap-4">
        {/* Conversations List */}
        <div className="w-80 flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-gray-900">Messages</h2>
              <button
                onClick={() => setShowNewConversation(true)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                title="New conversation"
              >
                <FaUserPlus />
              </button>
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>No conversations yet.</p>
                <p className="text-sm mt-2">Start a new conversation!</p>
              </div>
            ) : (
              conversations.map(conv => {
                const otherUser = getOtherParticipant(conv);
                const isActive = activeConversation?._id === conv._id;

                return (
                  <div
                    key={conv._id}
                    onClick={() => setActiveConversation(conv)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                      isActive ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={otherUser.profilePicture || `https://ui-avatars.com/api/?name=${otherUser.firstName}+${otherUser.lastName}`}
                          alt={`${otherUser.firstName} ${otherUser.lastName}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {otherUser.firstName} {otherUser.lastName}
                          </h3>
                          {conv.lastMessage && (
                            <span className="text-xs text-gray-500">
                              {formatDistance(new Date(conv.updatedAt), new Date(), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <p className="text-sm text-gray-600 truncate">
                            {conv.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Active Conversation */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden">
          {activeConversation ? (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="flex items-center gap-3">
                  {(() => {
                    const otherUser = getOtherParticipant(activeConversation);
                    return (
                      <>
                        <img
                          src={otherUser.profilePicture || `https://ui-avatars.com/api/?name=${otherUser.firstName}+${otherUser.lastName}`}
                          alt={`${otherUser.firstName} ${otherUser.lastName}`}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white"
                        />
                        <div>
                          <h2 className="font-bold text-white">
                            {otherUser.firstName} {otherUser.lastName}
                          </h2>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((message) => {
                  const isOwn = message.sender._id === user.id;

                  return (
                    <div
                      key={message._id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isOwn && (
                          <img
                            src={message.sender.profilePicture || `https://ui-avatars.com/api/?name=${message.sender.firstName}+${message.sender.lastName}`}
                            alt={`${message.sender.firstName} ${message.sender.lastName}`}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              isOwn
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                : 'bg-white text-gray-900 border border-gray-200'
                            }`}
                          >
                            <p className="break-words">{message.content}</p>
                          </div>
                          <div className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                            {format(new Date(message.createdAt), 'h:mm a')}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {typingUsers.size > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-white px-4 py-2 rounded-2xl border border-gray-200">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaPaperPlane />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FaSearch className="text-6xl mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">New Conversation</h2>
              <button
                onClick={() => {
                  setShowNewConversation(false);
                  setSearchQuery('');
                }}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No users found</p>
              ) : (
                filteredUsers.map(u => (
                  <div
                    key={u._id}
                    onClick={() => handleStartConversation(u)}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition"
                  >
                    <img
                      src={u.profilePicture || `https://ui-avatars.com/api/?name=${u.firstName}+${u.lastName}`}
                      alt={`${u.firstName} ${u.lastName}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {u.firstName} {u.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{u.role}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
