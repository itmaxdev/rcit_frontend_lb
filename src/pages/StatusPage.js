// src/pages/StatusPage.js
import React, { useContext } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Context } from "../Context";

import logoDark from "../assets/logoDark.svg";
import globeSvg from "../assets/globe.svg";
import approvedSvg from "../assets/approved.svg";
import pendingSvg from "../assets/pending.svg";
import rejectedSVG from "../assets/rejected.svg";
import arrowSvg from "../assets/arrow-long-right.svg";

const StatusPage = () => {
  const { t, i18n } = useTranslation();

  const { accountType, accountState, setIsLoggedIn, setAccountState } =
    useContext(Context);

  const content = {
    svg:
      accountState === "Enabled"
        ? approvedSvg
        : accountState === "Pending"
        ? pendingSvg
        : rejectedSVG,

    title: t("Status_" + accountType + accountState + "_Title"),
    subtext: t("Status_" + accountType + accountState + "SubText"),
    button: t("Status_" + accountType + accountState + "_Button"),

    link:
      accountState === "Enabled"
        ? "/login"
        : accountType === "ROLE_USER" && accountState === "Pending"
        ? "/otp"
        : "/",
  };

  return (
    <StatusPageContainer>
      <TopBar>
        <LogoSection>
          <LogoImage src={logoDark} alt="Logo" />
        </LogoSection>

        <LanguageButton
          onClick={() =>
            i18n.changeLanguage(i18n.resolvedLanguage === "en" ? "fr" : "en")
          }
        >
          <img src={globeSvg} alt="Language" />
          {i18n.resolvedLanguage === "en" ? "EN" : "FR"}
        </LanguageButton>
      </TopBar>

      <MainContent>
        <SVG src={content.svg} alt="Status" />
        <Title>{content.title}</Title>
        <Subtext>{content.subtext}</Subtext>
        <Link to={content.link}>
          <Button
            onClick={() => {
              setIsLoggedIn(false);
              setAccountState("Unknown");
            }}
          >
            {content.button}
            <img src={arrowSvg} alt="Arrow" />
          </Button>
        </Link>
      </MainContent>
    </StatusPageContainer>
  );
};

export default StatusPage;

const StatusPageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100vw;
  height: 100vh;
  padding: 50px 0;
`;

const TopBar = styled.div`
  display: flex;
  width: 80%;
  justify-content: space-between;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
`;

const LogoImage = styled.img`
  height: 28px;
`;

const LogoText = styled.h1`
  margin-left: 5px;
  font-family: "Michroma", serif;
  font-size: 24px;

  @media (max-width: 1100px) and (min-width: 769px) {
    font-size: 22px;
  }
`;

const LanguageButton = styled.div`
  cursor: pointer;
  display: flex;
  padding: 6px 10px 6px 6px;
  gap: 6px;
  border-radius: 40px;
  background: #f5f6fa;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const SVG = styled.img`
  height: 200px;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 35px;
  font-weight: 700;
  color: #436C4D;
  margin-bottom: 10px;
`;

const Subtext = styled.p`
  font-size: 16px;
  margin-bottom: 40px;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  padding: 11px 18px 11px 28px;
  gap: 6px;
  color: #fff;
  border-radius: 38px;
  border: 1px solid #436C4D;
  background: #436C4D;
  white-space: nowrap;
  font-size: 14px;

  @media (max-width: 1100px) and (min-width: 769px) {
    padding: 9px 15px;
    font-size: 12px;
  }
`;
