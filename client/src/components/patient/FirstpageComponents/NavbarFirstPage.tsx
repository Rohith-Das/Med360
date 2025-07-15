import React from 'react'
import { Stethoscope, Menu, X } from "lucide-react";
import { useState } from "react";

function NavbarFirstPage() {
 const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-green-500 text-blue-900 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Med360</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">
              Home
            </a>
            <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">
              Services
            </a>
            <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">
              Doctors
            </a>
            <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">
              About
            </a>
            <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">
              Contact
            </a>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold transition-colors">
  Sign In
</button>

          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                Home
              </a>
              <a href="#" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                Services
              </a>
              <a href="#" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                Doctors
              </a>
              <a href="#" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                About
              </a>
              <a href="#" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                Contact
              </a>
              <div className="px-3 py-2">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold transition-colors">
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

export default NavbarFirstPage