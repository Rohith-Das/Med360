import React from 'react'
import styles from '../../App.module.scss'
import Navbar from '../../components/patient/Navbar'
import SideBar from '../../components/patient/SideBar'
function Home() {
  return (
 <>

 <div className="flex flex-col min-h-screen">
  <Navbar />
  <div className="flex flex-1">
    <SideBar />
    
  </div>
</div>

 </>   
 
  )
}

export default Home