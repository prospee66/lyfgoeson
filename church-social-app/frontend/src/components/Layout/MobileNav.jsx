import { NavLink } from 'react-router-dom';
import { FaHome, FaNewspaper, FaBroadcastTower, FaPrayingHands, FaVideo } from 'react-icons/fa';

const MobileNav = () => {
  const navItems = [
    { path: '/', icon: FaHome, label: 'Home' },
    { path: '/feed', icon: FaNewspaper, label: 'Feed' },
    { path: '/live', icon: FaBroadcastTower, label: 'Live' },
    { path: '/prayers', icon: FaPrayingHands, label: 'Prayers' },
    { path: '/sermons', icon: FaVideo, label: 'Sermons' }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`text-xl mb-1 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className={`text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
