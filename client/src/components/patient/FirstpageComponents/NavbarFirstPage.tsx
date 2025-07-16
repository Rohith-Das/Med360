import React from 'react'
import { Stethoscope, Menu, X, User, HeartPulse, Phone, Info, Home } from "lucide-react";
import { useState } from "react";

function NavbarFirstPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-[#05523d] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20"> {/* Increased height */}
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-lg">
              <Stethoscope className="h-6 w-6 text-[#064E3B]" />
            </div>
            <span className="text-2xl font-bold text-white">Med360</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="flex items-center text-white hover:text-gray-200 transition-colors">
              <Home className="mr-1 h-4 w-4" /> Home
            </a>
            <a href="#" className="flex items-center text-white hover:text-gray-200 transition-colors">
              <HeartPulse className="mr-1 h-4 w-4" /> Services
            </a>
            <a href="#" className="flex items-center text-white hover:text-gray-200 transition-colors">
              <User className="mr-1 h-4 w-4" /> Doctors
            </a>
            <a href="#" className="flex items-center text-white hover:text-gray-200 transition-colors">
              <Info className="mr-1 h-4 w-4" /> About
            </a>
            <a href="#" className="flex items-center text-white hover:text-gray-200 transition-colors">
              <Phone className="mr-1 h-4 w-4" /> Contact
            </a>
            <button className="bg-white hover:bg-gray-100 text-[#064E3B] px-6 py-2 rounded-md font-semibold transition-colors flex items-center">
              Sign In
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-gray-200 p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-300/20">
            <div className="px-2 pt-2 pb-4 space-y-2">
              <a href="#" className="flex items-center px-3 py-3 text-white hover:bg-[#0a6b52] rounded-md transition-colors">
                <Home className="mr-2 h-5 w-5" /> Home
              </a>
              <a href="#" className="flex items-center px-3 py-3 text-white hover:bg-[#0a6b52] rounded-md transition-colors">
                <HeartPulse className="mr-2 h-5 w-5" /> Services
              </a>
              <a href="#" className="flex items-center px-3 py-3 text-white hover:bg-[#0a6b52] rounded-md transition-colors">
                <User className="mr-2 h-5 w-5" /> Doctors
              </a>
              <a href="#" className="flex items-center px-3 py-3 text-white hover:bg-[#0a6b52] rounded-md transition-colors">
                <Info className="mr-2 h-5 w-5" /> About
              </a>
              <a href="#" className="flex items-center px-3 py-3 text-white hover:bg-[#0a6b52] rounded-md transition-colors">
                <Phone className="mr-2 h-5 w-5" /> Contact
              </a>
              <div className="px-3 pt-2">
                <button className="w-full bg-white hover:bg-gray-100 text-[#064E3B] px-4 py-3 rounded-md font-semibold transition-colors flex justify-center items-center">
                  Sign In
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default NavbarFirstPage;