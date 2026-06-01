// src/profilepageComponents/Header.js
import React, { useContext } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { Context } from "../Context";
import { ROLE_ADMIN, ROLE_CUSTOMS } from "../config/roles";

import globeSvg from "../assets/globe.svg";
import profileSvg from "../assets/profile.svg";
import bellSvg from "../assets/bell.svg";
import supportSvg from "../assets/support.svg";

const Header = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { accountType } = useContext(Context);

  const segments = location.pathname.split("/").filter(Boolean);
  const title = getHeaderTitle(t, segments, accountType);

  return (
    <HeaderContainer>
      <Title>{title}</Title>
      <ButtonsContainer>
        {accountType !== ROLE_ADMIN && accountType !== ROLE_CUSTOMS && (
          <Link to={`/profile/${accountType.toLowerCase()}/Help`}>
            <Support>
              <img src={supportSvg} alt="Support" />
              {t("Sidebar_ContactSupport")}
            </Support>
          </Link>
        )}
        <Button src={bellSvg} alt="Notifications" style={{ width: "35px" }} />
        <LanguageButton
          onClick={() =>
            i18n.changeLanguage(i18n.resolvedLanguage === "en" ? "fr" : "en")
          }
        >
          <img src={globeSvg} alt="Language" />
          {i18n.resolvedLanguage === "en" ? "EN" : "FR"}
        </LanguageButton>
        {accountType !== ROLE_ADMIN && (
          <Link to={`/profile/${accountType.toLowerCase()}/Profile`}>
            <Button
              src={profileSvg}
              alt="Profile"
              style={{ width: "40px", background: "#20294C" }}
            />
          </Link>
        )}
      </ButtonsContainer>
    </HeaderContainer>
  );
};

export default Header;

const getHeaderTitle = (t, segments, accountType) => {
  const lastSegment = segments[segments.length - 1] || "";
  const previousSegment = segments[segments.length - 2] || "";
  const isNumericSegment = /^\d+$/.test(lastSegment);

  if (accountType === ROLE_CUSTOMS && lastSegment === "Declaration") {
    return t("Sidebar_Declarations");
  }

  if (previousSegment === "UserDetails") {
    return t("Sidebar_UserDetails");
  }

  if (isNumericSegment && previousSegment === "DeclareDevices") {
    return t("Declaration Status");
  }

  if (isNumericSegment && previousSegment) {
    return t(`Sidebar_${previousSegment}`);
  }

  return t(`Sidebar_${lastSegment}`);
};

const HeaderContainer = styled.div`
  display: flex;
  width: 100%;
  height: 75px;
  justify-content: space-between;
  align-items: center;
  background: #f5f6fa;
  padding: 15px 30px;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 700;
`;

const ButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const Support = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  text-decoration-line: underline;
`;

const Button = styled.img`
  border-radius: 50%;
  cursor: pointer;
  border-radius: 50px;
  background: #fff;
  padding: 5px;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.1);
  }
`;

const LanguageButton = styled.div`
  cursor: pointer;
  display: flex;
  padding: 6px 10px 6px 6px;
  gap: 6px;
  border-radius: 40px;
  background: #fff;
`;
