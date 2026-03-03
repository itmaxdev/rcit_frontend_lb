// src/pages/SignupPage.js
import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Context } from "../Context";
import InputField from "../sharedComponents/InputField";
import DocumentUpload from "../sharedComponents/DocumentUpload";

import logoSvg from "../assets/logo.svg";
import globeSvg from "../assets/globe.svg";
import chevron from "../assets/chevron-down.svg";

const SignupPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isLoggedIn, accountState, triggerSignUp } = useContext(Context);
  const [accountType, setAccountType] = useState("ROLE_USER");
  const [isSignupDisabled, setIsSignupDisabled] = useState(true);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    nationalIDNumber: "",
    niuNumber: "",
    documentIDDocument: null,
    companyName: "",
    companyRegistrationNumber: "",
    companyOwnerName: "",
    companyOwnerNationalIDNumber: "",
    companyAddress: "",
    documentCompanyRegistrationDocument: null,
    documentCompanyOwnerNationalID: null,
  });

  const handleChange = (field) => (value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNumericChange = (field) => (value) => {
    const numericValue = value === "" ? 0 : parseInt(value, 10);
    setFormData((prev) => ({
      ...prev,
      [field]: numericValue,
    }));
  };

  useEffect(() => {
    if (isLoggedIn) {
      if (accountState === "Enabled") {
        navigate("/profile");
      } else {
        if (accountType === "ROLE_USER") {
          navigate("/otp");
        } else {
          navigate("/status");
        }
      }
    }
  }, [isLoggedIn, accountState, accountType, navigate]);

  useEffect(() => {
    const isIndividualValid =
      accountType === "ROLE_USER" &&
      formData.firstName &&
      formData.lastName &&
      formData.phoneNumber &&
      formData.email &&
      formData.password &&
      formData.confirmPassword &&
      formData.nationalIDNumber &&
      formData.documentIDDocument;

    const isImporterValid =
      accountType === "ROLE_IMPORTER" &&
      formData.firstName &&
      formData.lastName &&
      formData.phoneNumber &&
      formData.password &&
      formData.confirmPassword &&
      formData.email &&
      formData.nationalIDNumber &&
      formData.companyName &&
      formData.companyRegistrationNumber &&
      formData.companyOwnerName &&
      formData.companyOwnerNationalIDNumber &&
      formData.companyAddress &&
      formData.documentCompanyRegistrationDocument &&
      formData.documentCompanyOwnerNationalID;

    setIsSignupDisabled(!(isIndividualValid || isImporterValid));
  }, [accountType, formData]);

  if (isLoggedIn) {
    return null;
  }

  return (
    <SignupPageContainer>
      <MainContainer>
        <Header>
          <Link to="/">
            <BackButton>
              <Chevron src={chevron} alt="Chevron" />
              {t("LoginPage_Back")}
            </BackButton>
          </Link>
          <LogoSection>
            <LogoImage src={logoSvg} alt="Logo" />
            <LogoText>RCIT</LogoText>
          </LogoSection>
          <LanguageButton
            onClick={() =>
              i18n.changeLanguage(i18n.resolvedLanguage === "en" ? "fr" : "en")
            }
          >
            <img src={globeSvg} alt="Language" />
            {i18n.resolvedLanguage === "en" ? "EN" : "FR"}
          </LanguageButton>
        </Header>

        <Title>{t("SignupPage_Title")}</Title>
        <Subtext>{t("SignupPage_SubTitle")}</Subtext>
        <ChoiceContainer>
          <Button
            selected={accountType === "ROLE_USER"}
            onClick={() => setAccountType("ROLE_USER")}
          >
            {t("SignupPage_Individual")}
          </Button>
          <Button
            selected={accountType === "ROLE_IMPORTER"}
            onClick={() => setAccountType("ROLE_IMPORTER")}
          >
            {t("SignupPage_Importer")}
          </Button>
        </ChoiceContainer>
        <Subheader>{t("SignupPage_Personal")}</Subheader>
        <InputRow>
          <InputField
            fieldName="Input_FirstName"
            changeValue={handleChange("firstName")}
            validation={(value) => /^[\p{L} ]+$/u.test(value)}
            errorMessage={t("Error_Name")}
          />
          <InputField
            fieldName="Input_LastName"
            changeValue={handleChange("lastName")}
            validation={(value) => /^[\p{L} ]+$/u.test(value)}
            errorMessage={t("Error_Name")}
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
          />
        </InputRow>
        <InputRow>
          <InputField
            fieldName="Input_Password"
            isPassword
            validation={(value) =>
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
                value
              )
            }
            changeValue={handleChange("password")}
            errorMessage={t("Error_Password")}
          />
          <InputField
            fieldName="Input_ConfirmPassword"
            isPassword
            validation={(value) => value === formData.password}
            changeValue={handleChange("confirmPassword")}
            errorMessage={t("Error_Confirm")}
          />
        </InputRow>

        <IndividualSection selected={accountType === "ROLE_USER"}>
          <Subheader>{t("SignupPage_Additional")}</Subheader>
          <InputRow>
            <InputField
              fieldName="Input_NationalIDNumber"
              changeValue={handleChange("nationalIDNumber")}
              validation={(value) => /^\d+$/.test(value)}
              errorMessage={t("Error_Number")}
            />
            <InputField
              fieldName="Input_NIUNumber"
              optional
              changeValue={handleChange("niuNumber")}
              validation={(value) => /^\d+$/.test(value)}
              errorMessage={t("Error_Number")}
            />
          </InputRow>
          <InputRow style={{ width: "50%" }}>
            <DocumentUpload
              fieldName={"Document_IDDocument"}
              changeDocument={handleChange("documentIDDocument")}
            />
          </InputRow>
        </IndividualSection>

        <ImporterSection selected={accountType === "ROLE_IMPORTER"}>
          <Subheader>{t("SignupPage_Company")}</Subheader>
          <InputRow>
            <InputField
              fieldName="Input_NationalIDNumber"
              changeValue={handleChange("nationalIDNumber")}
              validation={(value) => /^\d+$/.test(value)}
              errorMessage={t("Error_Number")}
            />
            <InputField
              fieldName="Input_CompanyName"
              changeValue={handleChange("companyName")}
            />
          </InputRow>
          <InputRow>
            <InputField
              fieldName="Input_CompanyRegistrationNumber"
              validation={(value) => /^\d+$/.test(value)}
              changeValue={handleNumericChange("companyRegistrationNumber")}
              errorMessage={t("Error_Number")}
            />
            <InputField
              fieldName="Input_CompanyOwnerName"
              changeValue={handleChange("companyOwnerName")}
              validation={(value) => /^[\p{L} ]+$/u.test(value)}
              errorMessage={t("Error_Name")}
            />
          </InputRow>
          <InputRow>
            <InputField
              fieldName="Input_CompanyOwnerNationalIDNumber"
              validation={(value) => /^\d+$/.test(value)}
              changeValue={handleNumericChange("companyOwnerNationalIDNumber")}
              errorMessage={t("Error_Number")}
            />
            <InputField
              fieldName="Input_CompanyAddress"
              changeValue={handleChange("companyAddress")}
            />
          </InputRow>
          <InputRow>
            <DocumentUpload
              fieldName={"Document_CompanyRegistrationDocument"}
              changeDocument={handleChange(
                "documentCompanyRegistrationDocument"
              )}
            />
            <DocumentUpload
              fieldName={"Document_CompanyOwnerNationalID"}
              changeDocument={handleChange("documentCompanyOwnerNationalID")}
            />
          </InputRow>
        </ImporterSection>
      </MainContainer>

      <Footer>
        <FooterContent>
          <SignupButton
            disabled={isSignupDisabled}
            onClick={() => triggerSignUp(formData, accountType)}
          >
            {t("SignupPage_Create")}
          </SignupButton>

          <LoginContainer>
            {t("SignupPage_Footer")}
            <Link to="/login">
              <Login>{t("Login")}</Login>
            </Link>
          </LoginContainer>
        </FooterContent>
      </Footer>
    </SignupPageContainer>
  );
};

export default SignupPage;

const SignupPageContainer = styled.div`
  background-color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
`;

const MainContainer = styled.div`
  width: 70%;
  overflow-y: auto;
  padding-bottom: 100px;

  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin: 30px 0;
`;

const BackButton = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
`;

const Chevron = styled.img`
  width: 14px;
  margin-top: 2px;
  transform: rotate(90deg);
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
`;

const LogoImage = styled.img`
  height: 22px;
`;

const LogoText = styled.h1`
  margin-left: 5px;
  font-family: "Michroma", serif;
  font-size: 24px;
`;

const LanguageButton = styled.div`
  cursor: pointer;
  display: flex;
  padding: 6px 10px 6px 6px;
  gap: 6px;
  border-radius: 40px;
  background: #f5f6fa;
`;

const Title = styled.h1`
  font-size: 40px;
  font-weight: 800;
  color: #23863A;
  margin-bottom: 10px;
`;

const Subtext = styled.p`
  font-size: 16px;
  margin-bottom: 30px;
`;

const ChoiceContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Button = styled.button`
  cursor: pointer;
  display: flex;
  padding: 15px 50px;
  justify-content: center;
  align-items: center;
  border-radius: 40px;
  background: white;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 500;
  background: #f5f6fa;

  border: ${({ selected }) =>
    selected ? "1px solid #23863A" : "1px solid #f5f6fa"};
  color: ${({ selected }) => (selected ? "#23863A" : "#20294C")};
  transition: all 0.3s ease;

  &:hover {
    opacity: 0.8;
  }
`;

const Subheader = styled.div`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 10px;
`;

const IndividualSection = styled.div`
  display: ${({ selected }) => (selected ? "block" : "none")};
`;

const ImporterSection = styled.div`
  display: ${({ selected }) => (selected ? "block" : "none")};
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

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
  background: #f5f6fa;
  width: 100%;
  position: fixed;
  bottom: 0;
`;

const FooterContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 70%;
  font-size: 16px;
  font-weight: 500;
`;

const SignupButton = styled.button`
  padding: 15px 50px;
  border-radius: 38px;
  background: ${({ disabled }) => (disabled ? "#ccc" : "#23863A")};
  color: white;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  transition: opacity 0.3s ease, background 0.3s ease;
  margin-right: 10px;

  &:hover {
    opacity: ${({ disabled }) => (disabled ? "1" : "0.7")};
  }
`;

const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 500;
`;

const Login = styled.div`
  color: #23863A;
  cursor: pointer;
  font-weight: 700;
  text-decoration-line: underline;
`;
