import { useState, useEffect } from 'react';
import { FaPlay, FaVideo, FaClock, FaEye, FaCalendar } from 'react-icons/fa';
import { liveStreamAPI } from '../../services/api';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/authStore';
import { format } from 'date-fns';

const LiveStream = () => {
  const [currentStream, setCurrentStream] = useState(null);
  const [upcomingStreams, setUpcomingStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      setLoading(true);

      // Fetch current live stream
      const currentResponse = await liveStreamAPI.getCurrentLiveStream();
      if (currentResponse.data.data) {
        setCurrentStream(currentResponse.data.data);
        // Join the stream
        await liveStreamAPI.joinLiveStream(currentResponse.data.data._id);
      }

      // Fetch upcoming streams
      const upcomingResponse = await liveStreamAPI.getLiveStreams({ status: 'scheduled' });
      setUpcomingStreams(upcomingResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching streams:', error);
      toast.error('Failed to load streams');
    } finally {
      setLoading(false);
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    // Extract video ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
  };

  const getFacebookEmbedUrl = (url) => {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=1`;
  };

  const getEmbedUrl = (stream) => {
    switch (stream.streamType) {
      case 'youtube':
        return getYouTubeEmbedUrl(stream.streamUrl);
      case 'facebook':
        return getFacebookEmbedUrl(stream.streamUrl);
      case 'vimeo':
        return stream.streamUrl.replace('vimeo.com/', 'player.vimeo.com/video/');
      default:
        return stream.streamUrl;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        {/* Page Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Live Stream</h1>
          <p className="text-sm sm:text-base text-gray-600">Watch our live church services and events</p>
        </div>

        {/* Current Live Stream */}
        {currentStream ? (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg overflow-hidden mb-4 sm:mb-6 md:mb-8">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-3 sm:px-4 md:px-6 py-2 sm:py-3 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white font-semibold uppercase text-xs sm:text-sm">Live Now</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-white/90 text-xs sm:text-sm">
                  <FaEye />
                  <span>{currentStream.viewCount} viewing</span>
                </div>
              </div>
            </div>

            {/* Video Player */}
            <div className="relative pb-[56.25%] h-0 bg-black">
              <iframe
                src={getEmbedUrl(currentStream)}
                className="absolute top-0 left-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={currentStream.title}
              />
            </div>

            {/* Stream Info */}
            <div className="p-4 sm:p-5 md:p-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">{currentStream.title}</h2>
              {currentStream.description && (
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">{currentStream.description}</p>
              )}
              <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <FaClock />
                  <span>Started {format(new Date(currentStream.startedAt), 'p')}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg sm:rounded-xl shadow-lg p-6 sm:p-8 md:p-12 text-center text-white mb-4 sm:mb-6 md:mb-8">
            <FaVideo className="text-4xl sm:text-5xl md:text-6xl mx-auto mb-3 sm:mb-4 opacity-80" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">No Live Stream</h2>
            <p className="text-blue-100 text-sm sm:text-base md:text-lg">
              There is no active live stream at the moment. Check back later or view upcoming streams below.
            </p>
          </div>
        )}

        {/* Upcoming Streams */}
        {upcomingStreams.length > 0 && (
          <div>
            <h2 className="text-xl sm:text-2xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Upcoming Streams</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {upcomingStreams.map((stream) => (
                <div key={stream._id} className="bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {stream.thumbnailUrl ? (
                    <img
                      src={stream.thumbnailUrl}
                      alt={stream.title}
                      className="w-full h-40 sm:h-44 md:h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 sm:h-44 md:h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <FaPlay className="text-white text-3xl sm:text-4xl opacity-80" />
                    </div>
                  )}

                  <div className="p-4 sm:p-5">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2 line-clamp-2">{stream.title}</h3>
                    {stream.description && (
                      <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">{stream.description}</p>
                    )}

                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500">
                      <FaCalendar className="flex-shrink-0" />
                      <span className="break-words">{format(new Date(stream.scheduledFor), 'PPP p')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Streams */}
        {!currentStream && upcomingStreams.length === 0 && (
          <div className="text-center py-8 sm:py-10 md:py-12">
            <p className="text-gray-500 text-sm sm:text-base md:text-lg">No upcoming streams scheduled at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveStream;
