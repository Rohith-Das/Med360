import React from 'react'
import NavbarFirstPage from '../../components/patient/FirstpageComponents/NavbarFirstPage'
import BannerFirstPage from '../../components/patient/FirstpageComponents/BannerFirstPage'
import HowItWorkFirstPage from '../../components/patient/FirstpageComponents/HowItWorkFirstPage'
import FooterFirstPage from '../../components/patient/FirstpageComponents/FooterFirstPage'

function FirstPage() {
  return (
    <>
    <NavbarFirstPage />
      <BannerFirstPage />
      <HowItWorkFirstPage />
      <FooterFirstPage />
    </>
  )
}

export default FirstPage