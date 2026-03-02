// src/functions/support.js
import { getToken, parseJwt } from "./token";
import { makeAuthenticatedRequest } from "./authenticatedRequest";
import i18n from "i18next";

const BASE_URL = "http://10.0.204.83:8080/rcit/v1/api";
const USER_SUPPORT_URL = `${BASE_URL}/user/support`;
const PUBLIC_SUPPORT_URL = `${BASE_URL}/public/support`;

export const sendSupportRequest = async (data, isUser = false) => {
  const supportRequest = {
    email: data.email || "",
    language: i18n.language === "fr" ? "ENGLISH" : "FRENCH",
    phoneNumber: data.phoneNumber || "",
    message: data.message,
  };
  console.log(supportRequest);

  const url = isUser ? USER_SUPPORT_URL : PUBLIC_SUPPORT_URL;
  const headers = {
    "Content-Type": "application/json",
  };

  // If it's a user request, add the Authorization header
  if (isUser) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;

      const tokenData = parseJwt(token);
      if (tokenData) {
        supportRequest.email = tokenData.sub || "";
      }
    }
  }

  const options = {
    method: "POST",
    headers,
    body: JSON.stringify(supportRequest),
  };

  try {
    // If it's a user request, use makeAuthenticatedRequest to handle token refresh
    const response = isUser
      ? await makeAuthenticatedRequest(url, options) // For authenticated routes
      : await fetch(url, options); // For public routes

    if (response.ok) {
      const result = await response.text();
      console.log("Support request sent successfully:", result);
      global.alert2("Support request sent successfully.");
      return true;
    } else {
      global.alert2("Failed to send support request.");
      return false;
    }
  } catch (error) {
    console.error("Error sending support request:", error);
    global.alert2("An error occurred while sending the support request.");
    return false;
  }
};
