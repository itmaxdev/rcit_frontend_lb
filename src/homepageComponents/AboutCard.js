// src/homepageComponents/AboutCard.js
import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

import img from "../assets/aboutcard.png";

const AboutCard = () => {
  const { t } = useTranslation();

  return (
    <AboutCardContainer>
      <TextSection>
        <Header>{t("AboutCard_Header")}</Header>
        <SubText>{t("AboutCard_Summary")}</SubText>
        <SubHeader
          style={{ color: "#436C4D", fontWeight: 800, marginTop: "10px" }}
        >
          {t("AboutCard_DeclareNow")}
        </SubHeader>
        {[1, 2, 3].map((sectionNumber) => (
          <Subsection key={sectionNumber}>
            <SubHeader>
              {sectionNumber}. {t(`AboutCard_SubHeader${sectionNumber}`)}
            </SubHeader>
            <SubText style={{ "padding-left": "16px" }}>
              {t(`AboutCard_SubText${sectionNumber}`)}
            </SubText>
          </Subsection>
        ))}
      </TextSection>
      <ImageSection src={img} alt="About" />
    </AboutCardContainer>
  );
};

export default AboutCard;

const AboutCardContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f6fa;
  gap: 50px;
  padding-top: 50px;
  overflow: hidden;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
  }
`;

const ImageSection = styled.img`
  height: 500px;
  margin-top: 50px;

  @media (max-width: 768px) {
    margin-bottom: -70px;
  }
`;

const TextSection = styled.div`
  display: flex;
  min-width: 300px;
  flex-direction: column;
  justify-content: start;
  gap: 15px;
  max-width: 30%;

  @media (max-width: 768px) {
    max-width: 90%;
  }
`;

const Header = styled.h1`
  color: #436C4D;
  font-weight: 800;
  font-size: 40px;
`;

const SubHeader = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SubText = styled.p`
  font-size: 14px;
  margin-top: 10px;
  padding-right: 10px;
`;

const Subsection = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 16px;
`;
