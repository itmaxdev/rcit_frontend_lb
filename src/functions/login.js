// src/functions/login.js
import { saveToken } from "./token";

const BASE_URL = "http://10.0.204.83:8080/rcit/v1/api";
const LOGIN_URL = `${BASE_URL}/auth/authenticate`;

// Identify input type (email/phone)
const identifyInputType = (input) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const phoneRegex =
    /^\+(\d{1,3})[\s-]?\(?(\d{1,4})\)?[\s-]?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,4}$/;

  if (emailRegex.test(input)) return "email";
  if (phoneRegex.test(input)) return "phone";
  return "invalid";
};

// Function to handle login
export const handleLogin = async (
  setIsLoggedIn,
  setAccountType,
  setAccountState,
  setPhoneVerified,
  setEmailVerified,
  username,
  password
) => {
  const type = identifyInputType(username);

  if (type === "invalid") {
    global.alert2("Invalid username. Please use a valid email or phone number.");
    return;
  }

  const body = JSON.stringify({
    email: type === "email" ? username : "",
    phoneNumber: type === "phone" ? username : "",
    password,
  });

  try {
    const response = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const data = await response.json();

    if (response.ok) {
      const { accessToken, refreshToken, status, authorities, isEmailVerified, isPhoneVerified } = data;

      setAccountState(status);
      setAccountType(authorities?.[0]?.authority || "Unknown");
      setIsLoggedIn(true);
      setEmailVerified(isEmailVerified);
      setPhoneVerified(isPhoneVerified);

      if (status === "Disabled") {
        return;
      }

      if (!accessToken || !refreshToken) {
        console.error("Login failed. Missing authentication tokens.");
        return;
      }

      saveToken(accessToken);
      saveToken(refreshToken, true);
    } else if (response.status === 401) {
      global.alert2("Incorrect email or password, please try again.");
    } else {
      global.alert2(data.error || "Login failed.");
    }
  } catch (error) {
    console.error("Login error:", error);
    global.alert2("An error occurred during login. Please try again.");
  }
};
