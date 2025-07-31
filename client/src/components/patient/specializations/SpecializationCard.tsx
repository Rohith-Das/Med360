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
  const { specializations, loading, error } = useAppSelector(state => state.specialization);

  useEffect(() => {
    dispatch(fetchSpecializations());
  }, [dispatch]);

  if (loading) return <div className="text-center py-8">Loading specializations...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  if (!specializations.length) return <div className="text-center py-8">No specializations available</div>;

  // Slider settings for sm and md screens
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    responsive: [
      {
        breakpoint: 1024, // lg breakpoint
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6 text-center">Our Specializations</h2>
      
      {/* Slider for sm and md screens */}
      <div className="lg:hidden">
        <Slider {...sliderSettings}>
          {specializations.map((spec: Specialization) => (
            <div key={spec.id} className="px-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-lg">
                <img src={spec.imageUrl} alt={spec.name} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{spec.name}</h3>
                  <Link
                    to={`/specialization/${spec.id}`}
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>

      {/* Grid for lg and larger screens */}
      <div className="hidden lg:grid grid-cols-4 xl:grid-cols-5 gap-6">
        {specializations.map((spec: Specialization) => (
          <div
            key={spec.id}
            className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-lg"
          >
            <img src={spec.imageUrl} alt={spec.name} className="w-full h-48 object-cover" />
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">{spec.name}</h3>
              <Link
                to={`/specialization/${spec.id}`}
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpecializationCard;