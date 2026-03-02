// src/pages/HomePage.js
import React, { useRef } from "react";
import styled from "styled-components";
import Header from "../homepageComponents/Header";
import TitleCard from "../homepageComponents/TitleCard";
import IMEICheck from "../homepageComponents/IMEICheck";
import IMEIVerify from "../homepageComponents/IMEIVerify";
import CompliantCard from "../homepageComponents/CompliantCard";
import AboutCard from "../homepageComponents/AboutCard";
import DeclareCard from "../homepageComponents/DeclareCard";
import FAQ from "../homepageComponents/FAQ";
import Footer from "../homepageComponents/Footer";
import SupportCard from "../homepageComponents/SupportCard";
import DeclareFooter from "../homepageComponents/DeclareFooter";

const HomePage = () => {
  const homeRef = useRef(null);
  const imeiDeclareRef = useRef(null);
  const imeiVerifyRef = useRef(null);
  const aboutRef = useRef(null);
  const faqRef = useRef(null);
  const contactRef = useRef(null);

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <HomePageContainer>
      <div ref={homeRef}>
        <Header
          scrollToSection={scrollToSection}
          refs={{
            homeRef,
            imeiDeclareRef,
            imeiVerifyRef,
            aboutRef,
            faqRef,
            contactRef,
          }}
        />
      </div>
      <TitleCard scrollToSection={scrollToSection} refs={imeiVerifyRef} />
      <IMEICheck />
      <div ref={imeiVerifyRef}>
        <IMEIVerify />
      </div>
      <CompliantCard />
      <div ref={aboutRef}>
        <AboutCard />
      </div>
      <div ref={imeiDeclareRef}>
        <DeclareCard />
      </div>
      <div ref={faqRef}>
        <FAQ />
      </div>
      <div ref={contactRef}>
        <SupportCard />
      </div>
      <DeclareFooter />
      <Footer
        scrollToSection={scrollToSection}
        refs={{
          homeRef,
          imeiDeclareRef,
          imeiVerifyRef,
          aboutRef,
          faqRef,
          contactRef,
        }}
      />
    </HomePageContainer>
  );
};

export default HomePage;

const HomePageContainer = styled.div``;
