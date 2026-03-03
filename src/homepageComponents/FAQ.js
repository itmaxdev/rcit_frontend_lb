// src/homepageComponents/FAQ.js
import React, { useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

import question from "../assets/question.svg";
import chevron from "../assets/chevron-down.svg";

const FAQ = () => {
  const { t } = useTranslation();
  const [expandedSection, setExpandedSection] = useState(1);

  const handleToggle = (sectionNumber) => {
    setExpandedSection(
      expandedSection === sectionNumber ? null : sectionNumber
    );
  };

  return (
    <FAQContainer>
      <HeaderSection>
        <SVG src={question} alt="question" />
        <Header>{t("FAQ_Header")}</Header>
      </HeaderSection>
      <TextSection>
        {[1, 2, 3, 4, 5].map((sectionNumber) => (
          <Subsection
            key={sectionNumber}
            onClick={() => handleToggle(sectionNumber)}
          >
            <SubHeader>
              {t(`FAQ_SubHeader${sectionNumber}`)}
              <Chevron
                src={chevron}
                alt="Chevron"
                rotate={expandedSection === sectionNumber ? 180 : 0}
              />
            </SubHeader>
            <SubText expanded={expandedSection === sectionNumber}>
              {t(`FAQ_SubText${sectionNumber}`)}
            </SubText>
          </Subsection>
        ))}
      </TextSection>
    </FAQContainer>
  );
};

export default FAQ;

const FAQContainer = styled.div`
  display: flex;
  align-items: start;
  justify-content: center;
  background-color: #f5f6fa;
  padding: 80px 0;
  gap: 25px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    gap: 35px;
    padding: 60px 0;
  }
`;

const HeaderSection = styled.div`
  max-width: 25%;

  @media (max-width: 768px) {
    max-width: 90%;
    display: flex;
    align-items: center;
    gap: 20px;
  }
`;

const SVG = styled.img`
  height: 70px;
  margin-bottom: 10px;

  @media (max-width: 768px) {
    margin-bottom: 0;
  }
`;

const Header = styled.h1`
  color: #436C4D;
  font-weight: 800;
  font-size: 40px;
`;

const TextSection = styled.div`
  display: flex;
  min-width: 500px;
  flex-direction: column;
  justify-content: start;
  gap: 15px;
  max-width: 35%;

  @media (max-width: 768px) {
    max-width: 90%;
    min-width: 0;
  }
`;

const Subsection = styled.div`
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 15px;
  padding: 20px;
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
