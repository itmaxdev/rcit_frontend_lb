// src/pages/LoginPage.js
import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Context } from "../Context";
import { getToken } from "../functions/token";
import InputField from "../sharedComponents/InputField";

import img from "../assets/login.png";
import logoSvg from "../assets/logo.svg";
import globeSvg from "../assets/globe.svg";
import chevron from "../assets/chevron-down.svg";

const LoginPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const {
    triggerLogIn,
    isLoggedIn,
    setIsLoggedIn,
    accountState,
    setAccountState,
    setUserEmail,
    setUserPhone,
  } = useContext(Context);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const isDisabled = !username || !password;

  useEffect(() => {
    if (isLoggedIn) {
      if (accountState === "Enabled") {
        if (getToken()) {
          navigate("/profile");
        } else {
          setIsLoggedIn(false);
          setAccountState("Unknown");
        }
      } else {
        navigate("/status");
      }
    }
  }, [isLoggedIn, accountState, navigate]);

  if (isLoggedIn) {
    return null;
  }

  // Update the function handling "Forgot Password" navigation
  function handleForgotPassword() {
    if (!username) {
      global.alert2("Please input an email or phone number to use for password reset");
    } else {
      if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(username)) {
        setUserEmail(username);
      } else {
        setUserPhone(username);
      }
      navigate("/otp", { state: { isForgotPassword: true } });
    }
  }

  return (
    <LoginPageContainer>
      <CardContainer>
        <LogoSection>
          <LogoImage src={logoSvg} alt="Logo" />
          <LogoText>RCIT</LogoText>
        </LogoSection>
        <Title>{t("LoginPage_Title")}</Title>
      </CardContainer>
      <FormContainer>
        <TopRow>
          <Link to="/">
            <BackButton>
              <Chevron src={chevron} alt="Chevron" />
              {t("LoginPage_Back")}
            </BackButton>
          </Link>
          <LanguageButton
            onClick={() =>
              i18n.changeLanguage(i18n.resolvedLanguage === "en" ? "fr" : "en")
            }
          >
            <img src={globeSvg} alt="Language" />
            {i18n.resolvedLanguage === "en" ? "EN" : "FR"}
          </LanguageButton>
        </TopRow>
        <CenterContainer>
          <Header>{t("Login")}</Header>
          <Subtext>{t("LoginPage_SubHeader")}</Subtext>
          <InputField
            fieldName="Input_EmailorPhoneNumber"
            validation={(value) =>
              /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value) ||
              /^\+(\d{1,3})[\s-]?\(?(\d{1,4})\)?[\s-]?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,4}$/.test(
                value
              )
            }
            changeValue={setUsername}
            errorMessage={t("Error_EmailPhone")}
          />
          <InputField
            fieldName="Input_Password"
            isPassword
            changeValue={setPassword}
          />
          <Forgot onClick={handleForgotPassword}>
            {t("LoginPage_Forgot")}
          </Forgot>
          <LoginButton
            disabled={isDisabled}
            onClick={() => triggerLogIn(username, password)}
          >
            {t("Login")}
          </LoginButton>
        </CenterContainer>
        <BottomRow>
          {t("LoginPage_Footer")}
          <Link to="/signup">
            <CreateAcc>{t("LoginPage_Create")}</CreateAcc>
          </Link>
        </BottomRow>
      </FormContainer>
    </LoginPageContainer>
  );
};

export default LoginPage;

const LoginPageContainer = styled.div`
  background-color: white;
  display: flex;
  height: 100vh;
  width: 100vw;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const CardContainer = styled.div`
  background: linear-gradient(
      220deg,
      rgba(22, 114, 192, 0) 1.87%,
      rgba(22, 114, 192, 0.9) 73.32%
    ),
    url(${img}) lightgray 50% / cover no-repeat;
  padding: 80px 120px;
  display: flex;
  width: 45%;
  flex-direction: column;
  justify-content: space-between;
  align-items: stretch;
  color: #fff;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 80px 40px;
    width: 100%;
  }
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;

  @media (max-width: 768px) {
    margin-bottom: 20px;
  }
`;

const LogoImage = styled.img`
  height: 22px;
`;

const LogoText = styled.h1`
  margin-left: 5px;
  font-family: "Michroma", serif;
  font-size: 24px;
`;

const Title = styled.h1`
  font-size: 50px;
  font-weight: 300;
  line-height: 64px;

  @media (max-width: 768px) {
    font-size: 30px;
    font-weight: 500;
    line-height: 50px;
  }
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: start;
  width: 55%;
  height: 100%;
  padding: 50px 100px;
  background-color: white;
  justify-content: space-between;

  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 50px 50px;
  }
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 10px;
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

const LanguageButton = styled.div`
  cursor: pointer;
  display: flex;
  padding: 6px 10px 6px 6px;
  gap: 6px;
  border-radius: 40px;
  background: #f5f6fa;
`;

const CenterContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
  gap: 20px;
`;

const Header = styled.h1`
  font-size: 40px;
  font-weight: 800;
  color: #436C4D;
`;

const Subtext = styled.p`
  font-size: 16px;
  margin-bottom: 30px;
`;

const Forgot = styled.div`
  font-size: 12px;
  font-weight: 700;
  margin-left: auto;
  cursor: pointer;
  margin-top: -30px;
`;

const LoginButton = styled.button`
  padding: 15px 20px;
  border-radius: 38px;
  background: ${({ disabled }) => (disabled ? "#d3d3d3" : "#436C4D")};
  color: white;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  transition: opacity 0.3s ease;
  width: 100%;
  margin-top: 50px;
  opacity: ${({ disabled }) => (disabled ? "0.5" : "1")};
  transition: all 0.3s ease;

  &:hover {
    opacity: ${({ disabled }) => (disabled ? "0.5" : "0.7")};
  }
`;

const BottomRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 10px;
  font-size: 16px;
  font-weight: 500;
  margin-top: 50px;
`;

const CreateAcc = styled.div`
  color: #436C4D;
  cursor: pointer;
  font-weight: 700;
  text-decoration-line: underline;
`;
