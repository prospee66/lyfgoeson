import { useState, useEffect, useRef } from 'react';
import { postAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaHeart, FaComment, FaShare, FaImage, FaYoutube, FaTimes } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import useAuthStore from '../../store/authStore';
import { canCreatePost } from '../../utils/permissions';
import socketService from '../../services/socket';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const fileInputRef = useRef(null);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchPosts();

    // Connect socket
    socketService.connect(user?.id);

    // Listen for post deletions
    socketService.onPostDeleted(({ postId }) => {
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
      toast.info('A post has been deleted');
    });

    return () => {
      socketService.removeListener('post-deleted');
    };
  }, [user]);

  const fetchPosts = async () => {
    try {
      const response = await postAPI.getPosts({ page: 1, limit: 20 });
      setPosts(response.data.data);
    } catch (error) {
      toast.error('Failed to load posts');
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
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
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

  const getYoutubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim() && selectedFiles.length === 0 && !youtubeUrl) {
      toast.error('Please add some content to your post');
      return;
    }

    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('content', newPost);

      // Add gallery files
      selectedFiles.forEach((file) => {
        formData.append('media', file);
      });

      // Add YouTube URL if provided
      if (youtubeUrl) {
        const videoId = getYoutubeVideoId(youtubeUrl);
        if (videoId) {
          formData.append('youtubeUrl', youtubeUrl);
        } else {
          toast.error('Invalid YouTube URL');
          setCreating(false);
          return;
        }
      }

      const response = await postAPI.createPost(formData);
      setPosts([response.data.data, ...posts]);
      setNewPost('');
      setSelectedFiles([]);
      setYoutubeUrl('');
      setShowYoutubeInput(false);
      toast.success('Post created successfully!');
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setCreating(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await postAPI.likePost(postId);
      setPosts(posts.map(post => {
        if (post._id === postId) {
          const hasLiked = post.likes.includes(user.id);
          return {
            ...post,
            likes: hasLiked
              ? post.likes.filter(id => id !== user.id)
              : [...post.likes, user.id]
          };
        }
        return post;
      }));
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed - Left/Center */}
        <div className="lg:col-span-2 space-y-4">
          {/* Create Post Card - Only for Staff */}
          {canCreatePost(user) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="flex gap-4">
                <img
                  src={user?.profilePicture || '/assets/glc-logo.png'}
                  alt={user?.firstName}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
                />
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share your thoughts with the community..."
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none bg-gray-50 hover:bg-white"
                  rows="3"
                />
              </div>

              {/* File Preview */}
              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                              <FaImage className="text-3xl text-gray-400 mx-auto mb-2" />
                              <p className="text-xs text-gray-600">{file.name}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* YouTube URL Input */}
              {showYoutubeInput && (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="Paste YouTube URL here..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowYoutubeInput(false);
                      setYoutubeUrl('');
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                  >
                    <FaTimes />
                  </button>
                </div>
              )}

              {/* YouTube Preview */}
              {youtubeUrl && getYoutubeVideoId(youtubeUrl) && (
                <div className="relative rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${getYoutubeVideoId(youtubeUrl)}`}
                    className="w-full aspect-video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all font-medium"
                  >
                    <FaImage className="text-blue-500" />
                    <span>Gallery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowYoutubeInput(!showYoutubeInput)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all font-medium"
                  >
                    <FaYoutube className="text-red-500" />
                    <span>YouTube</span>
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>
          )}

          {/* Posts List */}
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Post Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.author.profilePicture || '/assets/glc-logo.png'}
                      alt={post.author.firstName}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {post.author.firstName} {post.author.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <div className="px-6 pb-4">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                </div>

                {/* Post Media */}
                {post.youtubeUrl && (
                  <div className="mb-4">
                    <div className="relative rounded-lg overflow-hidden">
                      <iframe
                        src={`https://www.youtube.com/embed/${getYoutubeVideoId(post.youtubeUrl)}`}
                        className="w-full aspect-video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                )}

                {post.media && post.media.length > 0 && (
                  <div className={`grid ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-1`}>
                    {post.media.map((media, index) => (
                      media.type === 'video' ? (
                        <video
                          key={index}
                          src={media.url}
                          controls
                          className="w-full h-80 object-cover bg-black"
                        />
                      ) : (
                        <img
                          key={index}
                          src={media.url}
                          alt="Post media"
                          className="w-full h-80 object-cover"
                        />
                      )
                    ))}
                  </div>
                )}

                {/* Post Stats */}
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
                  <span className="text-sm font-medium text-gray-600">
                    {post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}
                  </span>
                  <span className="text-sm font-medium text-gray-600">
                    {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
                  </span>
                </div>

                {/* Post Actions */}
                <div className="grid grid-cols-3 border-t border-gray-100">
                  <button
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center justify-center gap-2 px-4 py-3 font-medium transition-all ${
                      post.likes.includes(user?.id)
                        ? 'text-red-500 hover:bg-red-50'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <FaHeart className={post.likes.includes(user?.id) ? 'fill-current' : ''} />
                    <span>Like</span>
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-3 text-gray-600 hover:bg-gray-50 font-medium transition-all border-l border-r border-gray-100">
                    <FaComment />
                    <span>Comment</span>
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-3 text-gray-600 hover:bg-gray-50 font-medium transition-all">
                    <FaShare />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {posts.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="max-w-sm mx-auto">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaComment className="text-3xl text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-500">Be the first to share something with the community!</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Right */}
        <div className="hidden lg:block space-y-4">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <img
                src={user?.profilePicture || '/assets/glc-logo.png'}
                alt={user?.firstName}
                className="w-20 h-20 rounded-full object-cover mx-auto mb-4 ring-4 ring-gray-100"
              />
              <h3 className="font-bold text-gray-900 text-lg">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-sm text-gray-500 capitalize mb-4">{user?.role || 'member'}</p>
              <div className="pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-xs text-gray-500">Posts</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-xs text-gray-500">Following</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Quick Links</h3>
            <div className="space-y-3">
              <a href="/events" className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600">📅</span>
                </div>
                <span className="font-medium">Events</span>
              </a>
              <a href="/sermons" className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600">🎙️</span>
                </div>
                <span className="font-medium">Sermons</span>
              </a>
              <a href="/groups" className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <span className="text-green-600">👥</span>
                </div>
                <span className="font-medium">Groups</span>
              </a>
            </div>
          </div>

          {/* Community Info */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100 p-6">
            <h3 className="font-bold text-gray-900 mb-2">Welcome to Global Life!</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Connect, share, and grow together with our community.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feed;
