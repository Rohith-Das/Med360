import React from 'react'
import styles from '../../App.module.scss'
import Navbar from '../../components/patient/Navbar'
import SideBar from '../../components/patient/SideBar'
import HomeBanner from '../../components/patient/HomeBanner'
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
  </div>
</div>

 </>   
 
  )
}

export default Home