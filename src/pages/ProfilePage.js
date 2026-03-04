// src/pages/ProfilePage.js
import React, { useEffect, useContext } from "react";
import styled from "styled-components";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Context } from "../Context";

import Sidebar from "../profilepageComponents/Sidebar";
import Header from "../profilepageComponents/Header";
import DeclareDevicesInd from "../profilepageComponents/individuals/DeclareDevicesInd";
import DeclareDevicesImp from "../profilepageComponents/importers/DeclareDevicesImp";
import UserManagement from "../profilepageComponents/admins/UserManagement";
import UserDetails from "../profilepageComponents/admins/UserDetails";
import IMEIVerify from "../homepageComponents/IMEIVerify";
import RegisteredDevices from "../profilepageComponents/RegisteredDevices";
import Profile from "../profilepageComponents/Profile";
import SupportCard from "../homepageComponents/SupportCard";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { isLoggedIn, accountType, accountState } = useContext(Context);

  useEffect(() => {
    if (!isLoggedIn && accountState !== "Enabled") {
      navigate("/login");
    }
  }, [isLoggedIn, accountState, navigate]);

  if (!isLoggedIn) {
    return null;
  }

  const basePath = `/profile/${accountType.toLowerCase()}/`;

  return (
    <ProfilePageContainer>
      <Sidebar basePath={basePath} />
      <MainContent>
        <Header />
        <Routes>
          <Route path="/" element={<Navigate to={basePath} />} />

          {accountType === "ROLE_USER" && (
            <Route path="role_user/*">
              <Route path="" element={<Navigate to="DeclareDevices" />} />
              <Route
                path="Dashboard"
                element={<Placeholder title="Dashboard" />}
              />
              <Route path="VerifyIMEI" element={<IMEIVerify />} />
              <Route path="DeclareDevices" element={<RegisteredDevices />} />
              <Route path="RegisterDevices" element={<DeclareDevicesInd />} />
              <Route
                path="DigitalWallet"
                element={<Placeholder title="Digital Wallet" />}
              />
              <Route path="Reports" element={<Placeholder title="Reports" />} />
              <Route path="Help" element={<SupportCard />} />
              <Route path="Profile" element={<Profile />} />
            </Route>
          )}

          {accountType === "ROLE_IMPORTER" && (
            <Route path="role_importer/*">
              <Route path="" element={<Navigate to="DeclareDevices" />} />
              <Route
                path="Dashboard"
                element={<Placeholder title="Dashboard" />}
              />
              <Route path="VerifyIMEI" element={<IMEIVerify />} />
              <Route path="DeclareDevices" element={<RegisteredDevices />} />
              <Route path="RegisterDevices" element={<DeclareDevicesImp />} />
              <Route
                path="DigitalWallet"
                element={<Placeholder title="Digital Wallet" />}
              />
              <Route path="Reports" element={<Placeholder title="Reports" />} />
              <Route path="Help" element={<SupportCard />} />
              <Route path="Profile" element={<Profile />} />
            </Route>
          )}

          {accountType === "ROLE_ADMIN" && (
            <Route path="role_admin/*">
              <Route path="" element={<Navigate to="RegisteredDevices" />} />
              <Route
                path="Dashboard"
                element={<Placeholder title="Dashboard" />}
              />
              <Route path="UserManagement" element={<UserManagement />} />
              <Route path="UserDetails/:userId" element={<UserDetails />} />
              <Route path="RegisteredDevices" element={<RegisteredDevices />} />
              <Route path="Reports" element={<Placeholder title="Reports" />} />
              <Route
                path="PermissionsAndRoles"
                element={<Placeholder title="Permissions and Roles" />}
              />
              <Route path="Help" element={<SupportCard />} />
            </Route>
          )}

          {accountType === "Unknown" && (
            <Route path="Unknown/*">
              <Route path="" element={<Placeholder title="Error" />} />
            </Route>
          )}
        </Routes>
      </MainContent>
    </ProfilePageContainer>
  );
};

const Placeholder = ({ title }) => (
  <PlaceholderContainer>
    <h2>{title} Page</h2>
    <p>Component coming soon...</p>
  </PlaceholderContainer>
);

export default ProfilePage;

const ProfilePageContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
`;

const MainContent = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  flex-direction: column;
  justify-content: start;
  align-items: center;
`;

const PlaceholderContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  color: #555;
  font-size: 1.5rem;
`;
