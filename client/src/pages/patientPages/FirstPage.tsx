
import styles from '../../App.module.scss'
import Navbar from '../../components/patient/Navbar'
import SideBar from '../../components/patient/SideBar'
import HomeBanner from '../../components/patient/HomeBanner'
import React, { useState, useEffect } from 'react';
import doctorBanner from '/images/ThreeDoc-Banner-carausel3_1.webp';
import BannerImage2 from '/images/Single-docarausel_1.webp';
import bannerImage3 from '/images/phone_f.webp';
import { FaChevronCircleLeft, FaChevronCircleRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';


const banners = [
  {
    id: 1,
    image: doctorBanner,
    title: "CONSULT ANY DOCTOR ACROSS ALL SPECIALTIES",
    buttonText: "Book an Appointment",
    bgColor: "bg-yellow-500",
    buttonColor: "bg-blue-700 hover:bg-blue-800"
  },
  {
    id: 2,
    image: BannerImage2,
    title: "SET UP YOUR ONLINE CLINIC IN JUST 0 MINUTES",
    buttonText: "Book an Appointment",
    bgColor: "bg-blue-500",
    buttonColor: "bg-green-700 hover:bg-green-800"
  },
  {
    id: 3,
    image: bannerImage3,
    title: "CONSULT YOUR DOCTOR \n ANYTIME, ANYWHERE!",
    buttonText: "Book an Appointment",
    bgColor: "bg-green-500",
    buttonColor: "bg-blue-700 hover:bg-blue-800"
  }
];



function Home() {
  const navigate=useNavigate()

    const [currentSlider, setCurrentSlider] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
    const nextSlider = () => {
      setCurrentSlider((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
      resetAutoplay();
    };
  
    const prevSlide = () => {
      setCurrentSlider((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
      resetAutoplay();
    };
  
    const goToSlide = (index:any) => {
      setCurrentSlider(index);
      resetAutoplay();
    };
  
    const resetAutoplay = () => {
      setIsAutoPlaying(false);
      setTimeout(() => setIsAutoPlaying(true), 4000);
    };
  
    useEffect(() => {
      let interval:any;
      if (isAutoPlaying) {
        interval = setInterval(() => {
          setCurrentSlider((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
        }, 6000);
      }
      return () => clearInterval(interval);
    }, [isAutoPlaying]);
  
  return (
 <>

 <div className="flex flex-col min-h-screen">
  <Navbar />
  {/* <div className="flex flex-1">
    <SideBar />
    
  </div> */}
  <div>
     <div className="relative w-full overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlider * 100}%)` }}
          >
            {banners.map((banner) => (
              <div
                key={banner.id}
                className={`w-full flex-shrink-0 ${banner.bgColor} h-[520px] flex flex-col md:flex-row items-center justify-center px-10`}
              >
                <div className="md:w-1/2 text-white text-center md:text-left md:pl-10">
                  <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                    {banner.title}
                  </h1>
                  <button
                    onClick={() => navigate('/login')}
                    className={`${banner.buttonColor} text-white font-semibold px-5 py-2 rounded transition-colors`}
                  >
                    {banner.buttonText}
                  </button>
                </div>
                <div className="md:w-1/2 mt-6 md:mt-0 flex justify-center">
                  <img
                    src={banner.image}
                    alt="Banner"
                    className="max-w-[400px] h-auto object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
    
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-75 text-gray-800 p-2 rounded-full shadow-md transition-all"
            aria-label="Previous Slide"
          >
            <FaChevronCircleLeft size={24} />
          </button>
          <button
            onClick={nextSlider}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-75 text-gray-800 p-2 rounded-full shadow-md transition-all"
            aria-label="Next Slide"
          >
            <FaChevronCircleRight size={24} />
          </button>
    
          {/* Pagination Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${currentSlider === index ? "bg-white w-6" : "bg-white bg-opacity-50"}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
  </div>
</div>

 </>   
 
  )
}

export default Home