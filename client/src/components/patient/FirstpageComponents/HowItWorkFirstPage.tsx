import React from 'react'
import { Calendar, Video, Heart } from "lucide-react";

function HowItWorkFirstPage() {
  const steps = [
    {
      icon: Calendar,
      title: "Book Appointment",
      description: "Schedule your consultation with our qualified doctors at your convenient time. Choose from available slots and select your preferred doctor.",
      color: "bg-blue-500"
    },
    {
      icon: Video,
      title: "Virtual Appointment",
      description: "Join your secure video consultation from anywhere. Our platform ensures crystal-clear communication with your healthcare provider.",
      color: "bg-green-500"
    },
    {
      icon: Heart,
      title: "Follow-up Care",
      description: "Receive personalized care plans, prescription management, and ongoing health monitoring to ensure your wellness journey continues.",
      color: "bg-purple-500"
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get started with Med360 in three simple steps and experience healthcare like never before
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative hover:shadow-lg transition-shadow duration-300 border-0 shadow-md bg-white rounded-lg p-6 text-center">
              <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <step.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">{step.description}</p>

              {/* Step number */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-6">
            Ready to experience the future of healthcare?
          </p>
          <button className="bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition-colors duration-300 transform hover:scale-105">
            Get Started Today
          </button>
        </div>
      </div>
    </section>
  );
}

export default HowItWorkFirstPage;
