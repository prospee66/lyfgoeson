# Church Social - Frontend

React frontend application for the Church Social Media platform.

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router v6** - Routing
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication
- **React Icons** - Icon library
- **React Toastify** - Notifications
- **date-fns** - Date formatting

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Auth/           # Authentication components
│   └── Layout/         # Layout components (Header, Sidebar)
├── pages/              # Page components
│   ├── Auth/           # Login, Register
│   ├── Feed/           # Social feed
│   ├── Events/         # Events pages
│   ├── Groups/         # Groups pages
│   ├── Prayers/        # Prayer requests
│   ├── Sermons/        # Sermon library
│   ├── Messages/       # Messaging
│   ├── Profile/        # User profiles
│   └── Members/        # Member directory
├── services/           # API and external services
│   ├── api.js         # Axios API client
│   └── socket.js      # Socket.IO client
├── store/             # Zustand state stores
│   └── authStore.js   # Authentication state
├── App.jsx            # Main app with routing
├── main.jsx           # Entry point
└── index.css          # Global styles

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Runs on `http://localhost:5173`

## Build

```bash
npm run build
```

Builds the app for production to the `dist` folder.

## Preview Production Build

```bash
npm run preview
```

## Environment Variables

Create a `.env` file in the root:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Key Features

### Authentication
- JWT-based authentication
- Protected routes
- Automatic token refresh
- Persistent login state

### State Management
- Zustand for global state
- Auth store for user state
- Local storage persistence

### API Integration
- Axios interceptors for auth tokens
- Centralized API service
- Error handling and retry logic

### Real-time Features
- Socket.IO for live updates
- Real-time messaging
- Live notifications
- Online status indicators

### UI/UX
- Responsive design (mobile, tablet, desktop)
- Tailwind CSS utility classes
- Custom component library
- Toast notifications for feedback
- Loading states and error handling

## Available Pages

- `/` - Home dashboard
- `/feed` - Social feed
- `/events` - Events calendar
- `/groups` - Groups and ministries
- `/prayers` - Prayer requests
- `/sermons` - Sermon library
- `/messages` - Direct messaging
- `/profile/:id` - User profile
- `/members` - Member directory
- `/notifications` - Notifications
- `/settings` - User settings

## Component Guidelines

### Creating New Components

1. Use functional components with hooks
2. Keep components small and focused
3. Use prop-types or TypeScript for type safety
4. Follow naming conventions (PascalCase for components)

Example:

```jsx
import { useState } from 'react';

const MyComponent = ({ title, onSubmit }) => {
  const [value, setValue] = useState('');

  return (
    <div className="card">
      <h2>{title}</h2>
      {/* Component content */}
    </div>
  );
};

export default MyComponent;
```

### Using the Auth Store

```jsx
import useAuthStore from '../store/authStore';

const MyComponent = () => {
  const { user, login, logout, isAuthenticated } = useAuthStore();

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user.firstName}!</p>
      ) : (
        <button onClick={() => login(credentials)}>Login</button>
      )}
    </div>
  );
};
```

### Making API Calls

```jsx
import { postAPI } from '../services/api';
import { toast } from 'react-toastify';

const MyComponent = () => {
  const fetchPosts = async () => {
    try {
      const response = await postAPI.getPosts({ page: 1, limit: 10 });
      setPosts(response.data.data);
    } catch (error) {
      toast.error('Failed to load posts');
    }
  };

  return <div>{/* Component content */}</div>;
};
```

## Styling with Tailwind

### Custom Classes

Available in `index.css`:

```css
.btn - Base button
.btn-primary - Primary button
.btn-secondary - Secondary button
.btn-outline - Outline button
.card - Card container
.input - Text input
.textarea - Textarea input
```

### Usage

```jsx
<button className="btn btn-primary">
  Click Me
</button>

<div className="card">
  <h2 className="text-xl font-bold mb-4">Card Title</h2>
  <p>Card content</p>
</div>
```

## Socket.IO Usage

```jsx
import { useEffect } from 'react';
import socketService from '../services/socket';

const MyComponent = () => {
  useEffect(() => {
    // Connect to socket
    socketService.connect(userId);

    // Listen for events
    socketService.onNewMessage((message) => {
      console.log('New message:', message);
    });

    // Cleanup
    return () => {
      socketService.disconnect();
    };
  }, []);

  return <div>{/* Component content */}</div>;
};
```

## Best Practices

1. **Performance**
   - Use React.memo for expensive components
   - Implement virtualization for long lists
   - Lazy load routes and heavy components

2. **Error Handling**
   - Always handle API errors
   - Show user-friendly error messages
   - Implement error boundaries

3. **Accessibility**
   - Use semantic HTML
   - Add ARIA labels
   - Ensure keyboard navigation

4. **Security**
   - Never store sensitive data in localStorage
   - Validate user input
   - Sanitize HTML content

## Troubleshooting

### Common Issues

**API calls failing:**
- Check if backend is running
- Verify API_URL in .env
- Check browser console for errors

**Socket.IO not connecting:**
- Verify SOCKET_URL in .env
- Check CORS settings on backend
- Ensure backend Socket.IO is running

**Styles not loading:**
- Run `npm install` to ensure Tailwind is installed
- Check if PostCSS config is correct
- Clear browser cache

## License

MIT
