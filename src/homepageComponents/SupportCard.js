// src/homepageComponents/SupportCard.js
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import InputField from "../sharedComponents/InputField";
import { sendSupportRequest } from "../functions/support";
import { useLocation } from "react-router-dom";
import { getToken, parseJwt } from "../functions/token";

import img from "../assets/contact.png";
import phone from "../assets/phone.svg";

const SupportCard = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [defaultValue, setDefaultValue] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    phoneNumber: "",
    message: "",
  });

  const isUser = location.pathname === "/" ? false : true;

  const isDisabled =
    !formData.firstName ||
    !formData.lastName ||
    !formData.phoneNumber ||
    !formData.email ||
    !formData.message;

  useEffect(() => {
    const token = getToken();

    if (isUser && token) {
      const decodedToken = parseJwt(token);
      formData.email = decodedToken.sub;
      formData.phoneNumber = decodedToken.USER_PHONE;
    }
  });

  const handleChange = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSendClick = async () => {
    await sendSupportRequest(formData, isUser);
    setDefaultValue(".");
    setDefaultValue("");
    setFormData({
      email: "",
      phoneNumber: "",
      message: "",
    });
  };

  return (
    <SupportCardContainer>
      <CardContainer>
        <Header>{t("SupportCard_Header")}</Header>
        <Subtext>{t("SupportCard_SubText")}</Subtext>
        <Number>
          <SVG src={phone} alt="Phone" />
          <a href="tel:+242123456789" style={{ textDecoration: "underline" }}>
            +242 12 34 56789
          </a>
        </Number>
      </CardContainer>
      <FormContainer>
        {!isUser && (
          <>
            <InputRow>
              <InputField
                fieldName="Input_FirstName"
                changeValue={handleChange("firstName")}
                validation={(value) => /^[\p{L} ]+$/u.test(value)}
                errorMessage={t("Error_Name")}
                defaultValue={defaultValue}
              />
              <InputField
                fieldName="Input_LastName"
                changeValue={handleChange("lastName")}
                validation={(value) => /^[\p{L} ]+$/u.test(value)}
                errorMessage={t("Error_Name")}
                defaultValue={defaultValue}
              />
            </InputRow>
            <InputRow>
              <InputField
                fieldName="Input_Email"
                validation={(value) =>
                  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)
                }
                changeValue={handleChange("email")}
                errorMessage={t("Error_Email")}
                defaultValue={defaultValue}
              />
              <InputField
                fieldName="Input_PhoneNumber"
                validation={(value) =>
                  /^\+(\d{1,3})[\s-]?\(?(\d{1,4})\)?[\s-]?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,4}$/.test(
                    value
                  )
                }
                changeValue={handleChange("phoneNumber")}
                errorMessage={t("Error_Phone")}
                defaultValue={defaultValue}
              />
            </InputRow>
          </>
        )}
        <InputField
          fieldName="Input_Message"
          changeValue={handleChange("message")}
          defaultValue={defaultValue}
        />
        <SendButton disabled={isDisabled} onClick={() => handleSendClick()}>
          {t("SupportCard_Send")}
        </SendButton>
      </FormContainer>
    </SupportCardContainer>
  );
};

export default SupportCard;

const SupportCardContainer = styled.div`
  background-color: #f5f6fa;
  display: flex;
  width: 100%;
  height: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const CardContainer = styled.div`
  background: linear-gradient(
      328deg,
      rgba(22, 114, 192, 0) 1.87%,
      rgba(22, 114, 192, 0.9) 73.32%
    ),
    linear-gradient(0deg, rgba(17, 32, 54, 0.3) 0%, rgba(17, 32, 54, 0.3) 100%),
    url(${img}) lightgray 50% / cover no-repeat;
  padding: 60px;
  display: flex;
  flex-direction: column;
  align-items: start;
  color: #fff;
  gap: 30px;
  max-width: 40%;

  @media (max-width: 768px) {
    max-width: 100%;
    padding-bottom: 150px;
  }
`;

const Header = styled.h1`
  font-size: 50px;
  font-weight: 800;
`;

const Subtext = styled.p`
  font-size: 16px;
  font-weight: 400;
`;

const Number = styled.div`
  font-size: 16px;
  font-weight: 400;
  display: flex;
  align-items: center;
  margin-top: 20px;
`;

const SVG = styled.img`
  margin-right: 10px;
  width: 18px;
`;

const FormContainer = styled.div`
  padding: 80px;
  flex: 1;

  @media (max-width: 768px) {
    padding: 50px 30px;
  }
`;

const InputRow = styled.div`
  display: flex;
  margin-bottom: 30px;
  gap: 50px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
    margin-bottom: 20px;
  }
`;

const SendButton = styled.button`
  padding: 15px 20px;
  border-radius: 38px;
  background: ${({ disabled }) => (disabled ? "#d3d3d3" : "#23863A")};
  color: white;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  transition: opacity 0.3s ease;
  margin-top: 50px;
  opacity: ${({ disabled }) => (disabled ? "0.5" : "1")};
  transition: all 0.3s ease;

  &:hover {
    opacity: ${({ disabled }) => (disabled ? "0.5" : "0.7")};
  }
`;
