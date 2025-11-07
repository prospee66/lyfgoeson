# Church Social Media App - Backend API

Backend REST API for the Church Social Media application built with Node.js, Express, and MongoDB.

## Features

- **Authentication & Authorization** - JWT-based auth with role-based access control
- **User Management** - User profiles, roles (member, pastor, admin, visitor)
- **Social Feed** - Posts with likes, comments, and shares
- **Events** - Create and manage church events with RSVP
- **Groups/Ministries** - Small groups and ministry management
- **Prayer Requests** - Share and pray for prayer requests
- **Sermons Library** - Audio/video sermon archive
- **Messaging** - Real-time private and group messaging
- **Notifications** - Real-time notifications for user activities
- **Real-time Features** - Socket.IO for live updates

## Tech Stack

- **Node.js** & **Express.js**
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Multer** for file uploads
- **Cloudinary** for media storage (optional)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the values in `.env` file

3. Make sure MongoDB is running locally or update `MONGODB_URI` in `.env`

4. Start the server:
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

The API will be running on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user (admin only)

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/share` - Share post

### Comments
- `POST /api/comments` - Create comment
- `DELETE /api/comments/:id` - Delete comment
- `POST /api/comments/:id/like` - Like/unlike comment

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `POST /api/events/:id/rsvp` - RSVP to event

### Groups
- `GET /api/groups` - Get all groups
- `GET /api/groups/:id` - Get single group
- `POST /api/groups` - Create group
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group
- `POST /api/groups/:id/join` - Join group
- `POST /api/groups/:id/leave` - Leave group

### Prayers
- `GET /api/prayers` - Get all prayer requests
- `GET /api/prayers/:id` - Get single prayer request
- `POST /api/prayers` - Create prayer request
- `PUT /api/prayers/:id` - Update prayer request
- `DELETE /api/prayers/:id` - Delete prayer request
- `POST /api/prayers/:id/pray` - Pray for request
- `POST /api/prayers/:id/respond` - Add response to prayer

### Sermons
- `GET /api/sermons` - Get all sermons
- `GET /api/sermons/:id` - Get single sermon
- `POST /api/sermons` - Create sermon (pastor/admin only)
- `PUT /api/sermons/:id` - Update sermon
- `DELETE /api/sermons/:id` - Delete sermon
- `POST /api/sermons/:id/like` - Like/unlike sermon
- `POST /api/sermons/:id/comment` - Add comment to sermon

### Messages
- `GET /api/messages/conversations` - Get all conversations
- `GET /api/messages/conversations/:id` - Get single conversation
- `GET /api/messages/conversations/:conversationId/messages` - Get messages
- `POST /api/messages/conversations` - Create conversation
- `POST /api/messages` - Send message
- `PUT /api/messages/conversations/:conversationId/read` - Mark as read

### Notifications
- `GET /api/notifications` - Get all notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## Socket.IO Events

### Client → Server
- `user-online` - User comes online
- `join-conversation` - Join a conversation room
- `leave-conversation` - Leave a conversation room
- `typing-start` - User starts typing
- `typing-stop` - User stops typing
- `message-read` - Message read receipt
- `send-notification` - Send notification to user

### Server → Client
- `user-status-change` - User online/offline status
- `new-message` - New message received
- `new-post` - New post created
- `new-notification` - New notification
- `user-typing` - User is typing
- `user-stop-typing` - User stopped typing
- `message-read-receipt` - Message was read

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── post.controller.js
│   │   ├── comment.controller.js
│   │   ├── event.controller.js
│   │   ├── group.controller.js
│   │   ├── prayer.controller.js
│   │   ├── sermon.controller.js
│   │   ├── message.controller.js
│   │   └── notification.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── upload.middleware.js
│   ├── models/
│   │   ├── User.model.js
│   │   ├── Post.model.js
│   │   ├── Comment.model.js
│   │   ├── Event.model.js
│   │   ├── Group.model.js
│   │   ├── Prayer.model.js
│   │   ├── Sermon.model.js
│   │   ├── Message.model.js
│   │   └── Notification.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── post.routes.js
│   │   ├── comment.routes.js
│   │   ├── event.routes.js
│   │   ├── group.routes.js
│   │   ├── prayer.routes.js
│   │   ├── sermon.routes.js
│   │   ├── message.routes.js
│   │   └── notification.routes.js
│   └── socket/
│       └── socket.js
├── .env
├── .env.example
├── package.json
└── server.js
```

## License

MIT
