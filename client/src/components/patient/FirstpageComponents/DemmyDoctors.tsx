import React from "react";
import Doctor1 from '/images/10001.png';
import Doctor2 from '/images/10002.png';
import Doctor3 from '/images/10003.png';
import Doctor4 from '/images/10004.png';
import { useNavigate } from "react-router-dom";



type Feature={
      title: string;
  subtitle: string;
  image: string;
  bgColor: string;
}

const doctors:Feature[]=[
     {
    title: "Instant Video Consultation",
    subtitle: "Connect within 60 secs",
    image:Doctor1,
    bgColor: "bg-blue-100",
  },
  {
    title: "Find Doctors Near You",
    subtitle: "Confirmed appointments",
    image: Doctor2,
    bgColor: "bg-teal-100",
  },
  {
    title: "Lab Tests",
    subtitle: "Safe and trusted lab tests",
    image: Doctor3,
    bgColor: "bg-indigo-100",
  },
  {
    title: "Surgeries",
    subtitle: "Safe and trusted surgery centers",
    image: Doctor4,
    bgColor: "bg-gray-200",
  },
]

const DemmyDoctors:React.FC=()=>{

const navigate = useNavigate();

    return(
        <section className=" mx-auto
  w-full
  sm:w-[95%]
  md:w-[90%]
  lg:w-[85%]
  xl:w-[80%]
  2xl:w-[75%]">
            <div className="mx-auto max-w-7x4">
                <div   className="
            grid
            grid-cols-1
            gap-6
            sm:grid-cols-2
            lg:grid-cols-4
          ">
            {doctors.map((Feature,index)=>(
                <article
                  onClick={() => navigate("/login")}
                key={index}
                className="
                rounded-2xl
                bg-white
                shadow-md
                transition
                hover:-translate-y-1
                hover:shadow-lg
              ">
                 <div
                className={`
                  ${Feature.bgColor}
                  flex
                  items-center
                  justify-center
                  rounded-t-2xl
                  p-6
                  h-48
                `}
              >
                <img
                  src={Feature.image}
                  alt={Feature.title}
                  className="h-32 w-auto object-contain"
                  loading="lazy"
                />
              </div>
               <div className="p-5 text-left">
                <h3 className="text-lg font-semibold text-gray-900">
                  {Feature.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {Feature.subtitle}
                </p>
              </div>

                </article>
            ))}
                </div>

            </div>

        </section>
    )
}

export default DemmyDoctors;