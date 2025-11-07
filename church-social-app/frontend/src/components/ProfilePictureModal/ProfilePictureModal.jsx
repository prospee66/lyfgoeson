import { useRef } from 'react';
import { FaTimes, FaCamera, FaImage, FaTrash } from 'react-icons/fa';

const ProfilePictureModal = ({ isOpen, onClose, onTakePhoto, onChoosePhoto, onDeletePhoto, hasPhoto }) => {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  if (!isOpen) return null;

  const handleChoosePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleTakePhoto = () => {
    cameraInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onChoosePhoto(file);
      onClose();
    }
  };

  const handleCameraCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      onTakePhoto(file);
      onClose();
    }
  };

  const handleDelete = () => {
    onDeletePhoto();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit profile picture</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <FaTimes className="text-gray-600 text-xl" />
          </button>
        </div>

        {/* Options */}
        <div className="py-2">
          {/* Take Photo */}
          <button
            onClick={handleTakePhoto}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
          >
            <span className="text-lg text-gray-900">Take photo</span>
            <FaCamera className="text-gray-600 text-xl" />
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleCameraCapture}
            className="hidden"
          />

          {/* Choose Photo */}
          <button
            onClick={handleChoosePhoto}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
          >
            <span className="text-lg text-gray-900">Choose photo</span>
            <FaImage className="text-gray-600 text-xl" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Delete Photo */}
          {hasPhoto && (
            <>
              <div className="border-t border-gray-200 my-2"></div>
              <button
                onClick={handleDelete}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-red-50 transition"
              >
                <span className="text-lg text-red-600 font-medium">Delete photo</span>
                <FaTrash className="text-red-600 text-xl" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePictureModal;
