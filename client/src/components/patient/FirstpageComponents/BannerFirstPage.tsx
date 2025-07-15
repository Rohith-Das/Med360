import React from 'react'
import { Calendar, Clock, Shield } from "lucide-react";

function BannerFirstPage() {
 return (
    <section className="bg-gradient-to-r from-primary to-primary/80 text-blue">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h1 className="text-6xl lg:text-8xl font-bold leading-tight">
              Your Health,
              <br />
              <span className="text-primary-foreground/80">Our Priority</span>
            </h1>
            <p className="text-3xl text-primary-foreground/90 leading-relaxed">
              Connect with qualified doctors from the comfort of your home. 
              Get professional medical consultation 24/7 with Med360.
            </p>
            
            <div className="flex flex-wrap gap-4 text-xl">
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-primary-foreground/80" />
                <span>Easy Scheduling</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-primary-foreground/80" />
                <span>24/7 Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-primary-foreground/80" />
                <span>Secure & Private</span>
              </div>
            </div>

            <div className="pt-4">
                       <button
  className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 rounded-full font-semibold transition-all duration-300 transform hover:scale-105"
>
  Book Now
</button>
            </div>
          </div>

          {/* Right Content - Features Box Only */}
          <div className="relative">
            {/* Features Box */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Quick Appointments</h3>
                    <p className="text-primary-foreground/80">Book in just 2 minutes</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Secure Consultations</h3>
                    <p className="text-primary-foreground/80">HIPAA compliant platform</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Instant Access</h3>
                    <p className="text-primary-foreground/80">Connect with doctors now</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BannerFirstPage