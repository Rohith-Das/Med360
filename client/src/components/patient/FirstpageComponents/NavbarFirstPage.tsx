import { NavLink } from "react-router-dom";
import { useState } from "react";
import { Menu, X,Stethoscope } from "lucide-react";
import { GiHamburgerMenu } from 'react-icons/gi';
const NavbarFirstPage = () => {
  const [open, setOpen] = useState(false);



  return (
   
    <nav className="w-full h-20 px-6 flex items-center justify-between border-b bg-white 
                  fixed top-0 left-0 right-0 z-50">
      {/* Left */}
      <div className="flex items-center gap-6">
        {/* Logo */}
         <Stethoscope className="h-6 w-6 text-[#064E3B]" />
        <div className="flex items-center gap-2 font-bold text-lg">
         <a href="/">Med360</a>
        </div>

        {/* Desktop Tabs */}
      
<div className="hidden md:flex bg-gray-100 rounded-full p-1 gap-x-2">
  <NavLink
    to="/login"
    end                                 // ← Add this!
    className={({ isActive }: { isActive: boolean }) =>
      `px-4 py-2 rounded-full text-sm transition-all duration-200
       ${
         isActive
           ? "bg-white text-black shadow"
           : "text-gray-600 hover:bg-white hover:text-black hover:shadow"
       }`
    }
  >
    Solutions
  </NavLink>
  <NavLink
    to="/login"
    className={({ isActive }: { isActive: boolean }) =>
      `px-4 py-2 rounded-full text-sm transition-all duration-200
       ${
         isActive
           ? "bg-white text-black shadow"
           : "text-gray-600 hover:bg-white hover:text-black hover:shadow"
       }`
    }
  >
    Build
  </NavLink>
  <NavLink
    to="/login"
    className={({ isActive }: { isActive: boolean }) =>
      `px-4 py-2 rounded-full text-sm transition-all duration-200
       ${
         isActive
           ? "bg-white text-black shadow"
           : "text-gray-600 hover:bg-white hover:text-black hover:shadow"
       }`
    }
  >
    Ecosystem
  </NavLink>
</div>
      </div>

      {/* Right Buttons (Desktop) */}
      <div className="hidden md:flex gap-3">
        <button className="bg-black text-white px-4 py-2 rounded-full text-sm flex items-center gap-1">
          Launch App ↗
        </button>
        <button className="bg-black text-white px-4 py-2 rounded-full text-sm flex items-center gap-1">
          Start Building ↗
        </button>
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu */}
      {open && (
        <div className="absolute top-18 left-0 w-full bg-white border-b md:hidden">
          <div className="flex flex-col p-4 gap-3">
            <NavLink onClick={() => setOpen(false)} to="/login" className="py-2">
              Solutions
            </NavLink>
            <NavLink onClick={() => setOpen(false)} to="/login" className="py-2">
              Build
            </NavLink>
            <NavLink onClick={() => setOpen(false)} to="/login" className="py-2">
              Ecosystem
            </NavLink>

            <div className="flex flex-col gap-2 pt-4">
              <button className="bg-black text-white py-2 rounded-full">
               <a href="/login">
                Launch App ↗</a>
              </button>
              <button className="bg-black text-white py-2 rounded-full">
                Start Building ↗
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavbarFirstPage;
