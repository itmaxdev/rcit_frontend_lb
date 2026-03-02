// src/pages/OTPVerifyPage.js
import React, { useState, useEffect, useRef, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Context } from "../Context";
import { genOTP, verifyOTP } from "../functions/otp";
import InputField from "../sharedComponents/InputField";

import logoSvg from "../assets/logo.svg";
import globeSvg from "../assets/globe.svg";
import chevron from "../assets/chevron-down.svg";

const OTPVerifyPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isForgotPassword = location.state?.isForgotPassword || false;

  const {
    userEmail,
    userPhone,
    setUserEmail,
    setUserPhone,
    setAccountState,
    setIsLoggedIn,
    emailVerified,
    phoneVerified,
    setEmailVerified,
    setPhoneVerified,
  } = useContext(Context);

  const [method, setMethod] = useState("email");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [timer, setTimer] = useState(30);
  const [validationMessage, setValidationMessage] = useState("");
  const [isValid, setIsValid] = useState(null);
  const [password, setPassword] = useState("");

  const isTimerExpired = timer === 0;
  const firstInputRef = useRef(null);

  // Timer logic
  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    }
  }, [timer]);

  // OTP generation logic
  const generateOTP = async () => {
    try {
      const payload = {
        email: method === "email" ? userEmail : "",
        phoneNumber: method === "phone" ? userPhone : "",
      };

      const success = await genOTP(payload, isForgotPassword);
      setValidationMessage(success ? t("OTP_Sent") : t("OTP_Send_Failed"));
    } catch (error) {
      setValidationMessage(t("OTP_Error"));
      console.error(error);
    }
  };

  // Handle initial OTP generation and method switching
  useEffect(() => {
    if (isForgotPassword) {
      if (!userEmail && !userPhone) {
        global.alert2("No method available for verification.");
        navigate("/signup");
      } else {
        setMethod(userEmail ? "email" : "phone");
        generateOTP();
      }
    } else {
      if (emailVerified && phoneVerified) {
        setValidationMessage(t("OTP_Verified_All"));
        setIsValid(true);
        setTimeout(() => {
          setAccountState("Enabled");
          navigate("/status");
          setUserEmail("");
          setUserPhone("");
        }, 2000);
      } else {
        setMethod(!emailVerified ? "email" : "phone");
        generateOTP();
      }
    }
  }, [method, emailVerified, phoneVerified]);

  // OTP validation logic
  const validateOTP = async () => {
    const code = otp.join("");
    let result;

    if (isForgotPassword) {
      result = await verifyOTP(
        {
          email: method === "email" ? userEmail : "",
          phoneNumber: method === "phone" ? userPhone : "",
          code,
          password,
        },
        setEmailVerified,
        setPhoneVerified,
        isForgotPassword
      );

      if (result) {
        setValidationMessage(t("Password_Reset_Success"));
        setIsValid(true);
        setTimeout(() => {
          navigate("/login");
          setUserEmail("");
          setUserPhone("");
        }, 2000);
      } else {
        setValidationMessage(t("OTP_Invalid"));
        setIsValid(false);
      }
    } else {
      result = await verifyOTP(
        {
          email: method === "email" ? userEmail : "",
          phoneNumber: method === "phone" ? userPhone : "",
          code,
        },
        setEmailVerified,
        setPhoneVerified
      );

      if (result) {
        if (result.emailVerified && result.phoneVerified) {
          setValidationMessage(t("OTP_Verified_All"));
          setIsValid(true);
          setTimeout(() => {
            setAccountState("Enabled");
            navigate("/status");
            setUserEmail("");
            setUserPhone("");
          }, 2000);
        } else {
          setValidationMessage(
            method === "phone"
              ? t("OTP_Verified_Phone")
              : t("OTP_Verified_Email")
          );
          setIsValid(true);
          setTimeout(() => {
            setMethod(!result.phoneVerified ? "phone" : "email");
            setOtp(Array(6).fill(""));
            setValidationMessage("");
            setTimer(30);
            setIsValid(null);
            if (firstInputRef.current) firstInputRef.current.focus();
          }, 2000);
        }
      } else {
        setValidationMessage(t("OTP_Invalid"));
        setIsValid(false);
      }
    }
  };

  // Trigger OTP validation on input completion
  useEffect(() => {
    if (otp.every((digit) => digit !== "") && !isForgotPassword) {
      validateOTP();
    }
  }, [otp]);

  const canChange = otp.every((digit) => digit !== "") && password;

  const handleChangePassword = () => {
    if (canChange) {
      validateOTP();
    }
  };

  // Handle input changes
  const handleChange = (value, index) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < otp.length - 1) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleResend = () => {
    setTimer(60);
    setOtp(Array(6).fill(""));
    setValidationMessage("");
    generateOTP();
  };

  useEffect(() => {
    if ((!userEmail || !userPhone) && !isForgotPassword) {
      global.alert2("No Phone or Email to verify");
      navigate("/signup");
    } else if (!(userEmail || userPhone) && isForgotPassword) {
      global.alert2("No Phone or Email to use to change password");
      navigate("/login");
    }
  }, [userEmail, userPhone]);

  return (
    <OTPVerifyPageContainer>
      <Header>
        <Link to={isForgotPassword ? "/login" : "/signup"}>
          <BackButton onClick={() => setIsLoggedIn(false)}>
            <Chevron src={chevron} alt="Chevron" />
            {isForgotPassword ? t("OTP_Back_Forgot") : t("OTP_Back")}
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

      <Title>{isForgotPassword ? t("OTP_Forgot") : t("OTP_Title")}</Title>

      <Method>
        {method === "phone" ? t("Input_PhoneNumber") : t("Input_Email")}{" "}
        {t("OTP_Verification")}
      </Method>
      <Subtext>
        {t("OTP_SubText")} <b>{method === "phone" ? userPhone : userEmail}</b>
      </Subtext>

      {isForgotPassword && (
        <InputField
          fieldName="Input_NewPassword"
          isPassword
          validation={(value) =>
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
              value
            )
          }
          changeValue={setPassword}
        />
      )}

      <OTPInputField>
        {otp.map((digit, index) => (
          <DigitInput
            key={index}
            id={`otp-${index}`}
            ref={index === 0 ? firstInputRef : null}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            style={{
              borderBottomColor:
                isValid === null
                  ? digit
                    ? "#1672C0"
                    : "#20294C"
                  : isValid
                  ? "green"
                  : "red",
            }}
          />
        ))}
      </OTPInputField>
      {validationMessage && (
        <ValidationMessage isValid={isValid}>
          {validationMessage}
        </ValidationMessage>
      )}
      <Timer>{isTimerExpired ? t("OTP_TimerExpired") : `${timer}s`}</Timer>

      {isForgotPassword && (
        <ChangeButton disabled={!canChange} onClick={handleChangePassword}>
          {t("Change Password")}
        </ChangeButton>
      )}

      <ResendContainer>
        {t("OTP_Footer")}
        <Resend onClick={handleResend} disabled={!isTimerExpired}>
          {t("OTP_Resend")}
        </Resend>
      </ResendContainer>
    </OTPVerifyPageContainer>
  );
};

export default OTPVerifyPage;

const OTPVerifyPageContainer = styled.div`
  background-color: white;
  display: flex;
  flex-direction: column;
  align-items: start;
  height: 100vh;
  width: 70vw;
  margin: 0 auto;
  padding-bottom: 30px;

  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin: 50px 0;
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
  color: #1672c0;
  margin-bottom: 20px;
`;

const Method = styled.p`
  color: #1672c0;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 5px;
  margin-top: 40px;
`;

const Subtext = styled.p`
  font-size: 18px;
  margin-bottom: 30px;
`;

const OTPInputField = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
  margin-bottom: 20px;
`;

const DigitInput = styled.input`
  width: 40px;
  height: 50px;
  font-size: 24px;
  text-align: center;
  border: none;
  border-bottom: 2px solid;
  outline: none;
  caret-color: #1672c0;

  &:disabled {
    background-color: #f5f5f5;
    color: #ccc;
    cursor: not-allowed;
  }
`;

const ValidationMessage = styled.div`
  font-size: 16px;
  color: ${({ isValid }) => (isValid ? "green" : "red")};
  margin-bottom: 10px;
  text-align: center;
`;

const Timer = styled.div`
  font-size: 16px;
  font-weight: 400;
  color: #797f94;
  margin-bottom: 30px;
`;

const ResendContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 500;
`;

const Resend = styled.div`
  color: #1672c0;
  cursor: pointer;
  font-weight: 700;
  text-decoration-line: underline;
`;

const ChangeButton = styled.button`
  padding: 15px 30px;
  border-radius: 38px;
  background: ${({ disabled }) => (disabled ? "#d3d3d3" : "#1672c0")};
  color: white;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  transition: opacity 0.3s ease;
  margin-bottom: 20px;
  opacity: ${({ disabled }) => (disabled ? "0.5" : "1")};
  transition: all 0.3s ease;

  &:hover {
    opacity: ${({ disabled }) => (disabled ? "0.5" : "0.7")};
  }
`;
