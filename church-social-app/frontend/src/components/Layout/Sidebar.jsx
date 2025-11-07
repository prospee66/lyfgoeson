import { NavLink } from 'react-router-dom';
import { FaHome, FaNewspaper, FaCalendar, FaUsers, FaPrayingHands, FaVideo, FaEnvelope, FaUserFriends } from 'react-icons/fa';

const Sidebar = () => {
  const navItems = [
    { path: '/', icon: FaHome, label: 'Home' },
    { path: '/feed', icon: FaNewspaper, label: 'Feed' },
    { path: '/events', icon: FaCalendar, label: 'Events' },
    { path: '/groups', icon: FaUsers, label: 'Groups' },
    { path: '/prayers', icon: FaPrayingHands, label: 'Prayers' },
    { path: '/sermons', icon: FaVideo, label: 'Sermons' },
    { path: '/messages', icon: FaEnvelope, label: 'Messages' },
    { path: '/members', icon: FaUserFriends, label: 'Members' }
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white shadow-lg z-40">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <item.icon className="text-xl" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
