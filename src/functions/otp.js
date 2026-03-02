// src/functions/otp.js
import i18n from "i18next";

const BASE_URL = "http://10.0.204.83:8080/rcit/v1/api/user";
const GENERATE_OTP_URL = `${BASE_URL}/generate-otp`;
const VERIFY_OTP_URL = `${BASE_URL}/verify-otp`;
const FORGET_GENERATE_OTP_URL = `${BASE_URL}/forgot-password-generate-otp/`;
const FORGET_VERIFY_OTP_URL = `${BASE_URL}/forgot-password-verify-otp/`;

export const genOTP = async (data, isForgotPassword = false) => {
  try {
    const requestBody = {
      language: i18n.language === "fr" ? "FRENCH" : "ENGLISH",
      email: data.email || "",
      phoneNumber: data.phoneNumber || "",
      channel: data.email ? "EMAIL" : "SMS",
      purpose: isForgotPassword ? "PASSWORD_RESET" : "REGISTRATION",
      otpCode: "",
    };
    
    const response = await fetch(
      isForgotPassword ? FORGET_GENERATE_OTP_URL : GENERATE_OTP_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );
    console.log(response);
    if (response.ok) {
      global.alert2("OTP was successfully sent");
      return true;
    } else {
      global.alert2("OTP failed to send!");
      return false;
    }
  } catch (error) {
    console.error("Error generating OTP:", error);
    global.alert2("An error occurred while generating OTP.");
    return false;
  }
};

export const verifyOTP = async (
  data,
  setEmailVerified,
  setPhoneVerified,
  isForgotPassword = false
) => {
  try {
    const requestBody = {
      language: i18n.language === "fr" ? "FRENCH" : "ENGLISH",
      email: data.email || "",
      phoneNumber: data.phoneNumber || "",
      channel: data.email ? "EMAIL" : "SMS",
      purpose: isForgotPassword ? "PASSWORD_RESET" : "REGISTRATION",
      otpCode: data.code,
    };

    // Add password field only if it's for forgot password
    if (isForgotPassword) {
      requestBody.password = data.password;
    }

    const response = await fetch(
      isForgotPassword ? FORGET_VERIFY_OTP_URL : VERIFY_OTP_URL,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    const responseData = await response.json();

    if (response.ok) {
      console.log(responseData);
      setPhoneVerified(responseData.phoneVerified);
      setEmailVerified(responseData.emailVerified);

      global.alert2("OTP verified successfully!");
      return responseData;
    } else {
      global.alert2(responseData.error || "OTP verification failed.");
      return false;
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    global.alert2("An error occurred during OTP verification.");
    return false;
  }
};
