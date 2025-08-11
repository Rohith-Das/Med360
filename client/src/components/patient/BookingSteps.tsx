import React from 'react'


const steps = [
  { number: 1, text: "Choose doctor specialisation" },
  { number: 2, text: "Check doctor's availability" },
  { number: 3, text: "Select date & time slot" },
  { number: 4, text: "Book an Appointment" },
];


function BookingSteps() {
   return (
    <div className="w-full py-8 px-4">
      <h2 className="text-center text-2xl md:text-3xl font-semibold mb-8">
        How to book online doctor consultation
      </h2>
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-8">
        {steps.map((step) => (
          <div
            key={step.number}
            className="flex items-center gap-3 max-w-xs text-center sm:text-left"
          >
            <div className="bg-teal-500 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded">
              <span className="text-yellow-300 text-lg sm:text-xl font-bold italic">
                {step.number}.
              </span>
            </div>
            <p className="text-gray-700 text-sm sm:text-base">{step.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BookingSteps