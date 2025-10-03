// components/DoctorNavbar.tsx
import { useState, useEffect } from 'react';
import { FaBars, FaTimes, FaUserMd, FaCalendarAlt, FaComments, FaUserCircle, FaBell } from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch,useAppSelector } from '@/app/hooks';
import { fetchUnreadCount } from '@/features/notification/notificationSlice';
const DoctorNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState('');
  
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { unreadCount } = useAppSelector((state) => state.notifications);

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

  // Fetch unread count on component mount
  useEffect(() => {
    dispatch(fetchUnreadCount());
    
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      dispatch(fetchUnreadCount());
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // Close mobile menu when clicking a link
  const handleLinkClick = (link: string) => {
    setActiveLink(link);
    setIsOpen(false);
  };

  // Handle notification bell click
  const handleNotificationClick = () => {
    navigate('/doctor/notifications');
    setIsOpen(false);
  };

  // Navigation items
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <MdDashboard className="text-lg" /> },
    { name: 'Schedules', path: '/doctor/time-slots', icon: <FaCalendarAlt className="text-lg" /> },
    { name: 'Appointments', path: '/doctor/appointments', icon: <FaCalendarAlt className="text-lg" /> },
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
            
            {/* Notification Bell */}
            <button
              onClick={handleNotificationClick}
              className="relative p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <FaBell className="text-xl" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Notification Bell */}
            <button
              onClick={handleNotificationClick}
              className="relative p-2 text-gray-700 hover:text-blue-600"
              aria-label="Notifications"
            >
              <FaBell className="text-xl" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
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
              
              {/* Mobile Notifications Link */}
              <button
                onClick={handleNotificationClick}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-lg text-gray-700 hover:bg-blue-50 w-full text-left"
              >
                <div className="relative">
                  <FaBell className="text-lg" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DoctorNavbar;