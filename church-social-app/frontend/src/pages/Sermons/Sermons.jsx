import { useState, useEffect, useRef } from 'react';
import { sermonAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaVideo, FaPlus, FaPlay, FaDownload, FaCalendar, FaUser, FaYoutube, FaImage, FaTimes, FaMusic } from 'react-icons/fa';
import { format } from 'date-fns';
import useAuthStore from '../../store/authStore';
import { canCreateSermon } from '../../utils/permissions';
import socketService from '../../services/socket';

const Sermons = () => {
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSermon, setSelectedSermon] = useState(null);
  const [newSermon, setNewSermon] = useState({
    title: '',
    description: '',
    speaker: '',
    date: '',
    videoUrl: '',
    audioUrl: '',
    category: 'sunday_service'
  });
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [selectedAudioFile, setSelectedAudioFile] = useState(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);

  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const { user } = useAuthStore();

  useEffect(() => {
    fetchSermons();

    // Connect socket
    socketService.connect(user?.id);

    // Listen for sermon deletions
    socketService.onSermonDeleted(({ sermonId }) => {
      setSermons(prevSermons => prevSermons.filter(sermon => sermon._id !== sermonId));
      toast.info('A sermon has been deleted');
    });

    return () => {
      socketService.removeListener('sermon-deleted');
    };
  }, [user]);

  const fetchSermons = async () => {
    try {
      const response = await sermonAPI.getSermons({ page: 1, limit: 20 });
      setSermons(response.data.data);
    } catch (error) {
      toast.error('Failed to load sermons');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast.error('Please select a valid video file');
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error('Video file is too large. Max size is 100MB');
        return;
      }
      setSelectedVideoFile(file);
    }
  };

  const handleAudioFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast.error('Please select a valid audio file');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Audio file is too large. Max size is 50MB');
        return;
      }
      setSelectedAudioFile(file);
    }
  };

  const handleThumbnailSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image file is too large. Max size is 5MB');
        return;
      }
      setSelectedThumbnail(file);
    }
  };

  const getYoutubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleCreateSermon = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', newSermon.title);
      formData.append('description', newSermon.description);
      formData.append('pastor', newSermon.speaker);
      formData.append('sermonDate', new Date(newSermon.date).toISOString());
      formData.append('mediaType', 'video');

      // Add files if selected
      if (selectedVideoFile) {
        formData.append('files', selectedVideoFile);
      }
      if (selectedAudioFile) {
        formData.append('files', selectedAudioFile);
      }
      if (selectedThumbnail) {
        formData.append('files', selectedThumbnail);
      }

      // Add YouTube URL if provided
      if (youtubeUrl) {
        const videoId = getYoutubeVideoId(youtubeUrl);
        if (videoId) {
          formData.append('youtubeVideoUrl', youtubeUrl);
        } else {
          toast.error('Invalid YouTube URL');
          return;
        }
      }

      const response = await sermonAPI.createSermon(formData);
      setSermons([response.data.data, ...sermons]);

      // Reset form
      setNewSermon({
        title: '',
        description: '',
        speaker: '',
        date: '',
        videoUrl: '',
        audioUrl: '',
        category: 'sunday_service'
      });
      setSelectedVideoFile(null);
      setSelectedAudioFile(null);
      setSelectedThumbnail(null);
      setYoutubeUrl('');
      setShowYoutubeInput(false);
      setShowCreateModal(false);

      toast.success('Sermon uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload sermon');
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;

    // Convert YouTube URLs to embed format
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  if (loading) {
    return <div className="text-center py-12">Loading sermons...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 p-8 shadow-xl">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <FaVideo className="text-3xl text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">Sermons & Messages</h1>
            </div>
            <p className="text-blue-100 text-lg mt-2">
              Watch and listen to inspiring messages from our pastors
            </p>
          </div>
          {canCreateSermon(user) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <FaPlus /> Upload Sermon
            </button>
          )}
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
      </div>

      {/* Sermons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sermons.map((sermon) => {
          const embedUrl = getEmbedUrl(sermon.youtubeVideoUrl || sermon.videoUrl);

          return (
            <div key={sermon._id} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-1">
              {/* Thumbnail/Video Preview */}
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 aspect-video">
                {embedUrl ? (
                  <img
                    src={`https://img.youtube.com/vi/${embedUrl.split('/').pop()}/maxresdefault.jpg`}
                    alt={sermon.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/assets/glc-logo.png';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FaVideo className="text-6xl text-gray-600" />
                  </div>
                )}
                <button
                  onClick={() => setSelectedSermon(sermon)}
                  className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center hover:bg-opacity-50 transition-all group"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 bg-opacity-95 flex items-center justify-center group-hover:scale-110 transition-all shadow-2xl">
                    <FaPlay className="text-3xl text-white ml-1" />
                  </div>
                </button>
              </div>

              {/* Sermon Info */}
              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {sermon.title}
                </h3>

                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <FaUser className="text-blue-600 text-sm" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{sermon.speaker}</span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center">
                    <FaCalendar className="text-green-600 text-sm" />
                  </div>
                  <span className="text-sm text-gray-600">{format(new Date(sermon.date), 'MMM d, yyyy')}</span>
                </div>

                <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                  {sermon.description}
                </p>

                <div className="flex items-center gap-2">
                  <span className="inline-block px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold rounded-full capitalize">
                    {sermon.category.replace('_', ' ')}
                  </span>
                  {sermon.audioUrl && (
                    <a
                      href={sermon.audioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-blue-600 hover:from-blue-500 hover:to-purple-500 hover:text-white transition-all shadow-sm hover:shadow-md"
                      title="Download Audio"
                    >
                      <FaDownload />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sermons.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg text-center py-20 border border-gray-100">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 via-purple-100 to-blue-100 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <FaVideo className="text-5xl text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Sermons Yet</h3>
          <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
            Start building your sermon library by uploading inspiring messages for your community
          </p>
          {canCreateSermon(user) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
            >
              <FaPlus /> Upload Your First Sermon
            </button>
          )}
        </div>
      )}

      {/* Video Player Modal */}
      {selectedSermon && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{selectedSermon.title}</h2>
              <button
                onClick={() => setSelectedSermon(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {/* Video Player */}
              {(selectedSermon.youtubeVideoUrl || selectedSermon.videoUrl) && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
                  <iframe
                    src={getEmbedUrl(selectedSermon.youtubeVideoUrl || selectedSermon.videoUrl)}
                    title={selectedSermon.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              )}

              {/* Sermon Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <FaUser className="text-blue-600" />
                    <span className="font-semibold">{selectedSermon.speaker}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCalendar className="text-blue-600" />
                    <span>{format(new Date(selectedSermon.date), 'MMMM d, yyyy')}</span>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                    {selectedSermon.category.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedSermon.description}</p>
                </div>

                {selectedSermon.audioUrl && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Audio</h3>
                    <a
                      href={selectedSermon.audioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <FaDownload /> Download Audio
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Sermon Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Sermon</h2>
            <form onSubmit={handleCreateSermon} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sermon Title
                </label>
                <input
                  type="text"
                  value={newSermon.title}
                  onChange={(e) => setNewSermon({ ...newSermon, title: e.target.value })}
                  className="input"
                  placeholder="The Power of Prayer"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newSermon.description}
                  onChange={(e) => setNewSermon({ ...newSermon, description: e.target.value })}
                  className="textarea"
                  rows="3"
                  placeholder="Brief description of the sermon..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Speaker
                </label>
                <input
                  type="text"
                  value={newSermon.speaker}
                  onChange={(e) => setNewSermon({ ...newSermon, speaker: e.target.value })}
                  className="input"
                  placeholder="Pastor Name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={newSermon.date}
                  onChange={(e) => setNewSermon({ ...newSermon, date: e.target.value })}
                  className="input"
                  required
                />
              </div>

              {/* Media Upload Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Media Upload
                </label>

                {/* Hidden file inputs */}
                <input
                  type="file"
                  ref={videoInputRef}
                  onChange={handleVideoFileSelect}
                  accept="video/*"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={audioInputRef}
                  onChange={handleAudioFileSelect}
                  accept="audio/*"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={thumbnailInputRef}
                  onChange={handleThumbnailSelect}
                  accept="image/*"
                  className="hidden"
                />

                {/* Upload Buttons */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    <FaVideo className="text-blue-500" />
                    <span className="text-sm">Video File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowYoutubeInput(!showYoutubeInput)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    <FaYoutube className="text-red-500" />
                    <span className="text-sm">YouTube</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    <FaMusic className="text-purple-500" />
                    <span className="text-sm">Audio File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    <FaImage className="text-green-500" />
                    <span className="text-sm">Thumbnail</span>
                  </button>
                </div>

                {/* YouTube URL Input */}
                {showYoutubeInput && (
                  <div className="mb-3">
                    <input
                      type="url"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="input"
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                )}

                {/* File Previews */}
                <div className="space-y-2">
                  {selectedVideoFile && (
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FaVideo className="text-blue-500" />
                        <span className="text-sm text-gray-700">{selectedVideoFile.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedVideoFile(null)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}

                  {selectedAudioFile && (
                    <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FaMusic className="text-purple-500" />
                        <span className="text-sm text-gray-700">{selectedAudioFile.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedAudioFile(null)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}

                  {selectedThumbnail && (
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FaImage className="text-green-500" />
                        <span className="text-sm text-gray-700">{selectedThumbnail.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedThumbnail(null)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}

                  {youtubeUrl && getYoutubeVideoId(youtubeUrl) && (
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <iframe
                        src={`https://www.youtube.com/embed/${getYoutubeVideoId(youtubeUrl)}`}
                        title="YouTube Preview"
                        className="w-full h-full"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={newSermon.category}
                  onChange={(e) => setNewSermon({ ...newSermon, category: e.target.value })}
                  className="input"
                >
                  <option value="sunday_service">Sunday Service</option>
                  <option value="bible_study">Bible Study</option>
                  <option value="special_event">Special Event</option>
                  <option value="youth">Youth</option>
                  <option value="conference">Conference</option>
                  <option value="other">Other</option>
                </select>
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
                  Upload Sermon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sermons;
