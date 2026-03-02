// src/homepageComponents/TitleCard.js
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Context } from "../Context";

import arrowSvg from "../assets/arrow-long-right-blue.svg";
import dimg1 from "../assets/Dekstop 1.png";
import dimg2 from "../assets/Dekstop 2.png";
import dimg3 from "../assets/Dekstop 3.png";
import mimg1 from "../assets/Mobile 1.png";
import mimg2 from "../assets/Mobile 2.png";
import mimg3 from "../assets/Mobile 3.png";

const TitleCard = ({ scrollToSection, refs }) => {
  const { t } = useTranslation();
  const { isLoggedIn, accountType } = useContext(Context);

  return (
    <TitleCardContainer>
      <ContentWrapper>
        <TextContainer>
          <Header>{t("TitleCard_Header")}</Header>
          <Subtext>{t("TitleCard_Subtext")}</Subtext>
          <ButtonRow>
            <VerifyIMEIButton onClick={() => scrollToSection(refs)}>
              {t("TitleCard_VerifyIMEI")}
            </VerifyIMEIButton>
            <Link to={isLoggedIn ? `/profile/${accountType}/DeclareDevices` : "/signup"}>
              <DeclareButton>
                {t("Header_DeclareNow")}
                <img src={arrowSvg} alt="Arrow" />
              </DeclareButton>
            </Link>
          </ButtonRow>
        </TextContainer>
        <DImages src={dimg1} alt="dimg 1" />
        <DImages src={dimg2} alt="dimg 2" />
        <DImages src={dimg3} alt="dimg 3" />
        <MImages src={mimg1} alt="dimg 1" />
        <MImages src={mimg2} alt="dimg 2" />
        <MImages src={mimg3} alt="dimg 3" />
      </ContentWrapper>
    </TitleCardContainer>
  );
};

export default TitleCard;

const TitleCardContainer = styled.div`
  width: 100%;
  height: 450px;
  background-color: #1672c0;
  overflow: hidden;

  @media (max-width: 768px) {
    height: 700px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  max-width: 1000px;
  position: relative;
  padding: 0px 50px;
  margin: 0 auto;

  @media (max-width: 768px) {
    max-width: 460px;
    flex-direction: column;
    justify-content: flex-end;
  }
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 400px;
  z-index: 2;

  @media (max-width: 768px) {
    align-items: center;
    text-align: start;
    margin-bottom: 50px;
  }
`;

const Header = styled.h1`
  font-size: 50px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    font-size: 40px;
  }
`;

const Subtext = styled.p`
  font-size: 20px;
  font-weight: 400;
  color: #fff;
  margin-bottom: 30px;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 20px;

  @media (max-width: 768px) {
    gap: 10px;
  }
`;

const VerifyIMEIButton = styled.button`
  cursor: pointer;
  display: flex;
  padding: 16px 28px;
  justify-content: center;
  align-items: center;
  border-radius: 24px;
  border: 1px solid #fff;
  color: #fff;
  background: transparent;
  font-size: 14px;

  @media (max-width: 1100px) and (min-width: 769px) {
    padding: 12px 20px;
  }

  @media (max-width: 768px) {
    font-size: 14px;
    padding: 10px 16px;
  }
`;

const DeclareButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 12px 18px 12px 28px;
  gap: 6px;
  color: #1672c0;
  border-radius: 38px;
  border: 1px solid #fff;
  background: #fff;
  font-size: 14px;

  @media (max-width: 1100px) and (min-width: 769px) {
    padding: 10px 15px;
  }

  @media (max-width: 768px) {
    font-size: 14px;
    padding: 10px 16px;
  }
`;

const DImages = styled.img`
  position: absolute;
  z-index: 1;

  &:nth-child(2) {
    top: -80px;
    right: 250px;
    width: 260px;

    @media (max-width: 1100px) and (min-width: 769px) {
      right: 230px;
    }

    @media (max-width: 768px) {
      display: none;
    }
  }

  &:nth-child(3) {
    bottom: -100px;
    right: 150px;
    width: 350px;

    @media (max-width: 768px) {
      display: none;
    }
  }

  &:nth-child(4) {
    bottom: 10px;
    right: -90px;
    width: 270px;

    @media (max-width: 1100px) and (min-width: 769px) {
      right: -70px;
    }

    @media (max-width: 768px) {
      display: none;
    }
  }
`;

const MImages = styled.img`
  position: absolute;
  z-index: 1;

  &:nth-child(5) {
    top: -30px;
    left: -20px;
    width: 220px;

    @media (min-width: 769px) {
      display: none;
    }
  }

  &:nth-child(6) {
    top: 70px;
    left: 85px;
    width: 230px;

    @media (min-width: 769px) {
      display: none;
    }
  }

  &:nth-child(7) {
    top: 70px;
    right: -20px;
    width: 220px;

    @media (min-width: 769px) {
      display: none;
    }
  }
`;
