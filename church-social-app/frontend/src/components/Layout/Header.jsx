import { Link, useNavigate } from 'react-router-dom';
import { FaBell, FaEnvelope, FaSearch, FaUserCircle, FaTimes, FaCalendar } from 'react-icons/fa';
import useAuthStore from '../../store/authStore';
import { useState, useEffect, useRef } from 'react';
import { userAPI, eventAPI } from '../../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const Header = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);

  // Get profile picture URL
  const getProfilePictureUrl = () => {
    if (!user?.profilePicture || user.profilePicture === '/assets/glc-logo.png') {
      // Return a blank gray placeholder
      return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128"%3E%3Crect width="128" height="128" fill="%23e5e7eb"/%3E%3C/svg%3E';
    }
    if (user.profilePicture.includes('ui-avatars') || user.profilePicture.startsWith('http')) {
      return user.profilePicture;
    }
    return `${API_BASE_URL}${user.profilePicture}`;
  };

  // Search functionality with debouncing
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim()) {
        setSearchLoading(true);
        try {
          // Search across users and events in parallel
          const [usersResponse, eventsResponse] = await Promise.allSettled([
            userAPI.getUsers({ search: searchQuery, limit: 5 }),
            eventAPI.getEvents({ search: searchQuery, limit: 5 })
          ]);

          const results = [];

          // Add users to results
          if (usersResponse.status === 'fulfilled' && usersResponse.value?.data?.data) {
            usersResponse.value.data.data.forEach(user => {
              results.push({ ...user, type: 'user' });
            });
          }

          // Add events to results
          if (eventsResponse.status === 'fulfilled' && eventsResponse.value?.data?.data) {
            eventsResponse.value.data.data.forEach(event => {
              results.push({ ...event, type: 'event' });
            });
          }

          setSearchResults(results);
          setShowSearchResults(true);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setSearchLoading(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Handle click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSelect = (result) => {
    if (result.type === 'user') {
      navigate(`/profile/${result._id}`);
    } else if (result.type === 'event') {
      navigate(`/events/${result._id}`);
    }
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 shadow-lg z-50 h-16">
      <div className="flex items-center justify-between px-3 sm:px-6 h-full">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group">
          <div className="relative">
            <img
              src="/assets/glc-logo.png"
              alt="Global Life Church"
              className="h-12 w-12 object-contain rounded-full bg-white p-1 shadow-md group-hover:scale-110 transition-transform duration-200"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-xl font-bold text-white tracking-tight line-clamp-1">Global Life Church</span>
            <span className="text-xs text-blue-100 -mt-1 hidden sm:block">Connect • Grow • Serve</span>
          </div>
        </Link>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-xl mx-4 lg:mx-8" ref={searchRef}>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members, events..."
              className="w-full pl-10 pr-10 py-2.5 bg-white/90 backdrop-blur-sm border-2 border-white/50 rounded-xl focus:bg-white focus:border-white focus:ring-2 focus:ring-white/30 transition-all placeholder-gray-500"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FaTimes />
              </button>
            )}

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                {searchLoading ? (
                  <div className="px-4 py-3 text-center text-gray-500">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result, index) => (
                      <button
                        key={`${result.type}-${result._id}-${index}`}
                        onClick={() => handleSearchSelect(result)}
                        className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition"
                      >
                        {result.type === 'user' ? (
                          <>
                            <img
                              src={
                                result.profilePicture?.includes('ui-avatars') || result.profilePicture?.startsWith('http')
                                  ? result.profilePicture
                                  : result.profilePicture
                                  ? `${API_BASE_URL}${result.profilePicture}`
                                  : `https://ui-avatars.com/api/?name=${result.firstName}+${result.lastName || ''}&size=40`
                              }
                              alt={result.firstName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="flex-1 text-left">
                              <div className="font-medium text-gray-900">
                                {result.firstName} {result.lastName}
                              </div>
                              {result.role && (
                                <div className="text-sm text-gray-500 capitalize">
                                  {result.role}
                                </div>
                              )}
                            </div>
                            <FaUserCircle className="text-gray-400 text-lg" />
                          </>
                        ) : result.type === 'event' ? (
                          <>
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <FaCalendar className="text-blue-600 text-lg" />
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium text-gray-900">
                                {result.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(result.startDate).toLocaleDateString()}
                              </div>
                            </div>
                            <FaCalendar className="text-gray-400 text-lg" />
                          </>
                        ) : null}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3 text-center text-gray-500">
                    No results found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right side icons */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Link to="/messages" className="hidden sm:flex relative p-2.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all">
            <FaEnvelope className="text-xl" />
          </Link>

          <Link to="/notifications" className="hidden sm:flex relative p-2.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all">
            <FaBell className="text-xl" />
          </Link>

          {/* Profile Dropdown */}
          <div className="relative ml-1 sm:ml-2">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-1 sm:space-x-2 p-1.5 pr-2 sm:pr-3 rounded-lg hover:bg-white/20 transition-all"
            >
              <img
                src={getProfilePictureUrl()}
                alt={user?.firstName || 'User'}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-white/50"
              />
              <span className="hidden sm:inline font-semibold text-white">{user?.firstName}</span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2">
                <div className="px-4 py-2 text-xs text-gray-500 border-b">
                  Role: <span className="font-semibold text-blue-600 uppercase">{user?.role || 'member'}</span>
                </div>
                <Link
                  to={`/profile/${user?._id || user?.id}`}
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowProfileMenu(false)}
                >
                  My Profile
                </Link>
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowProfileMenu(false)}
                >
                  Settings
                </Link>
                <hr className="my-2" />
                <button
                  onClick={() => {
                    logout();
                    setShowProfileMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
