import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Bus, Users, ArrowLeft, LogOut, Settings, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navLinkClass = (path: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-semibold ${
      location.pathname === path
        ? 'bg-yellow-50 text-gray-900 border border-yellow-400/50 shadow-sm'
        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
    }`;

  const iconClass = (path: string) =>
    `w-5 h-5 ${location.pathname === path ? 'text-yellow-600' : ''}`;

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-gray-900 flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 p-6 flex flex-col shadow-sm z-20">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2 bg-[#FFC107] rounded-xl shadow-sm">
            <Bus className="w-6 h-6 text-gray-900" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">School Bus OS</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {user?.role === 'DRIVER' && (
            <Link to="/driver" className={navLinkClass('/driver')}>
              <Bus className={iconClass('/driver')} />
              <span>Driver Portal</span>
            </Link>
          )}
          
          {user?.role === 'PARENT' && (
            <Link to="/parent" className={navLinkClass('/parent')}>
              <Users className={iconClass('/parent')} />
              <span>Parent Portal</span>
            </Link>
          )}

          {user?.role === 'ADMIN' && (
            <>
              <Link to="/admin" className={navLinkClass('/admin')}>
                <BarChart3 className={iconClass('/admin')} />
                <span>Dashboard</span>
              </Link>
              <Link to="/admin/manage" className={navLinkClass('/admin/manage')}>
                <Settings className={iconClass('/admin/manage')} />
                <span>Manage Fleet</span>
              </Link>
            </>
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100 flex flex-col gap-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-bold transition-colors">
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFC107]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
