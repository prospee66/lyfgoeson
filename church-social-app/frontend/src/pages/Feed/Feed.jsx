import { useState, useEffect, useRef } from 'react';
import { postAPI, commentAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaHeart, FaComment, FaImage, FaYoutube, FaTimes, FaPaperPlane, FaTrash } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import useAuthStore from '../../store/authStore';
import { canCreatePost, canDeletePost } from '../../utils/permissions';
import socketService from '../../services/socket';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [showCommentsFor, setShowCommentsFor] = useState(null);
  const [newComment, setNewComment] = useState({});
  const fileInputRef = useRef(null);
  const { user } = useAuthStore();

  // Get profile picture URL
  const getProfilePictureUrl = (userObj = user) => {
    if (!userObj?.profilePicture || userObj.profilePicture === '/assets/glc-logo.png') {
      // Return a blank gray placeholder
      return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128"%3E%3Crect width="128" height="128" fill="%23e5e7eb"/%3E%3C/svg%3E';
    }
    if (userObj.profilePicture.includes('ui-avatars') || userObj.profilePicture.startsWith('http')) {
      return userObj.profilePicture;
    }
    return `${API_BASE_URL}${userObj.profilePicture}`;
  };

  useEffect(() => {
    fetchPosts();

    // Connect socket
    socketService.connect(user?.id);

    // Listen for post deletions
    socketService.onPostDeleted(({ postId }) => {
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
      toast.info('A post has been deleted');
    });

    // Listen for new comments
    socketService.onNewComment(({ postId, comment }) => {
      setPosts(prevPosts => prevPosts.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            comments: [...post.comments, comment]
          };
        }
        return post;
      }));
    });

    // Listen for comment deletions
    socketService.onCommentDeleted(({ postId, commentId }) => {
      setPosts(prevPosts => prevPosts.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            comments: post.comments.filter(c => c._id !== commentId)
          };
        }
        return post;
      }));
    });

    // Listen for likes
    socketService.onPostLiked(({ postId, likes }) => {
      setPosts(prevPosts => prevPosts.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            likes: likes
          };
        }
        return post;
      }));
    });

    return () => {
      socketService.removeListener('post-deleted');
      socketService.removeListener('new-comment');
      socketService.removeListener('comment-deleted');
      socketService.removeListener('post-liked');
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

  const toggleComments = (postId) => {
    setShowCommentsFor(showCommentsFor === postId ? null : postId);
  };

  const handleAddComment = async (postId) => {
    const commentText = newComment[postId]?.trim();
    if (!commentText) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      const response = await commentAPI.createComment({
        postId: postId,
        content: commentText
      });

      setPosts(posts.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            comments: [...post.comments, response.data.data]
          };
        }
        return post;
      }));

      setNewComment({ ...newComment, [postId]: '' });
      toast.success('Comment added successfully!');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      await postAPI.deletePost(postId);
      setPosts(posts.filter(post => post._id !== postId));
      toast.success('Post deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete post');
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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 p-8 shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <FaComment className="text-3xl text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Community Feed</h1>
          </div>
          <p className="text-blue-100 text-lg mt-2">
            Stay connected and share your journey with the community
          </p>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed - Left/Center */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Post Card - Only for Staff */}
          {canCreatePost(user) && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
              Create a Post
            </h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="flex gap-4">
                <img
                  src={getProfilePictureUrl()}
                  alt={user?.firstName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-200 shadow-md"
                />
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share your thoughts with the community..."
                  className="flex-1 px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none bg-gray-50 hover:bg-white"
                  rows="4"
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

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
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
                    className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:bg-blue-50 rounded-xl transition-all font-semibold border border-gray-200 hover:border-blue-200"
                  >
                    <FaImage className="text-blue-500" />
                    <span>Gallery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowYoutubeInput(!showYoutubeInput)}
                    className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:bg-red-50 rounded-xl transition-all font-semibold border border-gray-200 hover:border-red-200"
                  >
                    <FaYoutube className="text-red-500" />
                    <span>YouTube</span>
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>
          )}

          {/* Posts List */}
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post._id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                {/* Post Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={getProfilePictureUrl(post.author)}
                      alt={post.author.firstName}
                      className="w-14 h-14 rounded-full object-cover border-2 border-blue-200 shadow-md"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">
                        {post.author.firstName} {post.author.lastName}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {canDeletePost(user, post) && (
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-sm hover:shadow-md"
                        title="Delete post"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <div className="px-6 pb-5">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-base">{post.content}</p>
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
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-sm">
                      <FaHeart className="text-white text-xs" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
                  </span>
                </div>

                {/* Post Actions */}
                <div className="grid grid-cols-2 border-t border-gray-100">
                  <button
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center justify-center gap-2 px-4 py-3.5 font-semibold transition-all ${
                      post.likes.includes(user?.id)
                        ? 'text-blue-600 hover:bg-blue-50'
                        : 'text-gray-600 hover:bg-blue-50'
                    }`}
                  >
                    <FaHeart className={post.likes.includes(user?.id) ? 'fill-current' : ''} />
                    <span>Like</span>
                  </button>
                  <button
                    onClick={() => toggleComments(post._id)}
                    className="flex items-center justify-center gap-2 px-4 py-3.5 text-gray-600 hover:bg-blue-50 font-semibold transition-all border-l border-gray-100"
                  >
                    <FaComment />
                    <span>Comment</span>
                  </button>
                </div>

                {/* Comments Section */}
                {showCommentsFor === post._id && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    {/* Comments List */}
                    {post.comments && post.comments.length > 0 && (
                      <div className="px-6 py-4 space-y-4 max-h-96 overflow-y-auto">
                        {post.comments.map((comment) => (
                          <div key={comment._id} className="flex gap-3">
                            <img
                              src={getProfilePictureUrl(comment.user)}
                              alt={comment.user?.firstName}
                              className="w-10 h-10 rounded-full object-cover border-2 border-blue-200 flex-shrink-0"
                            />
                            <div className="flex-1">
                              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                                <p className="font-semibold text-gray-900 text-sm mb-1">
                                  {comment.user?.firstName} {comment.user?.lastName}
                                </p>
                                <p className="text-gray-800 text-sm leading-relaxed">{comment.content}</p>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 ml-4">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Comment Input */}
                    <div className="px-6 py-4 border-t border-gray-200">
                      <div className="flex gap-3">
                        <img
                          src={getProfilePictureUrl()}
                          alt={user?.firstName}
                          className="w-10 h-10 rounded-full object-cover border-2 border-blue-200 flex-shrink-0"
                        />
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={newComment[post._id] || ''}
                            onChange={(e) => setNewComment({ ...newComment, [post._id]: e.target.value })}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddComment(post._id);
                              }
                            }}
                            placeholder="Write a comment..."
                            className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                          />
                          <button
                            onClick={() => handleAddComment(post._id)}
                            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                          >
                            <FaPaperPlane />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {posts.length === 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-20 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 via-purple-100 to-blue-100 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <FaComment className="text-5xl text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No Posts Yet</h3>
                <p className="text-gray-600 text-lg">Be the first to share something with the community!</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Right */}
        <div className="hidden lg:block space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="text-center">
              <img
                src={getProfilePictureUrl()}
                alt={user?.firstName}
                className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-4 border-blue-200 shadow-lg"
              />
              <h3 className="font-bold text-gray-900 text-lg">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-sm font-semibold text-blue-600 capitalize mb-4">{user?.role || 'member'}</p>
              <div className="pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50">
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-xs text-gray-600 font-semibold">Posts</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50">
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-xs text-gray-600 font-semibold">Following</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
              Quick Links
            </h3>
            <div className="space-y-3">
              <a href="/events" className="flex items-center gap-3 p-3 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center group-hover:from-blue-600 group-hover:to-purple-600 transition-all shadow-sm">
                  <span className="text-lg group-hover:scale-110 transition-transform">📅</span>
                </div>
                <span className="font-semibold group-hover:text-blue-600 transition-colors">Events</span>
              </a>
              <a href="/sermons" className="flex items-center gap-3 p-3 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center group-hover:from-blue-600 group-hover:to-purple-600 transition-all shadow-sm">
                  <span className="text-lg group-hover:scale-110 transition-transform">🎙️</span>
                </div>
                <span className="font-semibold group-hover:text-blue-600 transition-colors">Sermons</span>
              </a>
            </div>
          </div>

          {/* Community Info */}
          <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 rounded-2xl border border-blue-200 p-6 shadow-lg">
            <h3 className="font-bold text-gray-900 mb-2">Welcome to Global Life!</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Connect, share, and grow together with our community.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Feed;
