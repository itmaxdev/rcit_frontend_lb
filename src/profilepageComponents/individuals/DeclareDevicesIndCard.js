// src/profilepageComponents/individuals/DeclareDevicesIndCard.js
import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

import img from "../../assets/DeclareIMEI.svg";

const DeclareDevicesIndCard = () => {
  const { t } = useTranslation();

  return (
    <DeclareDevicesIndCardContainer>
      <TextSection>
        <Header>{t("DeclareDevicesIndCard_Header")}</Header>
        <Subsection>
          <Circle>1</Circle>
          <SubText
            dangerouslySetInnerHTML={{ __html: t("DeclareDevicesIndCard_Subtext1") }}
          />
        </Subsection>
        <Subsection>
          <Circle>2</Circle>
          <SubText
            dangerouslySetInnerHTML={{ __html: t("DeclareDevicesIndCard_Subtext2") }}
          />
        </Subsection>
      </TextSection>
      <Image src={img} alt="Image" />
    </DeclareDevicesIndCardContainer>
  );
};

export default DeclareDevicesIndCard;

const DeclareDevicesIndCardContainer = styled.div`
  display: flex;
  justify-content: start;
  align-items: start;
  background-color: #f7f7f7;
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;

  width: 100%;
  padding: 30px 30px 0 30px;
  margin-top: 20px;
  gap: 20px;

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
  font-weight: 700;
  font-size: 22px;
  margin-bottom: 10px;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const Subsection = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  background-color: #fff;
  border-radius: 15px;
  padding: 15px;
  font-size: 16px;
`;

const Circle = styled.div`
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  background-color: #797f94;
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
  height: 225px;
  margin: auto;
  margin-top: 20px;
`;
