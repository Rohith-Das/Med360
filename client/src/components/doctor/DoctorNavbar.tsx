
import { useState, useEffect } from 'react';
import { FaBars, FaTimes, FaUserMd, FaCalendarAlt, FaComments, FaUserCircle, FaHome } from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';

const DoctorNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState('');


  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking a link
  const handleLinkClick = (link: string) => {
    setActiveLink(link);
    setIsOpen(false);
  };

  // Navigation items
  const navItems = [
    { name: 'Dashboard', path: 'dashboard', icon: <MdDashboard className="text-lg" /> },
    { name: 'Appointments', path: '/doctor/time-slots', icon: <FaCalendarAlt className="text-lg" /> },
    { name: 'Chat', path: 'chat', icon: <FaComments className="text-lg" /> },
    { name: 'Profile', path: 'profile', icon: <FaUserCircle className="text-lg" /> },
  ];

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-2' : 'bg-white md:bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <FaUserMd className="text-2xl text-blue-600" />
            <span className="text-xl font-bold text-blue-800 hidden sm:inline">DoctorPanel</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.path}
                href={`${item.path}`}
                onClick={() => handleLinkClick(item.path)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  activeLink === item.path
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </a>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-blue-600 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <FaTimes className="text-2xl" />
              ) : (
                <FaBars className="text-2xl" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden fixed inset-0 bg-white z-40 transform ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-300 ease-in-out mt-16`}
        >
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.path}
                  href={`${item.path}`}
                  onClick={() => handleLinkClick(item.path)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-lg ${
                    activeLink === item.path
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-blue-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DoctorNavbar;