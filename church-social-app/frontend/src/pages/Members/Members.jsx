import { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaPhone, FaCalendar, FaSearch, FaUsers, FaChurch, FaHeadphones } from 'react-icons/fa';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import socketService from '../../services/socket';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const getProfilePictureUrl = (member) => {
    if (!member?.profilePicture || member.profilePicture === '/assets/glc-logo.png') {
      // Return a blank gray placeholder
      return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23e5e7eb"/%3E%3C/svg%3E';
    }
    if (member.profilePicture.includes('ui-avatars') || member.profilePicture.startsWith('http')) {
      return member.profilePicture;
    }
    return `${API_BASE_URL}${member.profilePicture}`;
  };

  useEffect(() => {
    fetchMembers();

    // Connect socket
    socketService.connect(user?.id);

    // Listen for new member registrations
    socketService.onNewMember((newMember) => {
      setMembers(prevMembers => [newMember, ...prevMembers]);
      toast.success(`${newMember.firstName} ${newMember.lastName} joined the church!`);
    });

    return () => {
      socketService.removeListener('new-member');
    };
  }, [user]);

  const fetchMembers = async () => {
    try {
      const response = await userAPI.getUsers({ limit: 100 });
      setMembers(response.data.data);
    } catch (error) {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      pastor: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white',
      sound_engineer: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
      member: 'bg-gradient-to-r from-green-500 to-teal-500 text-white'
    };
    return colors[role] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
  };

  const getRoleIcon = (role) => {
    const icons = {
      pastor: FaChurch,
      sound_engineer: FaHeadphones,
      member: FaUser
    };
    return icons[role] || FaUser;
  };

  const getRoleLabel = (role) => {
    const labels = {
      pastor: 'Pastor',
      sound_engineer: 'Sound Engineer',
      member: 'Member'
    };
    return labels[role] || role;
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = `${member.firstName} ${member.lastName} ${member.email}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return <div className="text-center py-12">Loading members...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 p-8 shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <FaUsers className="text-3xl text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Church Members</h1>
          </div>
          <p className="text-blue-100 text-lg mt-2">
            Connect with {members.length} members of our church community
          </p>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members by name or email..."
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-5 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-gray-900 font-medium cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="pastor">Pastor</option>
            <option value="sound_engineer">Sound Engineer</option>
            <option value="member">Member</option>
          </select>
        </div>
      </div>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg text-center py-16 border border-gray-100">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
            <FaUser className="text-4xl text-blue-600" />
          </div>
          <p className="text-gray-500 text-lg">No members found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => {
            const RoleIcon = getRoleIcon(member.role);
            return (
              <div
                key={member._id}
                onClick={() => navigate(`/profile/${member._id}`)}
                className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer transform hover:-translate-y-1"
              >
                {/* Gradient Header */}
                <div className="h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 relative">
                  <div className="absolute inset-0 bg-black/10"></div>
                </div>

                {/* Profile Section */}
                <div className="px-4 pb-4">
                  <div className="flex flex-col items-center -mt-10 relative">
                    {/* Profile Picture with Gradient Border */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full p-1">
                        <div className="w-full h-full bg-white rounded-full"></div>
                      </div>
                      <img
                        src={getProfilePictureUrl(member)}
                        alt={`${member.firstName} ${member.lastName}`}
                        className="relative w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    </div>

                    {/* Name and Role */}
                    <div className="text-center mt-3 w-full">
                      <h3 className="text-lg font-bold text-gray-900 mb-1.5">
                        {member.firstName} {member.lastName}
                      </h3>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm ${getRoleBadgeColor(member.role)}`}>
                        <RoleIcon className="text-xs" />
                        {getRoleLabel(member.role)}
                      </span>
                    </div>

                    {/* Contact Info */}
                    <div className="mt-4 space-y-2 w-full">
                      <div className="flex items-center gap-2 text-gray-600 bg-gray-50 rounded-lg p-2">
                        <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <FaEnvelope className="text-blue-600 text-xs" />
                        </div>
                        <span className="text-xs truncate">{member.email}</span>
                      </div>

                      {member.phoneNumber && (
                        <div className="flex items-center gap-2 text-gray-600 bg-gray-50 rounded-lg p-2">
                          <div className="w-6 h-6 rounded-md bg-green-100 flex items-center justify-center flex-shrink-0">
                            <FaPhone className="text-green-600 text-xs" />
                          </div>
                          <span className="text-xs">{member.phoneNumber}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-gray-600 bg-gray-50 rounded-lg p-2">
                        <div className="w-6 h-6 rounded-md bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <FaCalendar className="text-purple-600 text-xs" />
                        </div>
                        <span className="text-xs">
                          Joined {format(new Date(member.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>

                    {/* Bio */}
                    {member.bio && (
                      <div className="mt-3 w-full">
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-100">
                          <p className="text-xs text-gray-700 line-clamp-2 text-center italic">{member.bio}</p>
                        </div>
                      </div>
                    )}

                    {/* View Profile Button */}
                    <div className="mt-3 w-full">
                      <button className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm group-hover:shadow-md">
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
              <FaChurch className="text-white text-xl" />
            </div>
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
              {members.filter(m => m.role === 'pastor').length}
            </div>
          </div>
          <div className="text-sm font-semibold text-gray-600">Pastors</div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <FaHeadphones className="text-white text-xl" />
            </div>
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              {members.filter(m => m.role === 'sound_engineer').length}
            </div>
          </div>
          <div className="text-sm font-semibold text-gray-600">Sound Engineers</div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
              <FaUsers className="text-white text-xl" />
            </div>
            <div className="text-4xl font-bold bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent">
              {members.filter(m => m.role === 'member').length}
            </div>
          </div>
          <div className="text-sm font-semibold text-gray-600">Members</div>
        </div>
      </div>
    </div>
  );
};

export default Members;
