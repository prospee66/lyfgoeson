import { Link } from 'react-router-dom';
import { FaCalendar, FaPrayingHands, FaVideo } from 'react-icons/fa';

const Home = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Welcome to Global Life Church</h1>
        <p className="text-lg opacity-90">Connect, Grow, and Serve Together</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/events" className="card hover:shadow-lg transition-shadow">
          <FaCalendar className="text-4xl text-primary-600 mb-3" />
          <h3 className="text-xl font-semibold mb-2">Events</h3>
          <p className="text-gray-600">Stay updated with upcoming church events and services</p>
        </Link>

        <Link to="/prayers" className="card hover:shadow-lg transition-shadow">
          <FaPrayingHands className="text-4xl text-primary-600 mb-3" />
          <h3 className="text-xl font-semibold mb-2">Prayer Requests</h3>
          <p className="text-gray-600">Share and pray for prayer requests</p>
        </Link>

        <Link to="/sermons" className="card hover:shadow-lg transition-shadow">
          <FaVideo className="text-4xl text-primary-600 mb-3" />
          <h3 className="text-xl font-semibold mb-2">Sermons</h3>
          <p className="text-gray-600">Watch and listen to past sermons</p>
        </Link>
      </div>
    </div>
  );
};

export default Home;
