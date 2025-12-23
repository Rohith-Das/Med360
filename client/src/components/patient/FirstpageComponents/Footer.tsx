import {
  Phone,
  MessageCircle,

} from "lucide-react";

import {FaInstagram, FaTwitter, FaWhatsapp} from 'react-icons/fa'


const Footer = () => {
  return (
    <footer className="bg-[#dceff1] w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-16">
        {/* TOP GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* ABOUT */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-gray-700">
              ABOUT
            </h3>
            <ul className="mt-6 space-y-3 text-sm text-gray-600">
              <li className="hover:text-teal-600 cursor-pointer">FAQ</li>
              <li className="hover:text-teal-600 cursor-pointer">Doctors Sign Up</li>
              <li className="hover:text-teal-600 cursor-pointer">Blog</li>
              <li className="hover:text-teal-600 cursor-pointer">Protocols</li>
            </ul>

            <h3 className="mt-8 text-sm font-semibold tracking-wider text-gray-700">
              GET THE APP
            </h3>
         
          </div>

          {/* CONTACT */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-gray-700">
              CONTACT US
            </h3>
            <div className="mt-6 space-y-4 text-sm text-gray-600">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-teal-600" />
                <span>Call +918100771199</span>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-teal-600" />
                <span>WhatsApp</span>
              </div>
            </div>

            <h3 className="mt-8 text-sm font-semibold tracking-wider text-gray-700">
              FOLLOW US
            </h3>
            <div className="mt-4 flex gap-3">
              <FaTwitter>
              </FaTwitter>
              <FaWhatsapp />
              <FaInstagram></FaInstagram>
              {/* <SocialIcon bg="bg-blue-600">
                <Facebook className="w-5 h-5 text-white" />
              </SocialIcon>
              <SocialIcon bg="bg-black">
                <span className="text-white font-bold">X</span>
              </SocialIcon>
              <SocialIcon bg="bg-gray-900">
                <Instagram className="w-5 h-5 text-white" />
              </SocialIcon> */}
            </div>
          </div>

          {/* NEWSLETTER */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-gray-700">
              SIGN UP FOR OUR NEWS LETTER
            </h3>
            <p className="mt-6 text-sm text-gray-600 max-w-sm">
              Subscribe to our newsletter & receive free health tips
            </p>
            <button className="mt-6 px-6 py-3 rounded-full bg-teal-600 text-white font-semibold hover:bg-teal-700 transition">
              SUBSCRIBE NOW
            </button>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="mt-16 border-t border-gray-300" />

        {/* BOTTOM */}
        <div className="mt-8 text-center text-sm text-gray-600 space-y-4">
          <p>
            Med360® is a registered trademark of med360 Solutions Private Limited.
          </p>
          <p>
            Copyright © 2025 to 2030. All rights reserved.
            <span className="text-teal-600 cursor-pointer">
              {" "}Privacy Policy
            </span>{" "}
            |{" "}
            <span className="text-teal-600 cursor-pointer">
              Terms & Conditions
            </span>{" "}
            |{" "}
            <span className="text-teal-600 cursor-pointer">
              Refund Policy
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;