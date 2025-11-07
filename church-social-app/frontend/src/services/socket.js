import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(userId) {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        auth: {
          token: localStorage.getItem('token')
        }
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        if (userId) {
          this.socket.emit('user-online', userId);
        }
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Message events
  joinConversation(conversationId) {
    if (this.socket) {
      this.socket.emit('join-conversation', conversationId);
    }
  }

  leaveConversation(conversationId) {
    if (this.socket) {
      this.socket.emit('leave-conversation', conversationId);
    }
  }

  sendTypingIndicator(conversationId, userId, userName) {
    if (this.socket) {
      this.socket.emit('typing-start', { conversationId, userId, userName });
    }
  }

  stopTypingIndicator(conversationId, userId) {
    if (this.socket) {
      this.socket.emit('typing-stop', { conversationId, userId });
    }
  }

  markMessageAsRead(conversationId, messageId, userId) {
    if (this.socket) {
      this.socket.emit('message-read', { conversationId, messageId, userId });
    }
  }

  // Event listeners
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new-message', callback);
    }
  }

  onNewPost(callback) {
    if (this.socket) {
      this.socket.on('new-post', callback);
    }
  }

  onNewNotification(callback) {
    if (this.socket) {
      this.socket.on('new-notification', callback);
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user-typing', callback);
    }
  }

  onUserStopTyping(callback) {
    if (this.socket) {
      this.socket.on('user-stop-typing', callback);
    }
  }

  onUserStatusChange(callback) {
    if (this.socket) {
      this.socket.on('user-status-change', callback);
    }
  }

  // Deletion events
  onPostDeleted(callback) {
    if (this.socket) {
      this.socket.on('post-deleted', callback);
    }
  }

  onEventDeleted(callback) {
    if (this.socket) {
      this.socket.on('event-deleted', callback);
    }
  }

  onSermonDeleted(callback) {
    if (this.socket) {
      this.socket.on('sermon-deleted', callback);
    }
  }

  // New member event
  onNewMember(callback) {
    if (this.socket) {
      this.socket.on('new-member', callback);
    }
  }

  // Remove listeners
  removeListener(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }
}

export default new SocketService();
