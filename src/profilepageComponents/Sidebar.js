// src/profilepageComponents/Sidebar.js
import React, { useContext, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Context } from "../Context";

import logoSvg from "../assets/logo.svg";
import closeSidebarSvg from "../assets/closeSidebar.svg";
import dashboardSvg from "../assets/dashboard.svg";
import verifyIMEISvg from "../assets/verifyIMEI.svg";
import declareDevicesSvg from "../assets/declareDevices.svg";
import registerDevicesSvg from "../assets/registerDevices.svg";
import digitalWalletSvg from "../assets/digitalWallet.svg";
import reportsSvg from "../assets/reports.svg";
import helpSvg from "../assets/help.svg";
import profileSvg from "../assets/profile.svg";
import logoutSvg from "../assets/logout.svg";
import permissionSvg from "../assets/permissions.svg";

const Sidebar = ({ basePath }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [closed, setClosed] = useState(false);
  const { triggerLogOut, accountType } = useContext(Context);

  const handleLogout = () => {
    triggerLogOut();
    navigate("/login");
  };

  const mainTabs =
    accountType === "ROLE_ADMIN"
      ? [
          { icon: dashboardSvg, label: "Dashboard", disabled: true },
          { icon: declareDevicesSvg, label: "UserManagement", disabled: false },
          { icon: declareDevicesSvg, label: "RegisteredDevices", disabled: false },
          { icon: reportsSvg, label: "Reports", disabled: true },
          { icon: permissionSvg, label: "PermissionsAndRoles", disabled: true },
          { icon: helpSvg, label: "Help", disabled: false },
        ]
      : [
          { icon: dashboardSvg, label: "Dashboard", disabled: true },
          { icon: verifyIMEISvg, label: "VerifyIMEI", disabled: false },
          { icon: declareDevicesSvg, label: "DeclareDevices", disabled: false },
          {
            icon: registerDevicesSvg,
            label: "RegisterDevices",
            disabled: true,
          },
          { icon: digitalWalletSvg, label: "DigitalWallet", disabled: true },
          { icon: reportsSvg, label: "Reports", disabled: true },
          { icon: helpSvg, label: "Help", disabled: false },
        ];

  const footerTabs = [
    ...(accountType !== "ROLE_ADMIN"
      ? [{ icon: profileSvg, label: "Profile", disabled: false }]
      : []),
    {
      icon: logoutSvg,
      label: "Logout",
      function: handleLogout,
      disabled: false,
    },
  ];

  const handleTabClick = (tab) => {
    if (!tab.disabled) {
      if (tab.function) {
        tab.function();
      } else {
        navigate(basePath + tab.label);
      }
    }
  };

  return (
    <SidebarContainer>
      <Header closed={closed}>
        <LogoSection closed={closed}>
          <LogoImage src={logoSvg} alt="Logo" />
          <LogoText>RCIT</LogoText>
        </LogoSection>
        <CloseSidebar
          src={closeSidebarSvg}
          alt="Close"
          onClick={() => setClosed(!closed)}
          rotate={closed ? 180 : 0}
        />
      </Header>

      <Divider />

      <MainTabs>
        {mainTabs.map((tab, index) => (
          <Tab
            key={index}
            disabled={tab.disabled}
            onClick={() => handleTabClick(tab)}
          >
            <TabIcon src={tab.icon} alt={tab.label} />
            <TabText closed={closed}>{t("Sidebar_" + tab.label)}</TabText>
          </Tab>
        ))}
      </MainTabs>

      <Divider />

      <Footer>
        {footerTabs.map((tab, index) => (
          <Tab
            key={index}
            disabled={tab.disabled}
            onClick={() => handleTabClick(tab)}
          >
            <TabIcon src={tab.icon} alt={tab.label} />
            <TabText closed={closed}>{t("Sidebar_" + tab.label)}</TabText>
          </Tab>
        ))}
      </Footer>
    </SidebarContainer>
  );
};

export default Sidebar;

const SidebarContainer = styled.div`
  background-color: #1d2025;
  height: 100%;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  padding: 20px;

  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: ${({ closed }) => (closed ? "center" : "space-between")};
  align-items: center;
  gap: 20px;
`;

const LogoSection = styled.div`
  display: ${({ closed }) => (closed ? "none" : "flex")};
  align-items: center;
`;

const LogoImage = styled.img`
  height: 16px;
`;

const LogoText = styled.h1`
  margin-left: 5px;
  margin-bottom: 2px;
  font-family: "Michroma", serif;
  font-size: 18px;
  color: white;
`;

const CloseSidebar = styled.img`
  cursor: pointer;
  height: 20px;

  transform: rotate(${(props) => props.rotate}deg);
`;

const Divider = styled.hr`
  border: 1px solid #9098a0;
  margin: 20px 0;
  opacity: 0.3;
`;

const MainTabs = styled.div`
  flex: 1;
`;

const Footer = styled.div`
  margin-top: auto;
`;

const Tab = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 10px;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  border-radius: 10px;
  transition: background-color 0.2s;
  opacity: ${({ disabled }) => (disabled ? 0.3 : 1)};

  &:hover {
    background-color: ${({ disabled }) =>
      disabled ? "inherit" : "rgba(144, 152, 160, 0.2)"};
  }
`;

const TabIcon = styled.img`
  height: 18px;
`;

const TabText = styled.p`
  color: white;
  font-size: 12px;

  display: ${({ closed }) => (closed ? "none" : "flex")};
`;
