import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash, FaChurch } from 'react-icons/fa';
import useAuthStore from '../../store/authStore';
import { toast } from 'react-toastify';

const Login = () => {
  const [activeTab, setActiveTab] = useState('member'); // 'member' or 'staff'
  const [memberView, setMemberView] = useState('register'); // 'register' or 'login'
  const [staffView, setStaffView] = useState('login'); // 'register' or 'login'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login form data
  const [memberLoginData, setMemberLoginData] = useState({
    email: '',
    password: ''
  });

  const [staffLoginData, setStaffLoginData] = useState({
    email: '',
    password: ''
  });

  // Register form data (for members)
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Register form data (for staff)
  const [staffRegisterData, setStaffRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const { login, register, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleMemberLoginChange = (e) => {
    setMemberLoginData({ ...memberLoginData, [e.target.name]: e.target.value });
  };

  const handleStaffLoginChange = (e) => {
    setStaffLoginData({ ...staffLoginData, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleStaffRegisterChange = (e) => {
    setStaffRegisterData({ ...staffRegisterData, [e.target.name]: e.target.value });
  };

  const handleMemberLogin = async (e) => {
    e.preventDefault();
    const result = await login(memberLoginData);
    if (result.success) {
      navigate('/feed');
    }
  };

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    const result = await login(staffLoginData);
    if (result.success) {
      navigate('/feed');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (registerData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const { confirmPassword, ...registerPayload } = registerData;
    const result = await register(registerPayload);
    if (result.success) {
      navigate('/feed');
    }
  };

  const handleStaffRegister = async (e) => {
    e.preventDefault();

    if (staffRegisterData.password !== staffRegisterData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (staffRegisterData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const { confirmPassword, ...registerPayload } = staffRegisterData;
    const result = await register(registerPayload);
    if (result.success) {
      navigate('/feed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 sm:p-6 lg:p-8">
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-6xl grid lg:grid-cols-2 bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border border-white/20">

        {/* Left Side - Hero Section */}
        <div className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 text-white overflow-hidden">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-10 left-10 w-32 h-32 border-4 border-white rounded-full"></div>
              <div className="absolute bottom-20 right-20 w-48 h-48 border-4 border-white rounded-full"></div>
              <div className="absolute top-1/2 right-10 w-24 h-24 border-4 border-white rounded-full"></div>
            </div>
          </div>

          {/* Logo Section */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <FaChurch className="text-3xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Global Life Church</h2>
                <p className="text-white/80 text-sm">Community Portal</p>
              </div>
            </div>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 space-y-6">
            <h1 className="text-5xl font-black leading-tight">
              Welcome to Your<br/>
              <span className="text-blue-200">Spiritual Community</span>
            </h1>
            <p className="text-xl text-white/90 leading-relaxed max-w-md">
              Connect, grow, and thrive together in faith. Join our vibrant community today.
            </p>

            {/* Features */}
            <div className="space-y-4 pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-xl">✓</span>
                </div>
                <span className="text-white/90">Stay connected with your church family</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-xl">✓</span>
                </div>
                <span className="text-white/90">Access sermons and events anytime</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-xl">✓</span>
                </div>
                <span className="text-white/90">Share prayer requests and testimonies</span>
              </div>
            </div>
          </div>

          {/* Decorative Element */}
          <div className="relative z-10 flex gap-2">
            <div className="w-12 h-1.5 bg-white rounded-full"></div>
            <div className="w-12 h-1.5 bg-white/40 rounded-full"></div>
            <div className="w-12 h-1.5 bg-white/40 rounded-full"></div>
          </div>
        </div>

        {/* Right Side - Form Section */}
        <div className="p-6 sm:p-8 lg:p-12 flex flex-col justify-center relative">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
              <FaChurch className="text-2xl text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Global Life Church</h2>
              <p className="text-gray-600 text-xs">Community Portal</p>
            </div>
          </div>

          {/* Main Tab Toggle - Members vs Staff */}
          <div className="flex gap-2 mb-8 p-1.5 bg-gray-100 rounded-xl">
            <button
              onClick={() => {
                setActiveTab('member');
                setShowPassword(false);
                setShowConfirmPassword(false);
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'member'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Members
            </button>
            <button
              onClick={() => {
                setActiveTab('staff');
                setShowPassword(false);
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'staff'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Staff
            </button>
          </div>

          {/* MEMBERS SECTION */}
          {activeTab === 'member' && (
            <>
              {/* Member Registration Form */}
              {memberView === 'register' && (
                <div className="animate-fadeIn">
                  <div className="mb-8">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Join Our Community</h2>
                    <p className="text-gray-600">Create your member account in just a few steps</p>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          First Name
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <FaUser />
                          </div>
                          <input
                            type="text"
                            name="firstName"
                            value={registerData.firstName}
                            onChange={handleRegisterChange}
                            required
                            className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                            placeholder="John"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Last Name
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <FaUser />
                          </div>
                          <input
                            type="text"
                            name="lastName"
                            value={registerData.lastName}
                            onChange={handleRegisterChange}
                            required
                            className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                            placeholder="Doe"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <FaEnvelope />
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={registerData.email}
                          onChange={handleRegisterChange}
                          required
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <FaLock />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={registerData.password}
                          onChange={handleRegisterChange}
                          required
                          minLength={6}
                          className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <FaLock />
                        </div>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={registerData.confirmPassword}
                          onChange={handleRegisterChange}
                          required
                          className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Account...
                        </span>
                      ) : (
                        'Create Account'
                      )}
                    </button>

                    <p className="text-center text-sm text-gray-600 mt-6">
                      Already have a member account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMemberView('login');
                          setShowPassword(false);
                          setShowConfirmPassword(false);
                        }}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Sign In
                      </button>
                    </p>
                  </form>
                </div>
              )}

              {/* Member Login Form */}
              {memberView === 'login' && (
                <div className="animate-fadeIn">
                  <div className="mb-8">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Member Sign In</h2>
                    <p className="text-gray-600">Welcome back! Sign in to your member account</p>
                  </div>

                  <form onSubmit={handleMemberLogin} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <FaEnvelope />
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={memberLoginData.email}
                          onChange={handleMemberLoginChange}
                          required
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <FaLock />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={memberLoginData.password}
                          onChange={handleMemberLoginChange}
                          required
                          className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-600 group-hover:text-gray-900">Remember me</span>
                      </label>
                      <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold">
                        Forgot Password?
                      </a>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Signing In...
                        </span>
                      ) : (
                        'Sign In'
                      )}
                    </button>

                    <p className="text-center text-sm text-gray-600 mt-6">
                      Don't have a member account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMemberView('register');
                          setShowPassword(false);
                        }}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Create Account
                      </button>
                    </p>
                  </form>
                </div>
              )}
            </>
          )}

          {/* STAFF SECTION */}
          {activeTab === 'staff' && (
            <>
              {/* Staff Registration Form */}
              {staffView === 'register' && (
                <div className="animate-fadeIn">
                  <div className="mb-8">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Create Staff Account</h2>
                    <p className="text-gray-600">Register as a church staff member</p>
                  </div>

                  <form onSubmit={handleStaffRegister} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          First Name
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <FaUser />
                          </div>
                          <input
                            type="text"
                            name="firstName"
                            value={staffRegisterData.firstName}
                            onChange={handleStaffRegisterChange}
                            required
                            className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                            placeholder="John"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Last Name
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <FaUser />
                          </div>
                          <input
                            type="text"
                            name="lastName"
                            value={staffRegisterData.lastName}
                            onChange={handleStaffRegisterChange}
                            required
                            className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                            placeholder="Doe"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Staff Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <FaEnvelope />
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={staffRegisterData.email}
                          onChange={handleStaffRegisterChange}
                          required
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                          placeholder="staff@globallifechurch.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <FaLock />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={staffRegisterData.password}
                          onChange={handleStaffRegisterChange}
                          required
                          minLength={6}
                          className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <FaLock />
                        </div>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={staffRegisterData.confirmPassword}
                          onChange={handleStaffRegisterChange}
                          required
                          className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Staff Account...
                        </span>
                      ) : (
                        'Create Staff Account'
                      )}
                    </button>

                    <p className="text-center text-sm text-gray-600 mt-6">
                      Already have a staff account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setStaffView('login');
                          setShowPassword(false);
                          setShowConfirmPassword(false);
                        }}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Sign In
                      </button>
                    </p>
                  </form>
                </div>
              )}

              {/* Staff Login Form */}
              {staffView === 'login' && (
                <div className="animate-fadeIn">
                  <div className="mb-8">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Staff Sign In</h2>
                    <p className="text-gray-600">Access your staff account</p>
                  </div>

                  <form onSubmit={handleStaffLogin} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Staff Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <FaEnvelope />
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={staffLoginData.email}
                          onChange={handleStaffLoginChange}
                          required
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                          placeholder="staff@globallifechurch.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <FaLock />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={staffLoginData.password}
                          onChange={handleStaffLoginChange}
                          required
                          className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-600 group-hover:text-gray-900">Remember me</span>
                      </label>
                      <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold">
                        Forgot Password?
                      </a>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Signing In...
                        </span>
                      ) : (
                        'Sign In as Staff'
                      )}
                    </button>

                    <p className="text-center text-sm text-gray-600 mt-6">
                      Don't have a staff account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setStaffView('register');
                          setShowPassword(false);
                        }}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Create Account
                      </button>
                    </p>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
