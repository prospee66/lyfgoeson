# Global Life Church - Social Media App

A comprehensive social media platform designed specifically for Global Life Church community to connect, grow, and serve together.

## Features

### Implemented Features
- User Authentication (Register/Login with JWT)
- Social Feed (Create posts, like, comment, share)
- Real-time messaging with Socket.IO
- Events calendar and management
- Groups and ministries
- Prayer requests with responses
- Sermon library (audio/video)
- Member directory
- Notifications system
- Role-based access control (Member, Pastor, Admin)
- Responsive design with Tailwind CSS

### Key Capabilities
- **Social Networking**: Post updates, share media, interact with likes and comments
- **Event Management**: Create events, RSVP, track attendance
- **Community Groups**: Join ministries and small groups
- **Prayer Wall**: Share and pray for requests, mark as answered
- **Media Library**: Access sermon recordings and church media
- **Real-time Chat**: Private and group messaging
- **Notifications**: Stay updated with real-time alerts

## Tech Stack

### Backend
- **Node.js** & **Express.js**
- **MongoDB** with Mongoose
- **Socket.IO** for real-time features
- **JWT** for authentication
- **Bcrypt** for password security

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Axios** for API requests
- **Socket.IO Client** for real-time updates

## Project Structure

```
church-social-app/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth, error handling
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   └── socket/         # Socket.IO setup
│   ├── .env                # Environment variables
│   ├── package.json
│   └── server.js          # Entry point
│
└── frontend/               # React application
    ├── src/
    │   ├── components/    # Reusable components
    │   ├── pages/         # Page components
    │   ├── services/      # API and socket services
    │   ├── store/         # Zustand stores
    │   ├── App.jsx        # Main app component
    │   └── main.jsx       # Entry point
    ├── package.json
    └── vite.config.js
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example` and configure:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/church-social
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

4. Start MongoDB (if running locally):
```bash
# On Windows
net start MongoDB

# On macOS/Linux
sudo systemctl start mongod
```

5. Start the backend server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be running on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional):
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm run dev
```

The app will be running on `http://localhost:5173`

### Running Both Servers

You can run both backend and frontend simultaneously in separate terminal windows:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Default Test Accounts

You can create test accounts by registering through the UI. Here are suggested test roles:

**Admin Account**
- Email: admin@church.com
- Password: admin123
- Role: Admin

**Pastor Account**
- Email: pastor@church.com
- Password: pastor123
- Role: Pastor

**Member Account**
- Email: member@church.com
- Password: member123
- Role: Member

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Main Resource Endpoints
- `/api/users` - User management
- `/api/posts` - Social feed posts
- `/api/comments` - Post comments
- `/api/events` - Church events
- `/api/groups` - Groups and ministries
- `/api/prayers` - Prayer requests
- `/api/sermons` - Sermon library
- `/api/messages` - Messaging system
- `/api/notifications` - User notifications

For detailed API documentation, see [backend/README.md](backend/README.md)

## Socket.IO Events

The application uses Socket.IO for real-time features:

### Client Events
- `user-online` - User connects
- `join-conversation` - Join chat room
- `typing-start` - User typing indicator
- `message-read` - Mark message as read

### Server Events
- `new-message` - New chat message
- `new-post` - New feed post
- `new-notification` - New notification
- `user-status-change` - User online/offline

## Development

### Adding New Features

1. **Backend**: Create model → Create controller → Create routes → Add to server.js
2. **Frontend**: Create API service → Create page/component → Add route to App.jsx

### Code Style
- Use ES6+ syntax
- Follow consistent naming conventions
- Add comments for complex logic
- Use functional components in React

## Deployment

### Backend Deployment (e.g., Heroku, Railway, Render)
1. Set environment variables
2. Ensure MongoDB connection string is configured
3. Deploy with `npm start` command

### Frontend Deployment (e.g., Vercel, Netlify)
1. Build the production bundle: `npm run build`
2. Deploy the `dist` folder
3. Configure environment variables

### Environment Variables for Production
- Update `JWT_SECRET` with a strong secret key
- Set `NODE_ENV=production`
- Configure production MongoDB URI
- Update `FRONTEND_URL` to production domain

## Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Email notifications
- [ ] Video streaming for live services
- [ ] Online giving/donations
- [ ] Volunteer management
- [ ] Attendance tracking
- [ ] Admin dashboard with analytics
- [ ] Content moderation tools
- [ ] Multi-language support

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License - feel free to use this project for your church community!

## Support

For questions or issues, please open an issue on GitHub or contact the development team.

## Acknowledgments

- Built with love for church communities
- Inspired by the need for better church communication tools
- Thanks to all open-source contributors

---

**May this platform help your church community grow closer together!**
