import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';
import socketService from './services/socket';

// Layout
import Layout from './components/Layout/Layout';
import PrivateRoute from './components/Auth/PrivateRoute';

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Home from './pages/Home/Home';
import Feed from './pages/Feed/Feed';
import Events from './pages/Events/Events';
import EventDetails from './pages/Events/EventDetails';
import Prayers from './pages/Prayers/Prayers';
import Sermons from './pages/Sermons/Sermons';
import SermonDetails from './pages/Sermons/SermonDetails';
import Messages from './pages/Messages/Messages';
import Profile from './pages/Profile/Profile';
import Members from './pages/Members/Members';
import Notifications from './pages/Notifications/Notifications';
import Settings from './pages/Settings/Settings';
import NotFound from './pages/NotFound';

function App() {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      socketService.connect(user.id);
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, user]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={!isAuthenticated ? <Login /> : <Navigate to="/feed" />}
      />
      <Route
        path="/register"
        element={!isAuthenticated ? <Register /> : <Navigate to="/feed" />}
      />

      {/* Private Routes */}
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/" element={<Home />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/prayers" element={<Prayers />} />
        <Route path="/sermons" element={<Sermons />} />
        <Route path="/sermons/:id" element={<SermonDetails />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:conversationId" element={<Messages />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/members" element={<Members />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
