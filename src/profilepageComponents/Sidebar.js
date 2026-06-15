// src/profilepageComponents/Sidebar.js
import React, { useContext, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { Context } from "../Context";

import logoWhite from "../assets/logoWhite.svg";
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
import {
  ROLE_ADMIN,
  ROLE_CUSTOMS,
  ROLE_IMPORTER,
} from "../config/roles";

const Sidebar = ({ basePath }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [closed, setClosed] = useState(false);
  const { triggerLogOut, accountType } = useContext(Context);

  const handleLogout = () => {
    triggerLogOut();
    navigate("/login");
  };

  const mainTabs =
    accountType === ROLE_ADMIN
      ? [
          { icon: dashboardSvg, label: "Dashboard", disabled: true },
          { icon: declareDevicesSvg, label: "UserManagement", disabled: false },
          { icon: permissionSvg, label: "Configuration", disabled: false },
          { icon: permissionSvg, label: "TACInfo", disabled: false },
          { icon: declareDevicesSvg, label: "RegisteredDevices", disabled: false },
          { icon: reportsSvg, label: "Reports", disabled: true },
          { icon: permissionSvg, label: "PermissionsAndRoles", disabled: true },
          { icon: helpSvg, label: "Help", disabled: false },
        ]
      : accountType === ROLE_CUSTOMS
      ? [
          { icon: dashboardSvg, label: "Dashboard", disabled: false },
          {
            icon: declareDevicesSvg,
            label: "Declaration",
            translationKey: "Declarations",
            disabled: false,
            children: [
              {
                label: "Declaration",
                translationKey: "Active",
                disabled: false,
              },
              {
                label: "Declaration/Archived",
                translationKey: "Archived",
                disabled: false,
              },
            ],
          },
          { icon: permissionSvg, label: "TACInfo", disabled: false },
        ]
      : accountType === ROLE_IMPORTER
      ? [
          { icon: dashboardSvg, label: "Dashboard", disabled: true },
          { icon: verifyIMEISvg, label: "VerifyIMEI", disabled: false },
          {
            icon: declareDevicesSvg,
            label: "DeclareDevices",
            disabled: false,
            children: [
              {
                label: "DeclareDevices",
                translationKey: "Active",
                disabled: false,
              },
              {
                label: "DeclareDevices/Archived",
                translationKey: "Archived",
                disabled: false,
              },
            ],
          },
          {
            icon: registerDevicesSvg,
            label: "RegisterDevices",
            disabled: true,
          },
          { icon: digitalWalletSvg, label: "DigitalWallet", disabled: true },
          { icon: reportsSvg, label: "Reports", disabled: true },
          { icon: helpSvg, label: "Help", disabled: false },
        ]
      : [
          { icon: dashboardSvg, label: "Dashboard", disabled: true },
          { icon: verifyIMEISvg, label: "VerifyIMEI", disabled: false },
          {
            icon: declareDevicesSvg,
            label: "DeclareDevices",
            disabled: false,
            children: [
              {
                label: "DeclareDevices",
                translationKey: "Active",
                disabled: false,
              },
              {
                label: "RegisteredDevices",
                translationKey: "RegisteredDevices",
                disabled: false,
              },
            ],
          },
          {
            icon: registerDevicesSvg,
            label: "RegisterDevices",
            disabled: false,
          },
          { icon: digitalWalletSvg, label: "DigitalWallet", disabled: true },
          { icon: reportsSvg, label: "Reports", disabled: true },
          { icon: helpSvg, label: "Help", disabled: false },
        ];

  const footerTabs = [
    ...(accountType !== ROLE_ADMIN
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
      } else if (tab.children?.length) {
        // Selecting a parent defaults to its first sub-item.
        navigate(basePath + tab.children[0].label);
      } else {
        navigate(basePath + tab.label);
      }
    }
  };

  const isTabActive = (tab) => {
    if (tab.function) {
      return false;
    }

    const tabPath = `${basePath}${tab.label}`;
    return (
      location.pathname === tabPath ||
      location.pathname.startsWith(`${tabPath}/`)
    );
  };

  // Length of the matched prefix for a tab path, or -1 when it does not match.
  const matchLength = (label) => {
    const tabPath = `${basePath}${label}`;
    return location.pathname === tabPath ||
      location.pathname.startsWith(`${tabPath}/`)
      ? tabPath.length
      : -1;
  };

  // Among a set of children, the active one is the longest matching path so
  // that e.g. "Declaration/Archived" wins over "Declaration".
  const activeChild = (children) =>
    children.reduce(
      (best, child) => {
        const len = matchLength(child.label);
        return len > best.len ? { child, len } : best;
      },
      { child: null, len: -1 }
    ).child;

  const isChildActive = (children, child) => activeChild(children) === child;

  return (
    <SidebarContainer>
      <Header $closed={closed}>
        <LogoSection $closed={closed}>
          <LogoImage src={logoWhite} alt="Logo" />
        </LogoSection>
        <CloseSidebar
          src={closeSidebarSvg}
          alt="Close"
          onClick={() => setClosed(!closed)}
          $rotate={closed ? 180 : 0}
        />
      </Header>

      <Divider />

      <MainTabs>
        {mainTabs.map((tab, index) =>
          tab.children ? (
            <React.Fragment key={index}>
              <Tab
                $disabled={tab.disabled}
                $active={Boolean(activeChild(tab.children))}
                onClick={() => handleTabClick(tab)}
              >
                <TabIcon src={tab.icon} alt={tab.label} />
                <TabText $closed={closed}>
                  {t("Sidebar_" + (tab.translationKey || tab.label))}
                </TabText>
              </Tab>
              {!closed && (
                <SubTabs>
                  {tab.children.map((child, childIndex) => (
                    <SubTab
                      key={childIndex}
                      $disabled={child.disabled}
                      $active={isChildActive(tab.children, child)}
                      onClick={() => handleTabClick(child)}
                    >
                      <SubTabText $active={isChildActive(tab.children, child)}>
                        {t("Sidebar_" + (child.translationKey || child.label))}
                      </SubTabText>
                    </SubTab>
                  ))}
                </SubTabs>
              )}
            </React.Fragment>
          ) : (
            <Tab
              key={index}
              $disabled={tab.disabled}
              $active={isTabActive(tab)}
              onClick={() => handleTabClick(tab)}
            >
              <TabIcon src={tab.icon} alt={tab.label} />
              <TabText $closed={closed}>
                {t("Sidebar_" + (tab.translationKey || tab.label))}
              </TabText>
            </Tab>
          )
        )}
      </MainTabs>

      <Divider />

      <Footer>
        {footerTabs.map((tab, index) => (
          <Tab
            key={index}
            $disabled={tab.disabled}
            $active={isTabActive(tab)}
            onClick={() => handleTabClick(tab)}
          >
            <TabIcon src={tab.icon} alt={tab.label} />
            <TabText $closed={closed}>{t("Sidebar_" + tab.label)}</TabText>
          </Tab>
        ))}
      </Footer>
    </SidebarContainer>
  );
};

export default Sidebar;

const SidebarContainer = styled.div`
  background-color: #1d2025;
  height: 100vh;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  padding: 20px;
  box-sizing: border-box;
  position: sticky;
  top: 0;
  align-self: flex-start;

  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: ${({ $closed }) => ($closed ? "center" : "space-between")};
  align-items: center;
  gap: 20px;
`;

const LogoSection = styled.div`
  display: ${({ $closed }) => ($closed ? "none" : "flex")};
  align-items: center;
`;

const LogoImage = styled.img`
  height: 25px;
`;

const CloseSidebar = styled.img`
  cursor: pointer;
  height: 20px;

  transform: rotate(${(props) => props.$rotate}deg);
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
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  border-radius: 10px;
  transition: background-color 0.2s, box-shadow 0.2s;
  opacity: ${({ $disabled }) => ($disabled ? 0.3 : 1)};
  background-color: ${({ $active }) =>
    $active ? "rgba(144, 152, 160, 0.28)" : "transparent"};
  box-shadow: ${({ $active }) =>
    $active ? "inset 0 0 0 1px rgba(255, 255, 255, 0.08)" : "none"};

  &:hover {
    background-color: ${({ $disabled, $active }) =>
      $disabled
        ? "inherit"
        : $active
          ? "rgba(144, 152, 160, 0.34)"
          : "rgba(144, 152, 160, 0.2)"};
  }
`;

const TabIcon = styled.img`
  height: 18px;
`;

const SubTabs = styled.div`
  display: flex;
  flex-direction: column;
  margin: 2px 0 2px 22px;
  padding-left: 14px;
  border-left: 1px solid rgba(144, 152, 160, 0.3);
`;

const SubTab = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 10px;
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  border-radius: 10px;
  opacity: ${({ $disabled }) => ($disabled ? 0.3 : 1)};
`;

const SubTabText = styled.p`
  font-size: 12px;
  color: ${({ $active }) => ($active ? "white" : "#9098a0")};
  font-weight: ${({ $active }) => ($active ? 600 : 400)};

  &:hover {
    color: white;
  }
`;

const TabText = styled.p`
  color: white;
  font-size: 12px;

  display: ${({ $closed }) => ($closed ? "none" : "flex")};
`;
