// src/homepageComponents/DeclareFooter.js
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Context } from "../Context";

import arrowSvg from "../assets/arrow-long-right-blue.svg";

const DeclareFooter = () => {
  const { t } = useTranslation();
  const { isLoggedIn, accountType } = useContext(Context);

  return (
    <DeclareFooterContainer>
      <Header>{t("DeclareFooter")}</Header>
      <ButtonsContainer>
        <Link to="/login">
          <LoginButton isLoggedIn={isLoggedIn}>{t("Login")}</LoginButton>
        </Link>
        <Link to={isLoggedIn ? `/profile/${accountType}/DeclareDevices` : "/signup"}>
          <DeclareButton>
            {t("Header_DeclareNow")}
            <img src={arrowSvg} alt="Arrow" />
          </DeclareButton>
        </Link>
      </ButtonsContainer>
    </DeclareFooterContainer>
  );
};

export default DeclareFooter;

const DeclareFooterContainer = styled.div`
  display: flex;
  padding: 60px 100px;
  justify-content: space-between;
  align-items: center;
  background-color: #436C4D;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 30px 20px;
    gap: 20px;
  }
`;

const Header = styled.h1`
  font-size: 35px;
  font-weight: 700;
  color: #fff;

  @media (max-width: 768px) {
    font-size: 30px;
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 20px;
  align-items: end;

  @media (max-width: 1100px) and (min-width: 769px) {
    flex-direction: column;
  }
`;

const LoginButton = styled.button`
  cursor: pointer;
  display: ${(props) => (props.isLoggedIn ? "none" : "flex")};
  padding: 16px 28px;
  justify-content: center;
  align-items: center;
  border-radius: 24px;
  border: 1px solid #fff;
  color: #fff;
  background: transparent;
  white-space: nowrap;
  font-size: 14px;

  @media (max-width: 768px) {
    padding: 16px 60px;
  }
`;

const DeclareButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 12px 18px 12px 28px;
  gap: 6px;
  color: #436C4D;
  border-radius: 38px;
  border: 1px solid #fff;
  background: #fff;
  white-space: nowrap;
  font-size: 14px;
`;
