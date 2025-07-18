import React, { useState, useEffect } from 'react'
import {
  FaTimes,
  FaHome,
  FaCalendar,
  FaCommentMedical,
  FaUserMd,
  FaQuestionCircle,
  FaChevronDown,
  FaChevronUp,
  FaStethoscope
} from 'react-icons/fa'
import { GiHamburgerMenu } from 'react-icons/gi'
import '../../css/Sidebar.scss'
type MenuItem = {
  icon: React.JSX.Element;
  label: string;
  path: string;
  subItem?: { label: string; path: string }[];
}

function SideBar() {
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSideBar = () => {
    setIsOpen(!isOpen)
  }

  const toggleSubMenu = (label: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [label]: !prev[label]
    }))
  }

  const menuItems: MenuItem[] = [
    { icon: <FaHome />, label: 'Home', path: '/home' },
    { icon: <FaCalendar />, label: 'Appointment', path: '/appointment' },
    { icon: <FaStethoscope />, label: 'Doctor', path: '/doctor' },
    { icon: <FaCommentMedical />, label: 'Message', path: '/message' },
    { icon: <FaUserMd />, label: 'Health Profile', path: '/health-profile' },
    { icon: <FaQuestionCircle />, label: 'Help & Support', path: '/help-support' }
  ]

  return (
    <>
    {isMobile &&(
        <button className='sidebar-toggle' onClick={toggleSideBar}>
            <GiHamburgerMenu/>
        </button>
    )}
    {isMobile && isOpen&&(
        <div className="sidebar-overlay" onClick={toggleSideBar}/>

    )}
<aside className={`sidebar ${isMobile ? (isOpen ? 'mobile-open' :
 'mobile-closed') : ''}`}>
    {isMobile && (
        <button className='sidebar-close' onClick={toggleSideBar}>
            <FaTimes/>
        </button>
    )}
    <nav className='sidebar-menu'>
    <ul>
        {menuItems.map((item)=>(
            <li key={item.label} className={expandedItems[item.label]?'expanded':""}>
                <div className="menu-item-container">
                    <a href={item.path} onClick={(e)=>{
                        e.preventDefault();
                        toggleSideBar()
                    }}>
                        <span className='icon'>{item.icon}</span>
                        <span className='label'>{item.label}</span>
                    </a>
                </div>

            </li>
        ))}
    </ul>
    </nav>
    </aside>
    </>
  )
}

export default SideBar
