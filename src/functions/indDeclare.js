// src/functions/indDeclare.js
import { getToken } from "./token";
import { makeAuthenticatedRequest } from "./authenticatedRequest";

const BASE_URL = "http://10.0.204.83:8080/rcit/v1/api";
const VERIFY_URL = `${BASE_URL}/user/verify-imei`;
const DECLARE_URL = `${BASE_URL}/user/declare-imei`;

export const handleIMEI = async (data, declare = false) => {
  const token = getToken();

  if (!token) {
    global.alert2("Authentication token is missing.");
    return;
  }

  const url = declare ? DECLARE_URL : VERIFY_URL;

  try {
    const response = await makeAuthenticatedRequest(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (response.status === 200) {
      const json = await response.json()
      return { status: response.status, ...json }
    }

    if (response.status === 409 || response.status == 400) {
      const json = await response.json()
      return { status: response.status, ...json }
    }


    const errorData = await response.json();
    global.alert2(`Error! Status: ${errorData.message}`);
    return;
  } catch (error) {
    console.error("Error handling IMEI request:", error);
    throw error;
  }
};
