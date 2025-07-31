import React from 'react'
import styles from '../../App.module.scss'
import Navbar from '../../components/patient/Navbar'
import SideBar from '../../components/patient/SideBar'
import HomeBanner from '../../components/patient/HomeBanner'
import SpecializationCard from '@/components/patient/specializations/SpecializationCard'


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
    <SpecializationCard/>
  </div>
</div>

 </>   
 
  )
}

export default Home