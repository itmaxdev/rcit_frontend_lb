// src/homepageComponents/IMEIVerify.js
import React, { useState, useRef } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import DeviceInfo from "./DeviceInfo";
import { validateIMEI } from "../functions/validateIMEI";

import search from "../assets/search.svg";
import search2 from "../assets/search2.svg";
import details from "../assets/details.svg";

const IMEIVerify = () => {
  const { t } = useTranslation();
  const containerRef = useRef(null);

  const [inputText, setInputText] = useState("");
  const [isTextPresent, setIsTextPresent] = useState(false);
  const [isInputValid, setIsInputValid] = useState(true);

  const [loading, setLoading] = useState(false);
  const [device, setDevice] = useState(null);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    setIsTextPresent(e.target.value.length > 0);
    setIsInputValid(true);
  };

  const handleVerifyClick = async () => {
    const isValid = /^\d{15}$/.test(inputText);
    setIsInputValid(isValid);

    if (isValid) {
      setLoading(true);

      try {
        const phoneData = await validateIMEI(inputText);
        setDevice(phoneData);

        if (containerRef.current) {
          containerRef.current.scrollIntoView({ behavior: "smooth" });
        }
      } catch (error) {
        console.error("Error verifying IMEI:", error);
        setDevice(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && isTextPresent) {
      handleVerifyClick();
    }
  };

  return (
    <IMEIVerifyContainer ref={containerRef}>
      <SearchSVG src={search} alt="Search SVG" />

      <Header>{t("IMEIVerify_Header")}</Header>
      <Subtext>{t("IMEIVerify_Subtext")}</Subtext>

      <InputSection isTyping={isTextPresent} isInvalid={!isInputValid}>
        <InputField
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={t("IMEIVerify_Placeholder")}
        />
        <VerifyButton isTextPresent={isTextPresent} onClick={handleVerifyClick}>
          <VerifyButtonText>{t("IMEIVerify_Verify")}</VerifyButtonText>
          <SearchIcon src={search2} alt="Search Icon" />
        </VerifyButton>
      </InputSection>

      {!isInputValid && <ErrorText>{t("IMEIVerify_Error")}</ErrorText>}
      {loading && <LoadingText>{t("IMEIVerify_Loading")}</LoadingText>}

      {device && <DeviceInfo device={device} />}

      {!device && <DetailSVG src={details} alt="Detail SVG" />}
    </IMEIVerifyContainer>
  );
};

export default IMEIVerify;

const IMEIVerifyContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: radial-gradient(
      100.14% 160.15% at 55.3% 181.34%,
      rgba(22, 114, 192, 0.5) 0%,
      rgba(22, 114, 192, 0) 100%
    ),
    #fff;
  padding: 50px 20px 0;
  width: 100%;
  height: 100%;

  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const SearchSVG = styled.img`
  height: 70px;
  margin-bottom: 10px;
`;

const Header = styled.h1`
  color: #1672c0;
  font-size: 40px;
  font-weight: 800;
  margin-bottom: 10px;
`;

const Subtext = styled.p`
  font-size: 14px;
  margin-bottom: 20px;
`;

const InputSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 700px;
  background: #fff;
  padding: 10px 10px 10px 15px;
  border-radius: 16px;
  box-shadow: 0px 0px 50px 0px rgba(32, 41, 76, 0.12);
  transition: border-color 0.3s;
  border: 2px solid
    ${(props) =>
      props.isInvalid ? "#EC011A" : props.isTyping ? "#1672C0" : "#fff"};

  @media (max-width: 768px) {
    padding: 5px 10px;
  }
`;

const InputField = styled.input`
  font-size: 22px;
  flex-grow: 1;
  border: none;
  outline: none;
  color: #000;
  cursor: text;
  caret-color: #1672c0;

  &::placeholder {
    opacity: 0.2;
  }
`;

const VerifyButton = styled.button`
  background-color: ${(props) => (props.isTextPresent ? "#1672C0" : "#D4D6DF")};
  color: ${(props) => (props.isTextPresent ? "#FFFFFF" : "#FFF")};
  border: none;
  padding: 10px 20px;
  border-radius: 56px;
  font-size: 16px;
  cursor: ${(props) => (props.isTextPresent ? "pointer" : "not-allowed")};
  transition: background-color 0.3s;

  &:hover {
    background-color: ${(props) =>
      props.isTextPresent ? "#135F99" : "#D4D6DF"};
  }

  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const SearchIcon = styled.img`
  display: none;

  @media (max-width: 768px) {
    display: block;
    height: 20px;
  }
`;

const VerifyButtonText = styled.span`
  @media (max-width: 768px) {
    display: none;
  }
`;

const ErrorText = styled.p`
  font-size: 12px;
  color: #ec011a;
  margin-top: 5px;
  margin-left: 15px;
  width: 100%;
  max-width: 700px;
  margin-bottom: -20px;
`;

const LoadingText = styled.p`
  font-size: 12px;
  margin-top: 5px;
  margin-left: 15px;
  width: 100%;
  max-width: 700px;
  margin-bottom: -20px;
`;

const DetailSVG = styled.img`
  width: 500px;
  margin-top: auto;
  padding-top: 30px;
`;
