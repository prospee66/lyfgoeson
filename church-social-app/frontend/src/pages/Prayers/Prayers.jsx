import { useState, useEffect } from 'react';
import { prayerAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaPrayingHands, FaPlus } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
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

  if (loading) {
    return <div className="text-center py-12">Loading prayer requests...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 p-8 shadow-xl">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <FaPrayingHands className="text-3xl text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">Prayer Requests</h1>
            </div>
            <p className="text-pink-100 text-lg mt-2">
              Share your prayer needs and uplift others in faith
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-white text-pink-600 rounded-xl font-semibold hover:bg-pink-50 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <FaPlus /> Share Prayer Request
          </button>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
      </div>

      {/* Prayer Requests List */}
      <div className="space-y-5">
        {prayers.map((prayer) => (
          <div key={prayer._id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 p-6">
            {/* Prayer Header */}
            <div className="flex items-start gap-4 mb-5">
              <div className="flex-shrink-0">
                {prayer.isAnonymous ? (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white shadow-lg">
                    <FaPrayingHands className="text-xl" />
                  </div>
                ) : (
                  <img
                    src={prayer.user?.profilePicture || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128"%3E%3Crect width="128" height="128" fill="%23e5e7eb"/%3E%3C/svg%3E'}
                    alt={prayer.user?.firstName || 'User'}
                    className="w-14 h-14 rounded-full object-cover border-2 border-pink-200"
                  />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-gray-900 text-lg">
                    {prayer.isAnonymous ? 'Anonymous' : `${prayer.user?.firstName} ${prayer.user?.lastName}`}
                  </h3>
                  <span className="inline-block px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-semibold rounded-full capitalize shadow-sm">
                    {prayer.category}
                  </span>
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                  {formatDistanceToNow(new Date(prayer.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Prayer Content */}
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-5 border border-pink-100">
              <h4 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FaPrayingHands className="text-pink-600" />
                {prayer.title}
              </h4>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{prayer.description}</p>
            </div>
          </div>
        ))}
      </div>

      {prayers.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg text-center py-20 border border-gray-100">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-100 via-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <FaPrayingHands className="text-5xl text-pink-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Prayer Requests Yet</h3>
          <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
            Be the first to share your prayer needs with the community
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-semibold hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
          >
            <FaPlus /> Share Your First Prayer
          </button>
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
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-semibold hover:from-pink-700 hover:to-purple-700 transition shadow-lg"
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
