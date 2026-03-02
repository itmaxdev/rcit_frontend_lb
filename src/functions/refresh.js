// src/functions/refresh.js
import { getToken, saveToken, deleteToken } from "./token";
import { makeAuthenticatedRequest } from "./authenticatedRequest";

const BASE_URL = "http://10.0.204.83:8080/rcit/v1/api";
const REFRESH_URL = `${BASE_URL}/auth/refresh-token`;

export const refreshToken = async () => {
  const authToken = getToken();
  const refreshToken = getToken(true);

  if (!refreshToken) {
    console.error("No refresh token available.");
    deleteToken();
    return false;
  }

  try {
    const response = await makeAuthenticatedRequest(REFRESH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const { accessToken, refreshToken: newRefreshToken } =
        await response.json();
      saveToken(accessToken);
      saveToken(newRefreshToken, true);
      return true;
    } else {
      const errorData = await response.json();
      console.error(
        "Failed to refresh token:",
        errorData.message || "Unknown error"
      );
      deleteToken();
      return false;
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
    deleteToken();
    return false;
  }
};
