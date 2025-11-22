import '../../css/Navbar.scss'
import { useState, useEffect } from 'react';
import { FaBell, FaUserCircle } from 'react-icons/fa';
import { GiHamburgerMenu } from 'react-icons/gi';
import { Stethoscope } from 'lucide-react';
import { useSelector, UseSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Root } from 'react-dom/client';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate=useNavigate()
  const patient=useSelector((state:RootState)=>state.patientAuth.auth.patient)
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand/logo */}
        <div className="flex items-center space-x-3">
            <div className="bg-green p-2 rounded-lg">
              <Stethoscope className="h-6 w-6 text-[#064E3B]" />
            </div>
             <div className="navbar-brand">
          <a href="/">Med360</a>
        </div>
          </div>

        {/* Mobile menu button */}
        {isMobile && (
          <button className="navbar-toggle" onClick={toggleMenu}>
            <GiHamburgerMenu />
          </button>
        )}

        {/* Navigation items - shown on desktop or when mobile menu is open */}
        <div className={`navbar-items ${isMobile ? (isMenuOpen ? 'mobile-open' : 'mobile-closed') : ''}`}>
          {/* Placeholder for potential menu items */}
          <div className="navbar-links">
            {/* Add your navigation links here if needed */}
          </div>

          {/* Icons */}
          <div className="navbar-icons">
            <button className="icon-button notification">
              <FaBell />
              <span className="notification-badge">3</span>
            </button>
            {patient ? (
              <button 
                className="flex items-center justify-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
                onClick={() => navigate('/profile')}
              >
                {patient.profilePicture ? (
                  <img 
                    src={patient.profilePicture} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white">
                    {patient.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="ml-2 hidden md:inline-block">{patient.name}</span>
              </button>
            ) : (
              <button 
                className="icon-button profile"
                onClick={() => navigate('/login')}
              >
                <FaUserCircle />
              </button>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;