// src/homepageComponents/CompliantCard.js
import React, { useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

import img from "../assets/compliant.png";
import img2 from "../assets/compliant2.png";
import chevron from "../assets/chevron-down.svg";

const CompliantCard = () => {
  const { t } = useTranslation();
  const [expandedSection, setExpandedSection] = useState(1);

  const handleToggle = (sectionNumber) => {
    setExpandedSection(
      expandedSection === sectionNumber ? null : sectionNumber
    );
  };

  return (
    <CompliantCardContainer>
      <ImageSection src={img} alt="Compliant" />
      <MobileImageSection src={img2} alt="Compliant2" />
      <TextSection>
        <Header>{t("CompliantCard_Header")}</Header>

        {[1, 2, 3, 4, 5].map((sectionNumber) => (
          <Subsection
            key={sectionNumber}
            onClick={() => handleToggle(sectionNumber)}
          >
            <SubHeader>
              {t(`CompliantCard_SubHeader${sectionNumber}`)}
              <Chevron
                src={chevron}
                alt="Chevron"
                rotate={expandedSection === sectionNumber ? 180 : 0}
              />
            </SubHeader>
            <SubText expanded={expandedSection === sectionNumber}>
              {t(`CompliantCard_SubText${sectionNumber}`)}
            </SubText>
          </Subsection>
        ))}
      </TextSection>
    </CompliantCardContainer>
  );
};

export default CompliantCard;

const CompliantCardContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  padding: 80px 0;
  gap: 50px;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 60px 0;
  }
`;

const ImageSection = styled.img`
  height: 520px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileImageSection = styled.img`
  display: none;

  @media (max-width: 768px) {
    display: block;
    width: 90%;
  }
`;

const TextSection = styled.div`
  display: flex;
  min-width: 300px;
  flex-direction: column;
  justify-content: start;
  gap: 15px;
  max-width: 35%;

  @media (max-width: 768px) {
    max-width: 90%;
  }
`;

const Header = styled.h1`
  color: #23863A;
  font-weight: 800;
  font-size: 40px;
  margin-bottom: 20px;
`;

const Subsection = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  border-radius: 15px;
  padding: 15px;
  cursor: pointer;
  overflow: hidden;
`;

const SubHeader = styled.p`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Chevron = styled.img`
  transition: transform 0.3s ease;
  transform: rotate(${(props) => props.rotate}deg);
`;

const SubText = styled.p`
  font-size: 14px;
  margin-top: ${(props) => (props.expanded ? "10px" : "0")};
  padding-right: 10px;
  max-height: ${(props) => (props.expanded ? "50px" : "0")};
  overflow: ${(props) => (props.expanded ? "visible" : "hidden")};
  transition: all 0.3s ease;
`;
