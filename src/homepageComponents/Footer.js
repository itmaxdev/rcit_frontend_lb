// src/homepageComponents/Footer.js
import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

import logoWhite from "../assets/logoWhite.svg";
import facebook from "../assets/facebook.svg";
import instagram from "../assets/instagram.svg";
import linkedin from "../assets/linkedin.svg";
import twitter from "../assets/twitter.svg";
import arrow from "../assets/arrow-top-right.svg";

const Footer = ({ scrollToSection, refs }) => {
  const { t } = useTranslation();

  return (
    <FooterContainer>
      <LogoSection>
        <LogoImage src={logoWhite} alt="Logo" />
      </LogoSection>

      <ColumnsContainer>
        <Column>
          <Element onClick={() => scrollToSection(refs.homeRef)}>
            {t("Header_Home")}
          </Element>
          <Element onClick={() => scrollToSection(refs.imeiVerifyRef)}>
            {t("Header_VerifyIMEI")}
          </Element>
          <Element onClick={() => scrollToSection(refs.imeiDeclareRef)}>
            {t("Header_DeclareIMEI")}
          </Element>
          <Element onClick={() => scrollToSection(refs.aboutRef)}>
            {t("Header_About")}
          </Element>
          <Element onClick={() => scrollToSection(refs.faqRef)}>
            {t("Header_FAQs")}
          </Element>
          <Element onClick={() => scrollToSection(refs.contactRef)}>
            {t("Header_Contact")}
          </Element>
        </Column>
        <Column>
          <Link to="/signup">
            <Element>
              {t("Signup")}
              <img src={arrow} alt="arrow" />
            </Element>
          </Link>
          <Link to="/login">
            <Element>
              {t("Login")}
              <img src={arrow} alt="arrow" />
            </Element>
          </Link>
          <Element>{t("Footer_PrivacyPolicy")}</Element>
          <Element>{t("Footer_TermsOfService")}</Element>
        </Column>
        <Column>
          <Element
            style={{ color: "#C6CACE", fontWeight: 700, cursor: "default" }}
          >
            {t("Footer_UsefulLinks")}
          </Element>
          <Element>{t("Footer_LegalNotices")}</Element>
          <Element>MPTEN</Element>
          <Element>ARPCE</Element>
          <Element>ACSI</Element>
        </Column>
      </ColumnsContainer>

      <BottomSection>
        <Rights>{t("Footer_Rights")}</Rights>
        <Socials>
          {t("Footer_FollowUs")}
          <SVG src={facebook} alt="facebook" />
          <SVG src={instagram} alt="instagram" />
          <SVG src={linkedin} alt="linkedin" />
          <SVG src={twitter} alt="twitter" />
        </Socials>
      </BottomSection>
    </FooterContainer>
  );
};

export default Footer;

const FooterContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: start;
  flex-direction: column;
  background-color: #1d2025;
  padding: 60px 120px 0 120px;
  width: 100%;

  @media (max-width: 768px) {
    padding: 60px 30px 0 30px;
  }
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 30px;
`;

const LogoImage = styled.img`
  height: 26px;
`;

const LogoText = styled.h1`
  margin-left: 5px;
  font-family: "Michroma", serif;
  font-size: 24px;
  color: white;
`;

const ColumnsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  flex-wrap: wrap;
`;

const Column = styled.div`
  width: 33%;
  min-width: 150px;
  margin-bottom: 30px;
`;

const Element = styled.div`
  color: #9098a0;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: -0.1px;
  cursor: pointer;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
`;

const Rights = styled.div`
  font-size: 10px;
  @media (max-width: 768px) {
    margin-bottom: 10px;
  }
`;

const Socials = styled.div`
  color: #9098a0;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const BottomSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(144, 152, 160, 0.2);
  width: 100%;
  padding: 10px 0;
  opacity: 0.7;
  color: #9098a0;
  min-width: 450px;

  @media (max-width: 768px) {
    flex-direction: column;
    min-width: 0;
    gap: 15px;

    & > ${Rights} {
      order: 2; /* Place Rights after Socials */
    }

    & > ${Socials} {
      order: 1; /* Place Socials before Rights */
    }
  }
`;

const SVG = styled.img`
  height: 20px;
  cursor: pointer;
`;
