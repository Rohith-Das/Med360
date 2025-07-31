import React from 'react';
import { NavLink } from 'react-router-dom';

interface AdminNavbarProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'Patients', path: '/admin/patients' },
    { name: 'Appointments', path: '/admin/appointments' },
    { name: 'Specialisations', path: '/admin/specialisations' },
    { name: 'Applications', path: '/admin/applications' },
    { name: 'Settings', path: '/admin/settings' },
    { name: 'Logout', path: '/admin/logout' },
  ];

  return (
    <>
      {/* Navbar */}
      <nav className="bg-blue-600 text-white p-4 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden"
              onClick={toggleSidebar}
              aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className={`fixed top-16 left-0 z-40 w-64 bg-gray-800 text-white h-[calc(100vh-4rem)] p-4 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `block px-4 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'bg-blue-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
              onClick={() => isSidebarOpen && toggleSidebar()}
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default AdminNavbar;