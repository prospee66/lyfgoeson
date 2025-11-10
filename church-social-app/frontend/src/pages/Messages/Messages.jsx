import { useState, useEffect, useRef } from 'react';
import { messageAPI, userAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaPaperPlane, FaUserPlus, FaTimes, FaEnvelope } from 'react-icons/fa';
import { format, formatDistance } from 'date-fns';
import useAuthStore from '../../store/authStore';
import socketService from '../../services/socket';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

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

  // Get profile picture URL
  const getProfilePictureUrl = (userObj) => {
    if (!userObj?.profilePicture || userObj.profilePicture === '/assets/glc-logo.png') {
      // Return a blank gray placeholder
      return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128"%3E%3Crect width="128" height="128" fill="%23e5e7eb"/%3E%3C/svg%3E';
    }
    if (userObj.profilePicture.includes('ui-avatars') || userObj.profilePicture.startsWith('http')) {
      return userObj.profilePicture;
    }
    return `${API_BASE_URL}${userObj.profilePicture}`;
  };

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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 p-8 shadow-xl">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <FaEnvelope className="text-3xl text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">Messages</h1>
            </div>
            <p className="text-indigo-100 text-lg mt-2">
              Connect and communicate with your church community
            </p>
          </div>
          <button
            onClick={() => setShowNewConversation(true)}
            className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <FaUserPlus /> New Conversation
          </button>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
      </div>

      <div className="flex h-[calc(100vh-20rem)] gap-6">
        {/* Conversations List */}
        <div className="w-96 flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"></div>
                Conversations
              </h2>
              <span className="text-sm font-semibold text-gray-500">{conversations.length}</span>
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                  <FaEnvelope className="text-3xl text-indigo-600" />
                </div>
                <p className="text-gray-900 font-semibold mb-1">No conversations yet</p>
                <p className="text-sm text-gray-500">Start a new conversation!</p>
              </div>
            ) : (
              conversations.map(conv => {
                const otherUser = getOtherParticipant(conv);
                const isActive = activeConversation?._id === conv._id;

                return (
                  <div
                    key={conv._id}
                    onClick={() => setActiveConversation(conv)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-l-indigo-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={getProfilePictureUrl(otherUser)}
                          alt={`${otherUser.firstName} ${otherUser.lastName}`}
                          className={`w-14 h-14 rounded-full object-cover border-2 ${
                            isActive ? 'border-indigo-600' : 'border-gray-200'
                          }`}
                        />
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-gray-900 truncate">
                            {otherUser.firstName} {otherUser.lastName}
                          </h3>
                          {conv.lastMessage && (
                            <span className="text-xs text-gray-500 font-medium">
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
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          {activeConversation ? (
            <>
              {/* Conversation Header */}
              <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600">
                <div className="flex items-center gap-4">
                  {(() => {
                    const otherUser = getOtherParticipant(activeConversation);
                    return (
                      <>
                        <div className="relative">
                          <img
                            src={getProfilePictureUrl(otherUser)}
                            alt={`${otherUser.firstName} ${otherUser.lastName}`}
                            className="w-12 h-12 rounded-full object-cover border-3 border-white shadow-lg"
                          />
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-white">
                            {otherUser.firstName} {otherUser.lastName}
                          </h2>
                          <p className="text-xs text-indigo-100">Active now</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-br from-gray-50 to-indigo-50/20">
                {messages.map((message) => {
                  const isOwn = message.sender._id === user.id;

                  return (
                    <div
                      key={message._id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                    >
                      <div className={`flex items-end gap-3 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isOwn && (
                          <img
                            src={getProfilePictureUrl(message.sender)}
                            alt={`${message.sender.firstName} ${message.sender.lastName}`}
                            className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-md"
                          />
                        )}
                        <div>
                          <div
                            className={`px-5 py-3 rounded-2xl shadow-md ${
                              isOwn
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                : 'bg-white text-gray-900 border border-gray-200'
                            }`}
                          >
                            <p className="break-words leading-relaxed">{message.content}</p>
                          </div>
                          <div className={`text-xs text-gray-500 mt-1.5 font-medium ${isOwn ? 'text-right' : 'text-left'}`}>
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
                    <div className="bg-white px-5 py-3 rounded-2xl border border-gray-200 shadow-md">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-5 border-t border-gray-200 bg-white">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder="Type a message..."
                    className="flex-1 px-5 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2"
                  >
                    <FaPaperPlane />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-indigo-50/20">
              <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <FaEnvelope className="text-6xl text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Select a Conversation</h3>
                <p className="text-gray-600 text-lg">Choose a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                    <FaUserPlus className="text-white text-lg" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">New Conversation</h2>
                </div>
                <button
                  onClick={() => {
                    setShowNewConversation(false);
                    setSearchQuery('');
                  }}
                  className="p-2.5 text-gray-500 hover:bg-white rounded-xl transition-all shadow-sm"
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="p-6 border-b border-gray-200">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members..."
                className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                autoFocus
              />
            </div>

            {/* Users List */}
            <div className="overflow-y-auto max-h-[50vh] p-4">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                    <FaUserPlus className="text-3xl text-indigo-600" />
                  </div>
                  <p className="text-gray-900 font-semibold mb-1">No users found</p>
                  <p className="text-sm text-gray-500">Try a different search term</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map(u => (
                    <div
                      key={u._id}
                      onClick={() => handleStartConversation(u)}
                      className="flex items-center gap-4 p-4 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:border-indigo-200 group"
                    >
                      <img
                        src={getProfilePictureUrl(u)}
                        alt={`${u.firstName} ${u.lastName}`}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 group-hover:border-indigo-600 transition-all shadow-md"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {u.firstName} {u.lastName}
                        </h3>
                        <p className="text-sm text-gray-600 capitalize">{u.role.replace('_', ' ')}</p>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 group-hover:from-indigo-600 group-hover:to-purple-600 flex items-center justify-center transition-all">
                        <FaUserPlus className="text-indigo-600 group-hover:text-white transition-colors text-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
