// src/homepageComponents/IMEICheck.js
import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

import img from "../assets/IMEICheck.svg";

const IMEICheck = () => {
  const { t } = useTranslation();

  return (
    <IMEICheckContainer>
      <TextSection>
        <Header>{t("IMEICheck_Header")}</Header>
        <Subsection>
          <Circle>1</Circle>
          <SubText
            dangerouslySetInnerHTML={{ __html: t("IMEICheck_Subtext1") }}
          />
        </Subsection>
        <Subsection>
          <Circle>2</Circle>
          <SubText
            dangerouslySetInnerHTML={{ __html: t("IMEICheck_Subtext2") }}
          />
        </Subsection>
        <Subsection>
          <Circle>3</Circle>
          <SubText
            dangerouslySetInnerHTML={{ __html: t("IMEICheck_Subtext3") }}
          />
        </Subsection>
      </TextSection>
      <Image src={img} alt="Image" />
    </IMEICheckContainer>
  );
};

export default IMEICheck;

const IMEICheckContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 0;
  background-color: white;
  gap: 30px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
  }
`;

const TextSection = styled.div`
  display: flex;
  min-width: 300px;
  flex-direction: column;
  justify-content: start;
  gap: 20px;
  max-width: 40%;

  @media (max-width: 768px) {
    max-width: 90%;
  }
`;

const Header = styled.h1`
  color: #436C4D;
  font-weight: 800;
  font-size: 40px;
  margin-bottom: 10px;

  @media (max-width: 768px) {
    font-size: 35px;
  }
`;

const Subsection = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  background-color: #f5f5f5;
  border-radius: 15px;
  padding: 15px;
  font-size: 16px;
`;

const Circle = styled.div`
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  background-color: #436C4D;
  color: white;
  font-size: 18px;
  font-weight: 700;
  border-radius: 50%;
  width: 25px;
  height: 25px;
`;

const SubText = styled.p`
  margin: 0;
`;

const Image = styled.img`
  height: 350px;
`;
