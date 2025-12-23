import {
  Users,
  ThumbsUp,
  Stethoscope,
  BadgeCheck,
} from "lucide-react";

type StatItem = {
  value: string;
  label: string;
  icon: React.ReactNode;
};

const stats: StatItem[] = [
  {
    value: "100000+",
    label: "Satisfied Users",
    icon: <Users className="w-8 h-8 text-teal-600" />,
  },
  {
    value: "14000",
    label: "Hours of Online Sessions",
    icon: <ThumbsUp className="w-8 h-8 text-teal-600" />,
  },
  {
    value: "35",
    label: "Friendly Doctors",
    icon: <Stethoscope className="w-8 h-8 text-teal-600" />,
  },
  {
    value: "21",
    label: "Specialities",
    icon: <BadgeCheck className="w-8 h-8 text-teal-600" />,
  },
];

const MedicalProtocols = () => {
  return (
    <section className="w-full bg-[#e7f5f3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* LEFT CONTENT */}
          <div>
            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold text-black leading-tight">
              Medical Protocols for
              <br />
              Your Health &<br />
              Wellness
            </h1>

            <p className="mt-6 text-gray-600 text-sm sm:text-base max-w-xl leading-relaxed">
              Explore our expert-led <span className="font-semibold">clinical online protocols & Health Programs</span>
              designed for weight loss, wellness, and fitness. With video lessons,
              actionable tasks, and quizzes, achieve your health goals at your pace.
              Plus, our <span className="font-semibold">trusted Malayalam-speaking doctors</span>,
              trained at top medical colleges, are here to support NRIs and families
              worldwide with online health protocols that you can start & complete
              from the comforts of your home.
            </p>

            <button className="mt-8 px-8 py-4 rounded-full bg-teal-600 text-white font-semibold shadow-lg hover:bg-teal-700 transition">
              JOIN NOW
            </button>
          </div>

          {/* RIGHT STATS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative">
            {/* Divider lines (only on large screens) */}
            <div className="hidden sm:block absolute inset-0 pointer-events-none">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-300" />
            </div>

            {stats.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4"
              >
                {item.icon}
                <div>
                  <p className="text-3xl font-extrabold text-black">
                    {item.value}
                  </p>
                  <p className="text-gray-600 text-sm mt-1">
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MedicalProtocols;
