import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        <Sidebar />

        {/* Main content - Add bottom padding on mobile for bottom nav */}
        <main className="flex-1 lg:ml-64 mt-16 p-3 sm:p-4 md:p-6 pb-20 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  );
};

export default Layout;
