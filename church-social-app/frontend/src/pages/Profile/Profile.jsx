import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaChevronRight, FaExternalLinkAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/authStore';
import { userAPI } from '../../services/api';
import ProfilePictureModal from '../../components/ProfilePictureModal/ProfilePictureModal';
import ImageCropModal from '../../components/ImageCropModal/ImageCropModal';
import LinksModal from '../../components/LinksModal/LinksModal';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuthStore();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPictureModal, setShowPictureModal] = useState(false);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  const isOwnProfile = id === currentUser?._id || id === currentUser?.id;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (isOwnProfile) {
          setUser(currentUser);
        } else {
          const response = await userAPI.getUserById(id);
          setUser(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, currentUser, isOwnProfile]);

  const getProfilePictureUrl = () => {
    if (!user?.profilePicture) {
      return `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName || ''}&size=300&background=random`;
    }
    if (user.profilePicture.includes('ui-avatars') || user.profilePicture.startsWith('http')) {
      return user.profilePicture;
    }
    return `${API_BASE_URL}${user.profilePicture}`;
  };

  const handleChoosePhoto = (file) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Profile picture must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleTakePhoto = (file) => {
    handleChoosePhoto(file);
  };

  const handleCropComplete = async (croppedBlob) => {
    const file = new File([croppedBlob], 'profile.jpg', {
      type: 'image/jpeg'
    });

    setUploadingPicture(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await userAPI.updateUser(currentUser._id || currentUser.id, formData);
      const updatedUser = response.data.data;

      updateUser(updatedUser);
      setUser(updatedUser);

      toast.success('Profile picture updated successfully!');
    } catch (error) {
      console.error('Profile picture update error:', error);
      toast.error('Failed to update profile picture');
    } finally {
      setUploadingPicture(false);
      setImageToCrop(null);
    }
  };

  const handleDeletePhoto = async () => {
    setUploadingPicture(true);
    try {
      const response = await userAPI.deleteProfilePicture(currentUser._id || currentUser.id);
      const updatedUser = response.data.data;

      updateUser(updatedUser);
      setUser(updatedUser);

      toast.success('Profile picture deleted successfully!');
    } catch (error) {
      console.error('Profile picture delete error:', error);
      toast.error('Failed to delete profile picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">User not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition"
          >
            <FaArrowLeft className="text-gray-700 text-xl" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 flex-1 text-center mr-10">
            Profile
          </h1>
        </div>
      </div>

      {/* Profile Picture Section */}
      <div className="bg-white pb-6 mb-2">
        <div className="flex flex-col items-center pt-8">
          <div className="relative mb-4">
            <img
              src={getProfilePictureUrl()}
              alt={`${user.firstName} ${user.lastName}`}
              className="w-48 h-48 rounded-full object-cover border-4 border-gray-100"
            />
          </div>
          {isOwnProfile && (
            <button
              onClick={() => setShowPictureModal(true)}
              disabled={uploadingPicture}
              className="text-green-600 font-medium text-lg hover:text-green-700 transition disabled:opacity-50"
            >
              {uploadingPicture ? 'Updating...' : 'Edit'}
            </button>
          )}
        </div>
      </div>

      {/* Profile Info Sections */}
      <div className="space-y-2">
        {/* Name Section */}
        <div className="bg-white px-4 py-3">
          <div className="text-sm text-gray-500 mb-2">Name</div>
          <div className="flex items-center justify-between">
            <div className="text-gray-900 text-lg">
              {user.firstName} {user.lastName}
            </div>
            {isOwnProfile && (
              <Link to="/settings">
                <FaChevronRight className="text-gray-400" />
              </Link>
            )}
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white px-4 py-3">
          <div className="text-sm text-gray-500 mb-2">About</div>
          <div className="flex items-center justify-between">
            <div className="text-gray-900 text-lg flex-1 pr-4">
              {user.bio || 'Busy'}
            </div>
            {isOwnProfile && (
              <Link to="/settings">
                <FaChevronRight className="text-gray-400" />
              </Link>
            )}
          </div>
        </div>

        {/* Phone Number Section */}
        {user.phone && (
          <div className="bg-white px-4 py-3">
            <div className="text-sm text-gray-500 mb-2">Phone number</div>
            <div className="flex items-center justify-between">
              <div className="text-gray-900 text-lg">
                +233 {user.phone}
              </div>
              {isOwnProfile && (
                <Link to="/settings">
                  <FaChevronRight className="text-gray-400" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Links Section */}
        <div className="bg-white px-4 py-3">
          <div className="text-sm text-gray-500 mb-2">Links</div>
          {user?.links && user.links.length > 0 ? (
            <div className="space-y-2">
              {user.links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-2 transition group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-blue-600 font-medium truncate">{link.title}</span>
                  </div>
                  <FaExternalLinkAlt className="text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                </a>
              ))}
              {isOwnProfile && (
                <button
                  onClick={() => setShowLinksModal(true)}
                  className="w-full text-center text-green-600 py-2 hover:bg-gray-50 rounded-lg transition"
                >
                  Manage links
                </button>
              )}
            </div>
          ) : isOwnProfile ? (
            <button
              onClick={() => setShowLinksModal(true)}
              className="flex items-center justify-between w-full"
            >
              <div className="text-green-600 text-lg">Add links</div>
              <FaChevronRight className="text-gray-400" />
            </button>
          ) : (
            <div className="text-gray-500">No links added</div>
          )}
        </div>
      </div>

      {/* Profile Picture Edit Modal */}
      {isOwnProfile && (
        <ProfilePictureModal
          isOpen={showPictureModal}
          onClose={() => setShowPictureModal(false)}
          onTakePhoto={handleTakePhoto}
          onChoosePhoto={handleChoosePhoto}
          onDeletePhoto={handleDeletePhoto}
          hasPhoto={user?.profilePicture && !user.profilePicture.includes('ui-avatars')}
        />
      )}

      {/* Image Crop Modal */}
      {imageToCrop && (
        <ImageCropModal
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onClose={() => setImageToCrop(null)}
          aspectRatio={1}
          cropShape="round"
        />
      )}

      {/* Links Modal */}
      {isOwnProfile && (
        <LinksModal
          isOpen={showLinksModal}
          onClose={() => setShowLinksModal(false)}
          userLinks={user?.links || []}
          onUpdate={(updatedUser) => setUser(updatedUser)}
        />
      )}
    </div>
  );
};

export default Profile;
