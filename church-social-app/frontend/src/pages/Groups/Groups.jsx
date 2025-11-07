import { useState, useEffect } from 'react';
import { groupAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaUsers, FaPlus, FaUserPlus, FaCheck } from 'react-icons/fa';
import useAuthStore from '../../store/authStore';
import { canCreateGroup } from '../../utils/permissions';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    category: 'ministry'
  });
  const { user } = useAuthStore();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await groupAPI.getGroups({ page: 1, limit: 20 });
      setGroups(response.data.data);
    } catch (error) {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const response = await groupAPI.createGroup(newGroup);
      setGroups([response.data.data, ...groups]);
      setNewGroup({ name: '', description: '', category: 'ministry' });
      setShowCreateModal(false);
      toast.success('Group created successfully!');
    } catch (error) {
      toast.error('Failed to create group');
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await groupAPI.joinGroup(groupId);
      setGroups(groups.map(group => {
        if (group._id === groupId) {
          return {
            ...group,
            members: [...group.members, user.id]
          };
        }
        return group;
      }));
      toast.success('Joined group successfully!');
    } catch (error) {
      toast.error('Failed to join group');
    }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      await groupAPI.leaveGroup(groupId);
      setGroups(groups.map(group => {
        if (group._id === groupId) {
          return {
            ...group,
            members: group.members.filter(id => id !== user.id)
          };
        }
        return group;
      }));
      toast.success('Left group successfully!');
    } catch (error) {
      toast.error('Failed to leave group');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading groups...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Groups & Ministries</h1>
          <p className="text-gray-600 mt-1">Connect with others who share your interests</p>
        </div>
        {canCreateGroup(user) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <FaPlus /> Create Group
          </button>
        )}
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => {
          const isMember = group.members.includes(user?.id);
          return (
            <div key={group._id} className="card hover:shadow-lg transition-shadow">
              {/* Group Header */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <FaUsers className="text-primary-600 text-2xl" />
                  <h3 className="text-xl font-semibold text-gray-900">{group.name}</h3>
                </div>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                  {group.category}
                </span>
              </div>

              {/* Group Description */}
              <p className="text-gray-600 mb-4 line-clamp-3">{group.description}</p>

              {/* Group Stats */}
              <div className="flex items-center justify-between py-3 border-t border-b mb-4">
                <span className="text-sm text-gray-600">
                  {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                </span>
              </div>

              {/* Action Button */}
              {isMember ? (
                <button
                  onClick={() => handleLeaveGroup(group._id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  <FaCheck /> Joined
                </button>
              ) : (
                <button
                  onClick={() => handleJoinGroup(group._id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  <FaUserPlus /> Join Group
                </button>
              )}
            </div>
          );
        })}
      </div>

      {groups.length === 0 && (
        <div className="card text-center py-12">
          <FaUsers className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No groups yet. Create the first one!</p>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Group</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="input"
                  placeholder="Youth Ministry, Bible Study, etc."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  className="textarea"
                  rows="4"
                  placeholder="What is this group about?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={newGroup.category}
                  onChange={(e) => setNewGroup({ ...newGroup, category: e.target.value })}
                  className="input"
                >
                  <option value="ministry">Ministry</option>
                  <option value="bible_study">Bible Study</option>
                  <option value="prayer">Prayer Group</option>
                  <option value="outreach">Outreach</option>
                  <option value="worship">Worship</option>
                  <option value="youth">Youth</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
