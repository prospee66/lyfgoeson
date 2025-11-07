import { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaTrash, FaGlobe, FaLink } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { userAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';

const LinksModal = ({ isOpen, onClose, userLinks = [], onUpdate }) => {
  const { user: currentUser, updateUser } = useAuthStore();
  const [links, setLinks] = useState([]);
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLinks(userLinks || []);
    }
  }, [isOpen, userLinks]);

  if (!isOpen) return null;

  const handleAddLink = () => {
    if (!newLink.title.trim() || !newLink.url.trim()) {
      toast.error('Please enter both title and URL');
      return;
    }

    // Basic URL validation
    try {
      const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      if (!urlPattern.test(newLink.url)) {
        toast.error('Please enter a valid URL');
        return;
      }

      // Add https:// if not present
      let formattedUrl = newLink.url;
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl;
      }

      setLinks([...links, { title: newLink.title, url: formattedUrl }]);
      setNewLink({ title: '', url: '' });
    } catch (error) {
      toast.error('Invalid URL format');
    }
  };

  const handleRemoveLink = (index) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await userAPI.updateUser(currentUser._id || currentUser.id, { links });
      const updatedUser = response.data.data;

      updateUser(updatedUser);
      onUpdate(updatedUser);

      toast.success('Links updated successfully!');
      onClose();
    } catch (error) {
      console.error('Links update error:', error);
      toast.error('Failed to update links');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Manage Links</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <FaTimes className="text-gray-600 text-xl" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Existing Links */}
          {links.length > 0 && (
            <div className="mb-6 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Your Links</h3>
              {links.map((link, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <FaLink className="text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{link.title}</div>
                      <div className="text-sm text-gray-500 truncate">{link.url}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveLink(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0 ml-2"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Link */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Add New Link</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={newLink.title}
                onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                placeholder="e.g., Facebook, Website, YouTube"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL
              </label>
              <input
                type="text"
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                placeholder="e.g., facebook.com/yourpage"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleAddLink}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <FaPlus />
              Add Link
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinksModal;
