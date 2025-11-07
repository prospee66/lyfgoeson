import { useState, useEffect, useRef } from 'react';
import { userAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaCamera, FaUser, FaEnvelope, FaPhone, FaCalendar, FaSave } from 'react-icons/fa';
import { format } from 'date-fns';
import useAuthStore from '../../store/authStore';
import ImageCropModal from '../../components/ImageCropModal/ImageCropModal';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const Settings = () => {
  const { user, updateUser: setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [cropType, setCropType] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    dateOfBirth: ''
  });

  const profilePictureRef = useRef(null);
  const coverPhotoRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        dateOfBirth: user.dateOfBirth ? format(new Date(user.dateOfBirth), 'yyyy-MM-dd') : ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleProfilePictureSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Profile picture must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result);
        setCropType('profile');
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCoverPhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Cover photo must be less than 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result);
        setCropType('cover');
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCropComplete = (croppedBlob) => {
    const file = new File([croppedBlob], cropType === 'profile' ? 'profile.jpg' : 'cover.jpg', {
      type: 'image/jpeg'
    });

    if (cropType === 'profile') {
      setProfilePictureFile(file);
      setProfilePreview(URL.createObjectURL(croppedBlob));
    } else {
      setCoverPhotoFile(file);
      setCoverPreview(URL.createObjectURL(croppedBlob));
    }

    setImageToCrop(null);
    setCropType(null);
  };

  const handleCloseCropModal = () => {
    setImageToCrop(null);
    setCropType(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Add text fields (only non-empty values)
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Add files
      if (profilePictureFile) {
        formDataToSend.append('profilePicture', profilePictureFile);
      }
      if (coverPhotoFile) {
        formDataToSend.append('coverPhoto', coverPhotoFile);
      }

      const response = await userAPI.updateUser(user._id || user.id, formDataToSend);

      // Update local user state with the response data
      const updatedUser = response.data.data;
      setUser(updatedUser);

      toast.success('Profile updated successfully!');

      // Clear file previews
      setProfilePictureFile(null);
      setCoverPhotoFile(null);
      setProfilePreview(null);
      setCoverPreview(null);
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cover Photo & Profile Picture */}
        <div className="card overflow-hidden p-0">
          {/* Cover Photo */}
          <div className="relative h-48 bg-gradient-to-r from-blue-600 to-purple-600">
            {(coverPreview || user.coverPhoto) && (
              <img
                src={coverPreview || `${API_BASE_URL}${user.coverPhoto}`}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
            <button
              type="button"
              onClick={() => coverPhotoRef.current?.click()}
              className="absolute bottom-4 right-4 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition"
            >
              <FaCamera className="text-gray-700" />
            </button>
            <input
              ref={coverPhotoRef}
              type="file"
              accept="image/*"
              onChange={handleCoverPhotoSelect}
              className="hidden"
            />
          </div>

          {/* Profile Picture */}
          <div className="relative px-6 pb-6">
            <div className="relative -mt-16 inline-block">
              <img
                src={
                  profilePreview ||
                  (user.profilePicture && !user.profilePicture.includes('ui-avatars')
                    ? `${API_BASE_URL}${user.profilePicture}`
                    : user.profilePicture) ||
                  `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&size=128`
                }
                alt={`${user.firstName} ${user.lastName}`}
                className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
              />
              <button
                type="button"
                onClick={() => profilePictureRef.current?.click()}
                className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition"
              >
                <FaCamera />
              </button>
              <input
                ref={profilePictureRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureSelect}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email *
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <div className="absolute left-10 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">
                  +233
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input pl-20"
                  placeholder="000000000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date of Birth
              </label>
              <div className="relative">
                <FaCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="input pl-10"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="4"
              maxLength="500"
              className="textarea"
              placeholder="Tell us about yourself..."
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {formData.bio.length}/500 characters
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex items-center gap-2 px-8 py-3 text-lg"
          >
            <FaSave />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Image Crop Modal */}
      {imageToCrop && (
        <ImageCropModal
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onClose={handleCloseCropModal}
          aspectRatio={cropType === 'profile' ? 1 : 16 / 9}
          cropShape={cropType === 'profile' ? 'round' : 'rect'}
        />
      )}
    </div>
  );
};

export default Settings;
