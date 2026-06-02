// src/profilepageComponents/Header.js
import React, { useContext } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { Context } from "../Context";
import {
  ROLE_ADMIN,
  ROLE_CUSTOMS,
  ROLE_IMPORTER,
  ROLE_USER,
} from "../config/roles";

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
  const roleBadge = getRoleBadge(t, accountType);
  const supportPath = getSupportPath(accountType);

  return (
    <HeaderContainer>
      <TitleGroup>
        <Title>{title}</Title>
      </TitleGroup>
      <ButtonsContainer>
        {roleBadge && (
          <>
            <RoleBadge $tone={roleBadge.tone}>
              <RoleIcon aria-hidden="true" viewBox="0 0 24 24">
                <path d={roleBadge.iconPath} />
              </RoleIcon>
              {roleBadge.label}
            </RoleBadge>
            <Separator />
          </>
        )}
        {supportPath ? (
          <Link to={supportPath}>
            <Support>
              <img src={supportSvg} alt="Support" />
              {t("Sidebar_ContactSupport")}
            </Support>
          </Link>
        ) : (
          <Support as="div">
            <img src={supportSvg} alt="Support" />
            {t("Sidebar_ContactSupport")}
          </Support>
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

  if (accountType === ROLE_IMPORTER && lastSegment === "DeclareDevices") {
    return t("Header_MyDeclarations");
  }

  if (accountType === ROLE_USER && lastSegment === "DeclareDevices") {
    return t("Header_MyDevices");
  }

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

const getRoleBadge = (t, accountType) => {
  switch (accountType) {
    case ROLE_CUSTOMS:
      return {
        label: t("RoleBadge_CustomsOfficer"),
        tone: "customs",
        iconPath:
          "M12 3.75 18 6v5.25c0 4.15-2.55 7.82-6 9-3.45-1.18-6-4.85-6-9V6l6-2.25Zm0 3.2a2.3 2.3 0 0 0-2.3 2.3v.8H9a1 1 0 0 0-1 1V15a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-3.95a1 1 0 0 0-1-1h-.7v-.8A2.3 2.3 0 0 0 12 6.95Zm-1 3.1v-.8a1 1 0 1 1 2 0v.8h-2Z",
      };
    case ROLE_IMPORTER:
      return {
        label: t("RoleBadge_Importer"),
        tone: "importer",
        iconPath:
          "M4 9.5h16M7.5 9.5V6.75A1.75 1.75 0 0 1 9.25 5h5.5A1.75 1.75 0 0 1 16.5 6.75V9.5M6.25 19h11.5A1.75 1.75 0 0 0 19.5 17.25V8.75A1.75 1.75 0 0 0 17.75 7H6.25A1.75 1.75 0 0 0 4.5 8.75v8.5A1.75 1.75 0 0 0 6.25 19ZM9 13h6M9 16h3",
      };
    case ROLE_USER:
      return {
        label: t("RoleBadge_Individual"),
        tone: "individual",
        iconPath:
          "M12 12.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Zm0 1.75c-3.63 0-6.75 1.88-6.75 4.25 0 .28.22.5.5.5h12.5a.5.5 0 0 0 .5-.5c0-2.37-3.12-4.25-6.75-4.25Z",
      };
    case ROLE_ADMIN:
      return {
        label: t("RoleBadge_Administrator"),
        tone: "admin",
        iconPath:
          "m12 4 1.15 1.96 2.27.52.52 2.27L18 9.9l-1.96 1.15-.52 2.27-2.27.52L12 16l-1.15-1.96-2.27-.52-.52-2.27L6 9.9l1.96-1.15.52-2.27 2.27-.52L12 4Zm0 4.1a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6ZM5 17.75h14",
      };
    default:
      return null;
  }
};

const getSupportPath = (accountType) => {
  switch (accountType) {
    case ROLE_ADMIN:
      return "/profile/role_admin/Help";
    case ROLE_CUSTOMS:
      return "/profile/role_customs/Help";
    case ROLE_IMPORTER:
    case ROLE_USER:
      return `/profile/${accountType.toLowerCase()}/Help`;
    default:
      return null;
  }
};

const HeaderContainer = styled.div`
  display: flex;
  width: 100%;
  min-height: 75px;
  justify-content: space-between;
  align-items: center;
  gap: 12px 20px;
  flex-wrap: wrap;
  background: #f5f6fa;
  padding: 15px 30px;
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1 1 220px;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RoleBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  background: ${({ $tone }) => {
    switch ($tone) {
      case "customs":
        return "#fff4e8";
      case "importer":
        return "#eaf3ff";
      case "individual":
        return "#eafbf3";
      case "admin":
        return "#f1f3f7";
      default:
        return "#eef2ff";
    }
  }};
  color: ${({ $tone }) => {
    switch ($tone) {
      case "customs":
        return "#f28c28";
      case "importer":
        return "#2671d9";
      case "individual":
        return "#1c9d72";
      case "admin":
        return "#344054";
      default:
        return "#334155";
    }
  }};
`;

const RoleIcon = styled.svg`
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

const Separator = styled.div`
  width: 1px;
  height: 20px;
  background: #d7ddea;
  flex-shrink: 0;
`;

const ButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 0 1 auto;
  flex-wrap: wrap;
  gap: 14px;
  min-width: 0;
`;

const Support = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  text-decoration-line: underline;
  white-space: nowrap;
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
  white-space: nowrap;
`;
