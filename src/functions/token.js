// src/functions/token.js
import Cookies from "js-cookie";

const TOKEN_EXPIRY = 1 / 24;

// Get the token from the cookie
export const getToken = (refresh = false) => {
  const token = refresh
    ? Cookies.get("refreshToken")
    : Cookies.get("accessToken");
  if (!token) {
    console.warn(`${refresh ? "Refresh token" : "Access token"} not found`);
  }
  return token;
};

// Save the token in a cookie
export const saveToken = (token, refresh = false) => {
  const cookieName = refresh ? "refreshToken" : "accessToken";

  Cookies.remove(cookieName);

  // Check if the token is for refresh or access
  const decodedToken = parseJwt(token);
  
  // Extract the expiry time from the JWT's exp field for both tokens
  const expiryTime = decodedToken ? decodedToken.exp * 1000 : Date.now() + TOKEN_EXPIRY * 24 * 60 * 60 * 1000; // Fallback if no exp field
  const expiryDate = new Date(expiryTime);

  // Save the token in the cookie with the calculated expiry date
  Cookies.set(cookieName, token, {
    expires: expiryDate,  // Set expiry date for both tokens
    secure: false,
    sameSite: "Strict",
  });
};

// Delete the token from the cookie
export const deleteToken = (refresh = false) => {
  if (!refresh) {
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
  } else {
    const cookieName = refresh ? "refreshToken" : "accessToken";
    Cookies.remove(cookieName);
  }
};

export const parseJwt = (token) => {
  try {
    const base64Url = token.split(".")[1]; // Get the payload part of the JWT
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to parse JWT:", e);
    return null;
  }
};
