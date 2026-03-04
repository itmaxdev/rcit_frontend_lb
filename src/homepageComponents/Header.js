// src/homepageComponents/Header.js
import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Context } from "../Context";

import logoWhite from "../assets/logoWhite.svg";
import globeSvg from "../assets/globe.svg";
import globeWhiteSvg from "../assets/globeWhite.svg";
import arrowSvg from "../assets/arrow-long-right.svg";
import menuSvg from "../assets/menu.svg";
import userSvg from "../assets/user.svg";
import userWhiteSvg from "../assets/userWhite.svg";

const Header = ({ scrollToSection, refs }) => {
  const { t, i18n } = useTranslation();
  const { isLoggedIn, accountType } = useContext(Context);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMenu = () => setIsMobileMenuOpen((prev) => !prev);

  return (
    <HeaderContainer>
      <LogoSection>
        <LogoImage src={logoWhite} alt="Logo" />
      </LogoSection>

      <DesktopNavBar>
        <NavItem onClick={() => scrollToSection(refs.homeRef)}>
          {t("Header_Home")}
        </NavItem>
        <NavItem onClick={() => scrollToSection(refs.imeiVerifyRef)}>
          {t("Header_VerifyIMEI")}
        </NavItem>
        <NavItem onClick={() => scrollToSection(refs.imeiDeclareRef)}>
          {t("Header_DeclareIMEI")}
        </NavItem>
        <NavItem onClick={() => scrollToSection(refs.aboutRef)}>
          {t("Header_About")}
        </NavItem>
        <NavItem onClick={() => scrollToSection(refs.faqRef)}>
          {t("Header_FAQs")}
        </NavItem>
        <NavItem onClick={() => scrollToSection(refs.contactRef)}>
          {t("Header_Contact")}
        </NavItem>
      </DesktopNavBar>

      <Actions>
        <LanguageButton
          onClick={() =>
            i18n.changeLanguage(i18n.resolvedLanguage === "en" ? "fr" : "en")
          }
        >
          <img src={globeWhiteSvg} alt="Language" />
          {i18n.resolvedLanguage === "en" ? "EN" : "FR"}
        </LanguageButton>
        <DesktopActions>
          <Link to={isLoggedIn ? "/profile" : "/login"}>
            <LoginButton isLoggedIn={isLoggedIn}>
              {isLoggedIn ? (
                <img
                  src={userWhiteSvg}
                  alt="User Profile"
                  style={{ width: "30px" }}
                />
              ) : (
                t("Login")
              )}
            </LoginButton>
          </Link>
          <Link to={isLoggedIn ? `/profile/${accountType}/DeclareDevices` : "/signup"}>
            <DeclareButton>
              <span>{t("Declare Devices")}</span>
              <hr />
              <span>{t("For Individuals & Importers")}</span>
            </DeclareButton>
          </Link>
        </DesktopActions>
        <MenuButton onClick={toggleMenu}>
          <img src={menuSvg} alt="Menu" />
        </MenuButton>
      </Actions>

      {isMobileMenuOpen && (
        <MobileMenu>
          <NavItem onClick={() => scrollToSection(refs.homeRef)}>
            {t("Header_Home")}
          </NavItem>
          <NavItem onClick={() => scrollToSection(refs.imeiVerifyRef)}>
            {t("Header_VerifyIMEI")}
          </NavItem>
          <NavItem onClick={() => scrollToSection(refs.imeiDeclareRef)}>
            {t("Header_DeclareIMEI")}
          </NavItem>
          <NavItem onClick={() => scrollToSection(refs.aboutRef)}>
            {t("Header_About")}
          </NavItem>
          <NavItem onClick={() => scrollToSection(refs.faqRef)}>
            {t("Header_FAQs")}
          </NavItem>
          <NavItem onClick={() => scrollToSection(refs.contactRef)}>
            {t("Header_Contact")}
          </NavItem>
          <Link to={isLoggedIn ? "/profile" : "/login"}>
            <LoginButton isLoggedIn={isLoggedIn}>
              {isLoggedIn ? (
                <img src={userSvg} alt="User Profile" />
              ) : (
                t("Login")
              )}
            </LoginButton>
          </Link>
          <Link to={isLoggedIn ? `/profile/${accountType}/DeclareDevices` : "/signup"}>
            <DeclareButton>
              <span>{t("Declare Devices")}</span>
              <hr />
              <span>{t("For Individuals & Importers")}</span>
            </DeclareButton>
          </Link>
        </MobileMenu>
      )}
    </HeaderContainer>
  );
};

export default Header;

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22px;
  background-color: #1d2025;
  position: relative;
  gap: 50px;

  @media (max-width: 768px) {
    padding: 10px 30px;
    justify-content: space-between;
  }

  @media (max-width: 1100px) and (min-width: 769px) {
    padding: 20px;
    gap: 20px;
  }
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
`;

const LogoImage = styled.img`
  height: 26px;
`;

const LogoText = styled.h1`
  margin-left: 5px;
  font-family: "Michroma", serif;
  font-size: 24px;

  @media (max-width: 1100px) and (min-width: 769px) {
    font-size: 22px;
  }
`;

const DesktopNavBar = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;

  @media (max-width: 768px) {
    display: none;
  }

  @media (max-width: 1100px) and (min-width: 769px) {
    gap: 10px;
  }
`;

const NavItem = styled.div`
  font-size: 15px;
  cursor: pointer;
  text-align: center;
  color:#fff;
  @media (max-width: 768px) {
    color: #1d2025;
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LanguageButton = styled.div`
  cursor: pointer;
  display: flex;
  padding: 6px 10px 6px 6px;
  gap: 6px;
  border-radius: 40px;
  color: #f5f6fa;
`;

const MenuButton = styled.div`
  cursor: pointer;
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileMenu = styled.div`
  position: absolute;
  top: 60px;
  left: 0;
  right: 0;
  background-color: #f5f6fa;
  padding: 30px;
  gap: 10px;
  display: flex;
  flex-direction: column;
  z-index: 10;

  @media (min-width: 769px) {
    display: none;
  }
`;

const DesktopActions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  @media (max-width: 768px) {
    display: none;
  }
`;

const LoginButton = styled.button`
  cursor: pointer;
  display: flex;
  padding: ${(props) => (props.isLoggedIn ? "9px" : "16px 20px")};
  justify-content: center;
  align-items: center;
  border-radius: 24px;
  border: 1px solid #fff;
  color: #fff;
  background: transparent;
  white-space: nowrap;
  font-size: 14px;
  width: 100%;

  @media (max-width: 1100px) and (min-width: 769px) {
    padding: ${(props) => (props.isLoggedIn ? "6px" : "12px 18px")};
    font-size: 12px;
  }
`;

const DeclareButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  padding: 5px 20px 5px 20px;
  gap: 3px;
  color: #fff;
  border-radius: 38px;
  border: 1px solid #436C4D;
  background: #436C4D;
  white-space: nowrap;
  font-size: 14px;
  width: 100%;
  >hr{
    width: 100%;
    border: 0;
    border-top: 1px solid #ddd;
  }
  @media (max-width: 1100px) and (min-width: 769px) {
    padding: 9px 15px;
    font-size: 12px;
  }
`;
