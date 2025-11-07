export const setupSocketIO = (io) => {
  // Store connected users
  const users = new Map();

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // User joins
    socket.on('user-online', (userId) => {
      users.set(userId, socket.id);
      socket.userId = userId;
      io.emit('user-status-change', { userId, status: 'online' });
    });

    // Join conversation room
    socket.on('join-conversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave-conversation', (conversationId) => {
      socket.leave(conversationId);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Typing indicator
    socket.on('typing-start', ({ conversationId, userId, userName }) => {
      socket.to(conversationId).emit('user-typing', { userId, userName });
    });

    socket.on('typing-stop', ({ conversationId, userId }) => {
      socket.to(conversationId).emit('user-stop-typing', { userId });
    });

    // Message read receipt
    socket.on('message-read', ({ conversationId, messageId, userId }) => {
      socket.to(conversationId).emit('message-read-receipt', { messageId, userId });
    });

    // Notification events
    socket.on('send-notification', ({ recipientId, notification }) => {
      const recipientSocketId = users.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('new-notification', notification);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      if (socket.userId) {
        users.delete(socket.userId);
        io.emit('user-status-change', { userId: socket.userId, status: 'offline' });
      }
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
};
