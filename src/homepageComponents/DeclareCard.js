// src/homepageComponents/DeclareCard.js
import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

import img from "../assets/declarecard.png";
import recipt from "../assets/recipt.svg";
import check from "../assets/check-badge.svg";
import table from "../assets/table.svg";
import forward from "../assets/forward.svg";

const DeclareCard = () => {
  const { t } = useTranslation();

  return (
    <DeclareCardContainer>
      <HeaderContainer>
        <FeaturesHeader>{t("DeclareCard_Features")}</FeaturesHeader>
        <HeaderText style={{ fontWeight: 800 }}>
          {t("DeclareCard_HeaderBold")}
        </HeaderText>
        <HeaderText>{t("DeclareCard_Header")}</HeaderText>
      </HeaderContainer>

      <ContentContainer>
        <LeftSection>
          <Subsection>
            <SVG src={recipt} alt="Search SVG" />
            <SubHeader>{t("DeclareCard_SubHeader1")}</SubHeader>
            <Subtext>{t("DeclareCard_SubText1")}</Subtext>
          </Subsection>
          <Subsection>
            <SVG src={check} alt="Search SVG" />
            <SubHeader>{t("DeclareCard_SubHeader2")}</SubHeader>
            <Subtext>{t("DeclareCard_SubText2")}</Subtext>
          </Subsection>
        </LeftSection>
        <RightSection>
          <Subsection>
            <SVG src={table} alt="Search SVG" />
            <SubHeader>{t("DeclareCard_SubHeader3")}</SubHeader>
            <Subtext>{t("DeclareCard_SubText3")}</Subtext>
          </Subsection>
          <Subsection>
            <SVG src={forward} alt="Search SVG" />
            <SubHeader>{t("DeclareCard_SubHeader4")}</SubHeader>
            <Subtext>{t("DeclareCard_SubText4")}</Subtext>
          </Subsection>
        </RightSection>
      </ContentContainer>

      <ImageSection src={img} alt="About" />
    </DeclareCardContainer>
  );
};

export default DeclareCard;

const DeclareCardContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding-top: 50px;
  background: linear-gradient(152deg, #1e4270 -1.84%, #23863A 108%);
  color: white;
`;

const ImageSection = styled.img`
  height: 300px;
  margin-top: -20px;
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

const HeaderContainer = styled.div`
  text-align: center;
  margin-bottom: 50px;

  @media (max-width: 768px) {
    margin-bottom: 0;
  }
`;

const FeaturesHeader = styled.h1`
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 4px;
  text-transform: uppercase;
  margin-bottom: 10px;
`;

const HeaderText = styled.p`
  font-size: 35px;
  line-height: 40px;
`;

const ContentContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 400px;
  background-image: url(${img});
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  object-fit: contain;
  width: 100%;
  height: 100%;

  @media (max-width: 768px) {
    gap: 0;
    background-image: none;
  }
`;

const LeftSection = styled.div`
  text-align: start;
`;

const RightSection = styled.div`
  text-align: end;
`;

const Subsection = styled.div`
  margin: 50px 0;
`;

const SVG = styled.img`
  height: 30px;
  margin-bottom: 10px;
`;

const SubHeader = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 5px;
`;

const Subtext = styled.p`
  width: 200px;
  font-size: 16px;
  opacity: 0.7;
`;
