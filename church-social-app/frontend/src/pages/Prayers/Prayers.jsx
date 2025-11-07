import { useState, useEffect } from 'react';
import { prayerAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaPrayingHands, FaPlus, FaHeart } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import useAuthStore from '../../store/authStore';

const Prayers = () => {
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPrayer, setNewPrayer] = useState({
    title: '',
    description: '',
    category: 'personal',
    isAnonymous: false
  });
  const { user } = useAuthStore();

  useEffect(() => {
    fetchPrayers();
  }, []);

  const fetchPrayers = async () => {
    try {
      const response = await prayerAPI.getPrayers({ page: 1, limit: 20 });
      setPrayers(response.data.data);
    } catch (error) {
      toast.error('Failed to load prayer requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrayer = async (e) => {
    e.preventDefault();
    try {
      const response = await prayerAPI.createPrayer(newPrayer);
      setPrayers([response.data.data, ...prayers]);
      setNewPrayer({ title: '', description: '', category: 'personal', isAnonymous: false });
      setShowCreateModal(false);
      toast.success('Prayer request shared successfully!');
    } catch (error) {
      toast.error('Failed to create prayer request');
    }
  };

  const handlePray = async (prayerId) => {
    try {
      await prayerAPI.prayFor(prayerId);
      setPrayers(prayers.map(prayer => {
        if (prayer._id === prayerId) {
          const hasPrayed = prayer.prayedBy.includes(user.id);
          return {
            ...prayer,
            prayedBy: hasPrayed
              ? prayer.prayedBy.filter(id => id !== user.id)
              : [...prayer.prayedBy, user.id]
          };
        }
        return prayer;
      }));
      toast.success('Prayer recorded!');
    } catch (error) {
      toast.error('Failed to record prayer');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading prayer requests...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prayer Requests</h1>
          <p className="text-gray-600 mt-1">Share your prayer needs and pray for others</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <FaPlus /> Share Prayer Request
        </button>
      </div>

      {/* Prayer Requests List */}
      <div className="space-y-4">
        {prayers.map((prayer) => {
          const hasPrayed = prayer.prayedBy.includes(user?.id);
          const prayerCount = prayer.prayedBy.length;

          return (
            <div key={prayer._id} className="card hover:shadow-lg transition-shadow">
              {/* Prayer Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0">
                  {prayer.isAnonymous ? (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white">
                      <FaPrayingHands />
                    </div>
                  ) : (
                    <img
                      src={prayer.user?.profilePicture || '/assets/glc-logo.png'}
                      alt={prayer.user?.firstName || 'User'}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">
                      {prayer.isAnonymous ? 'Anonymous' : `${prayer.user?.firstName} ${prayer.user?.lastName}`}
                    </h3>
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                      {prayer.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(prayer.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Prayer Content */}
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{prayer.title}</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{prayer.description}</p>
              </div>

              {/* Prayer Actions */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <button
                  onClick={() => handlePray(prayer._id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    hasPrayed
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                  }`}
                >
                  <FaHeart className={hasPrayed ? 'text-white' : 'text-purple-600'} />
                  {hasPrayed ? 'Prayed' : 'Pray'}
                </button>
                <span className="text-sm text-gray-600">
                  {prayerCount} {prayerCount === 1 ? 'person has' : 'people have'} prayed
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {prayers.length === 0 && (
        <div className="card text-center py-12">
          <FaPrayingHands className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No prayer requests yet. Be the first to share!</p>
        </div>
      )}

      {/* Create Prayer Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Share Prayer Request</h2>
            <form onSubmit={handleCreatePrayer} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prayer Title
                </label>
                <input
                  type="text"
                  value={newPrayer.title}
                  onChange={(e) => setNewPrayer({ ...newPrayer, title: e.target.value })}
                  className="input"
                  placeholder="What are you praying for?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Details
                </label>
                <textarea
                  value={newPrayer.description}
                  onChange={(e) => setNewPrayer({ ...newPrayer, description: e.target.value })}
                  className="textarea"
                  rows="4"
                  placeholder="Share more details about your prayer request..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={newPrayer.category}
                  onChange={(e) => setNewPrayer({ ...newPrayer, category: e.target.value })}
                  className="input"
                >
                  <option value="personal">Personal</option>
                  <option value="health">Health</option>
                  <option value="family">Family</option>
                  <option value="financial">Financial</option>
                  <option value="spiritual">Spiritual</option>
                  <option value="thanksgiving">Thanksgiving</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={newPrayer.isAnonymous}
                  onChange={(e) => setNewPrayer({ ...newPrayer, isAnonymous: e.target.checked })}
                  className="w-4 h-4 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="anonymous" className="text-sm text-gray-700 cursor-pointer">
                  Share anonymously
                </label>
              </div>

              <div className="flex gap-3 pt-2">
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
                  Share Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prayers;
