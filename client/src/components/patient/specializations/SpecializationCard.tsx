



import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchSpecializations } from "@/features/specialization/specializationSlice";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface Specialization {
  id: string;
  name: string;
  imageUrl: string;
}

const SpecializationCard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { specializations, loading, error } = useAppSelector((state) => state.specialization);

  useEffect(() => {
    dispatch(fetchSpecializations());
  }, [dispatch]);

  if (loading) return <div className="py-12 text-center text-lg font-semibold text-gray-700">Loading specializations...</div>;
  if (error) return <div className="py-12 text-center text-lg font-semibold text-red-500">Error: {error}</div>;
  if (!specializations.length) return <div className="py-12 text-center text-lg font-semibold text-gray-500">No specializations available.</div>;

  // Slider settings for small and medium screens
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false, // Arrows are now hidden for smaller screens
    responsive: [
      {
        breakpoint: 768,
        settings: {
          arrows: true,
        },
      },
    ],
  };

  const cardClasses = "bg-white rounded-xl shadow-lg hover:shadow-2xl transform transition-all duration-500 hover:scale-105 overflow-hidden border border-gray-100";
  const imageClasses = "w-full h-48 object-cover rounded-t-xl transition-transform duration-500 group-hover:scale-110";
  const titleClasses = "text-2xl font-bold text-gray-800 mb-2";
  const buttonClasses = "mt-4 inline-block bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105";

  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-12 tracking-tight">
          Explore Our Specializations
        </h2>

        {/* Slider for tablets and smaller screens */}
        <div className="lg:hidden">
          <Slider {...sliderSettings}>
            {specializations.map((spec: Specialization) => (
              <div key={spec.id} className="px-4 py-2">
                <Link to={`/specialization/${spec.id}`} className="group block">
                  <div className={cardClasses}>
                    <div className="relative overflow-hidden">
                      <img src={spec.imageUrl} alt={spec.name} className={imageClasses} />
                      <div className="absolute inset-0 bg-black bg-opacity-25 group-hover:bg-opacity-0 transition-all duration-500"></div>
                    </div>
                    <div className="p-6 text-center">
                      <h3 className={titleClasses}>{spec.name}</h3>
                      <span className="text-blue-600 font-medium hover:underline">View Doctors</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </Slider>
        </div>

        {/* Grid for desktop screens */}
        <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
          {specializations.map((spec: Specialization) => (
            <Link to={`/specialization/${spec.id}`} key={spec.id} className="group block">
              <div className={cardClasses}>
                <div className="relative overflow-hidden">
                  <img src={spec.imageUrl} alt={spec.name} className={imageClasses} />
                  <div className="absolute inset-0 bg-black bg-opacity-25 group-hover:bg-opacity-0 transition-all duration-500"></div>
                </div>
                <div className="p-6 text-center">
                  <h3 className={titleClasses}>{spec.name}</h3>
                  <span className="text-blue-600 font-medium hover:underline">View Doctors</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SpecializationCard;