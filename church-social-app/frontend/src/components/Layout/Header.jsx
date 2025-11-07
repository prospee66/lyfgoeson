import { Link, useNavigate } from 'react-router-dom';
import { FaBell, FaEnvelope, FaSearch, FaUserCircle, FaTimes, FaUsers, FaCalendar } from 'react-icons/fa';
import useAuthStore from '../../store/authStore';
import { useState, useEffect, useRef } from 'react';
import { userAPI, groupAPI, eventAPI } from '../../services/api';

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
    if (!user?.profilePicture) {
      return `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName || ''}&size=128`;
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
          // Search across users, groups, and events in parallel
          const [usersResponse, groupsResponse, eventsResponse] = await Promise.allSettled([
            userAPI.getUsers({ search: searchQuery, limit: 3 }),
            groupAPI.getGroups({ search: searchQuery, limit: 3 }),
            eventAPI.getEvents({ search: searchQuery, limit: 3 })
          ]);

          const results = [];

          // Add users to results
          if (usersResponse.status === 'fulfilled' && usersResponse.value?.data?.data) {
            usersResponse.value.data.data.forEach(user => {
              results.push({ ...user, type: 'user' });
            });
          }

          // Add groups to results
          if (groupsResponse.status === 'fulfilled' && groupsResponse.value?.data?.data) {
            groupsResponse.value.data.data.forEach(group => {
              results.push({ ...group, type: 'group' });
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
    } else if (result.type === 'group') {
      navigate(`/groups/${result._id}`);
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
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50 h-16">
      <div className="flex items-center justify-between px-6 h-full">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3">
          <img
            src="/assets/glc-logo.png"
            alt="Global Life Church"
            className="h-12 w-12 object-contain"
          />
          <span className="text-xl font-bold text-gray-900">Global Life Church</span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl mx-8" ref={searchRef}>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members, groups, events..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                        ) : result.type === 'group' ? (
                          <>
                            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                              <FaUsers className="text-primary-600 text-lg" />
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium text-gray-900">
                                {result.name}
                              </div>
                              <div className="text-sm text-gray-500 capitalize">
                                {result.groupType || 'Group'}
                              </div>
                            </div>
                            <FaUsers className="text-gray-400 text-lg" />
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
        <div className="flex items-center space-x-4">
          <Link to="/messages" className="relative p-2 text-gray-600 hover:text-primary-600 transition">
            <FaEnvelope className="text-xl" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </Link>

          <Link to="/notifications" className="relative p-2 text-gray-600 hover:text-primary-600 transition">
            <FaBell className="text-xl" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </Link>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
            >
              <img
                src={getProfilePictureUrl()}
                alt={user?.firstName || 'User'}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="font-medium text-gray-700">{user?.firstName}</span>
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
