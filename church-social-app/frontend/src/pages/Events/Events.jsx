import { useState, useEffect, useRef } from 'react';
import { eventAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaCalendar, FaPlus, FaMapMarkerAlt, FaClock, FaTimes, FaImage, FaTrash } from 'react-icons/fa';
import { format } from 'date-fns';
import useAuthStore from '../../store/authStore';
import { canCreateEvent } from '../../utils/permissions';
import socketService from '../../services/socket';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    endDate: '',
    endTime: '',
    location: '',
    eventType: 'service'
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchEvents();

    // Connect socket
    socketService.connect(user?.id);

    // Listen for event deletions
    socketService.onEventDeleted(({ eventId }) => {
      setEvents(prevEvents => prevEvents.filter(event => event._id !== eventId));
      toast.info('An event has been deleted');
    });

    return () => {
      socketService.removeListener('event-deleted');
    };
  }, [user]);

  const fetchEvents = async () => {
    try {
      const response = await eventAPI.getEvents({ page: 1, limit: 20 });
      setEvents(response.data.data);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) {
        toast.error(`${file.name} is not a valid image or video file`);
        return false;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 100MB`);
        return false;
      }
      return true;
    });
    setSelectedFiles([...selectedFiles, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const startDateTime = new Date(newEvent.date + 'T' + newEvent.time);
      const endDateTime = newEvent.endDate && newEvent.endTime
        ? new Date(newEvent.endDate + 'T' + newEvent.endTime)
        : new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours later

      const formData = new FormData();
      formData.append('title', newEvent.title);
      formData.append('description', newEvent.description);
      formData.append('eventType', newEvent.eventType);
      formData.append('startDate', startDateTime.toISOString());
      formData.append('endDate', endDateTime.toISOString());
      formData.append('location', JSON.stringify({
        name: newEvent.location,
        address: newEvent.location,
        isOnline: false
      }));

      // Add media files
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const response = await eventAPI.createEvent(formData);
      setEvents([response.data.data, ...events]);
      setNewEvent({
        title: '',
        description: '',
        date: '',
        time: '',
        endDate: '',
        endTime: '',
        location: '',
        eventType: 'service'
      });
      setSelectedFiles([]);
      setShowCreateModal(false);
      toast.success('Event created successfully!');
    } catch (error) {
      console.error('Event creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to create event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await eventAPI.deleteEvent(eventId);
      setEvents(events.filter(event => event._id !== eventId));
      toast.success('Event deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };


  if (loading) {
    return <div className="text-center py-12">Loading events...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-teal-600 to-green-600 p-8 shadow-xl">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <FaCalendar className="text-3xl text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">Church Events</h1>
            </div>
            <p className="text-green-100 text-lg mt-2">
              Stay connected with upcoming services and community activities
            </p>
          </div>
          {canCreateEvent(user) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-white text-green-600 rounded-xl font-semibold hover:bg-green-50 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <FaPlus /> Create Event
            </button>
          )}
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
      </div>

      {/* Events List */}
      <div className="space-y-5">
        {events.map((event) => (
            <div key={event._id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1">
              <div className="flex gap-6 p-6">
                {/* Left: Image Thumbnail or Date */}
                {event.media && event.media.length > 0 ? (
                  <div className="flex-shrink-0 w-40 h-40 relative rounded-xl overflow-hidden shadow-md">
                    {event.media[0].type === 'image' ? (
                      <img
                        src={`http://localhost:5001${event.media[0].url}`}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={`http://localhost:5001${event.media[0].url}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {event.media.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded-lg text-xs font-semibold shadow-lg">
                        +{event.media.length - 1} more
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-shrink-0 bg-gradient-to-br from-green-600 via-teal-600 to-green-600 text-white rounded-xl p-6 text-center w-32 shadow-lg">
                    <div className="text-5xl font-bold leading-none mb-1">
                      {format(new Date(event.startDate), 'd')}
                    </div>
                    <div className="text-sm uppercase font-semibold tracking-wider">
                      {format(new Date(event.startDate), 'MMM')}
                    </div>
                    <div className="text-xs mt-1 opacity-90">
                      {format(new Date(event.startDate), 'yyyy')}
                    </div>
                  </div>
                )}

                {/* Right: Event Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h3>
                      <span className="inline-block px-3 py-1.5 bg-gradient-to-r from-green-500 to-teal-500 text-white text-xs font-semibold rounded-full uppercase shadow-sm">
                        {event.eventType.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.media && event.media.length > 0 && (
                        <div className="flex-shrink-0 bg-gradient-to-br from-green-100 to-teal-100 text-green-800 rounded-xl p-3 text-center shadow-sm">
                          <div className="text-xl font-bold leading-none">
                            {format(new Date(event.startDate), 'd')}
                          </div>
                          <div className="text-[10px] uppercase font-semibold mt-0.5">
                            {format(new Date(event.startDate), 'MMM')}
                          </div>
                        </div>
                      )}
                      {canCreateEvent(user) && (
                        <button
                          onClick={() => handleDeleteEvent(event._id)}
                          className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-sm hover:shadow-md"
                          title="Delete event"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-700 mb-5 line-clamp-2 leading-relaxed">{event.description}</p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-green-100 to-teal-100 rounded-lg">
                        <FaClock className="text-green-600" />
                      </div>
                      <span className="font-semibold text-gray-900">{format(new Date(event.startDate), 'h:mm a')}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-600">{format(new Date(event.startDate), 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-green-100 to-teal-100 rounded-lg">
                        <FaMapMarkerAlt className="text-green-600" />
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location?.name || event.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 font-semibold hover:underline transition"
                      >
                        {event.location?.name || event.location}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg text-center py-20 border border-gray-100">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-100 via-teal-100 to-green-100 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <FaCalendar className="text-5xl text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Upcoming Events</h3>
          <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
            Stay tuned for upcoming services and community activities
          </p>
          {canCreateEvent(user) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
            >
              <FaPlus /> Create Your First Event
            </button>
          )}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="input"
                  placeholder="Sunday Service, Bible Study, etc."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="textarea"
                  rows="3"
                  placeholder="What is this event about?"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="input"
                  placeholder="Church address or venue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Type
                </label>
                <select
                  value={newEvent.eventType}
                  onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                  className="input"
                >
                  <option value="service">Service</option>
                  <option value="prayer-meeting">Prayer Meeting</option>
                  <option value="bible-study">Bible Study</option>
                  <option value="fellowship">Fellowship</option>
                  <option value="outreach">Outreach</option>
                  <option value="conference">Conference</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Media Upload Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Images/Videos
                </label>

                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                />

                {/* Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <FaImage className="text-gray-400" />
                  <span className="text-gray-600">Add Images or Videos</span>
                </button>

                {/* File Preview */}
                {selectedFiles.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          {file.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <div className="text-center">
                                <FaImage className="text-2xl text-gray-400 mx-auto mb-1" />
                                <p className="text-xs text-gray-600">{file.name}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
