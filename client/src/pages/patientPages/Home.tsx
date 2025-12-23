import React from 'react'
import styles from '../../App.module.scss'
import Navbar from '../../components/patient/Navbar'
import HomeBanner from '../../components/patient/HomeBanner'
import SpecializationCard from '@/components/patient/specializations/SpecializationCard'
import DoctorsCards from '@/components/patient/DoctorsCards'
import BookingSteps from '@/components/patient/BookingSteps'
import Chatbot from '@/components/patient/Chatbot'
import MedicalProtocols from '@/components/patient/FirstpageComponents/MedicalProtocols'
import Footer from '@/components/patient/FirstpageComponents/Footer'



function Home() {
  return (
 <>

 <div className="flex flex-col min-h-screen">
  <Navbar />
  {/* <div className="flex flex-1">
    <SideBar />
    
  </div> */}
  <div>
     
    <HomeBanner/>
    <BookingSteps/>
    <SpecializationCard/>
    <DoctorsCards/>
    <MedicalProtocols/>
      <div className="mt-8">
        <Footer/>
          </div>
     <Chatbot
        position="bottom-right"
        initialMessage="Welcome to our medical portal! How can I assist you today?"
        botName="Health Assistant"
      />
   

  </div>
</div>

 </>   
 
  )
}

export default Home