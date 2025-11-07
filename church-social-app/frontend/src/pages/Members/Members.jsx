import { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaPhone, FaCalendar, FaUserTag, FaSearch } from 'react-icons/fa';
import { format } from 'date-fns';
import useAuthStore from '../../store/authStore';
import socketService from '../../services/socket';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const { user } = useAuthStore();

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
      admin: 'bg-red-100 text-red-800',
      pastor: 'bg-purple-100 text-purple-800',
      sound_engineer: 'bg-blue-100 text-blue-800',
      member: 'bg-green-100 text-green-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Admin',
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Church Members</h1>
          <p className="text-gray-600 mt-1">Total Members: {members.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="pastor">Pastor</option>
            <option value="sound_engineer">Sound Engineer</option>
            <option value="member">Member</option>
          </select>
        </div>
      </div>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <div className="card text-center py-12">
          <FaUser className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No members found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <div key={member._id} className="card hover:shadow-xl transition-all">
              {/* Profile Section */}
              <div className="flex items-start gap-4">
                <img
                  src={member.profilePicture || `https://ui-avatars.com/api/?name=${member.firstName}+${member.lastName}&background=random`}
                  alt={`${member.firstName} ${member.lastName}`}
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 truncate">
                    {member.firstName} {member.lastName}
                  </h3>
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getRoleBadgeColor(member.role)}`}>
                    {getRoleLabel(member.role)}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <FaEnvelope className="text-blue-600 flex-shrink-0" />
                  <span className="text-sm truncate">{member.email}</span>
                </div>

                {member.phoneNumber && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaPhone className="text-green-600 flex-shrink-0" />
                    <span className="text-sm">{member.phoneNumber}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-600">
                  <FaCalendar className="text-purple-600 flex-shrink-0" />
                  <span className="text-sm">
                    Joined {format(new Date(member.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>

              {/* Bio */}
              {member.bio && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 line-clamp-2">{member.bio}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">
            {members.filter(m => m.role === 'admin').length}
          </div>
          <div className="text-sm text-gray-600 mt-1">Admins</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-purple-600">
            {members.filter(m => m.role === 'pastor').length}
          </div>
          <div className="text-sm text-gray-600 mt-1">Pastors</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">
            {members.filter(m => m.role === 'sound_engineer').length}
          </div>
          <div className="text-sm text-gray-600 mt-1">Sound Engineers</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">
            {members.filter(m => m.role === 'member').length}
          </div>
          <div className="text-sm text-gray-600 mt-1">Members</div>
        </div>
      </div>
    </div>
  );
};

export default Members;
