import { NavLink } from 'react-router-dom';
import { FaHome, FaNewspaper, FaCalendar, FaPrayingHands, FaVideo, FaEnvelope, FaUserFriends } from 'react-icons/fa';

const Sidebar = () => {
  const navItems = [
    { path: '/', icon: FaHome, label: 'Home', color: 'text-blue-600' },
    { path: '/feed', icon: FaNewspaper, label: 'Feed', color: 'text-purple-600' },
    { path: '/events', icon: FaCalendar, label: 'Events', color: 'text-green-600' },
    { path: '/prayers', icon: FaPrayingHands, label: 'Prayers', color: 'text-pink-600' },
    { path: '/sermons', icon: FaVideo, label: 'Sermons', color: 'text-red-600' },
    { path: '/messages', icon: FaEnvelope, label: 'Messages', color: 'text-indigo-600' },
    { path: '/members', icon: FaUserFriends, label: 'Members', color: 'text-teal-600' }
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 shadow-sm z-40">
      {/* Sidebar Header */}
      <div className="px-6 py-5 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Navigation</h2>
      </div>

      {/* Navigation Items */}
      <nav className="px-3 py-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-200'
                  : 'text-gray-700 hover:bg-white hover:shadow-md'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`text-xl transition-all duration-200 ${isActive ? 'text-white' : item.color}`} />
                <span className="font-semibold text-[15px]">{item.label}</span>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
        <div className="text-center">
          <p className="text-xs text-gray-500">Global Life Church</p>
          <p className="text-xs text-gray-400 mt-1">v1.0.0</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
