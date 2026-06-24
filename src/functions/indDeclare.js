// src/functions/indDeclare.js
import { getToken } from "./token";
import { makeAuthenticatedRequest } from "./authenticatedRequest";
import { API_BASE_URL } from "../config/api";

const VERIFY_URL = `${API_BASE_URL}/user/verify-imei`;
const DECLARE_URL = `${API_BASE_URL}/user/declare-imei`;
const DECLARATIONS_URL = `${API_BASE_URL}/user/declarations`;

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
      const json = await response.json();
      return { status: response.status, ...json };
    }

    if (response.status === 409 || response.status === 400) {
      const json = await response.json();
      return { status: response.status, ...json };
    }

    const errorData = await response.json();
    global.alert2(`Error! Status: ${errorData.message}`);
    return;
  } catch (error) {
    console.error("Error handling IMEI request:", error);
    throw error;
  }
};

export const fetchUserDeclarations = async (
  page = 1,
  pageSize = 10,
  search = "",
  archived = false
) => {
  const token = getToken();
  const params = new URLSearchParams({ page, pageSize, archived });
  if (search) {
    params.append("search", search);
  }

  try {
    const response = await makeAuthenticatedRequest(
      `${DECLARATIONS_URL}?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response?.ok) {
      const errorData = response ? await response.json() : null;
      throw new Error(errorData?.message || "Failed to fetch declarations");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching user declarations:", error);
    return null;
  }
};

export const fetchUserDeclarationById = async (declarationId) => {
  const token = getToken();

  try {
    const response = await makeAuthenticatedRequest(
      `${DECLARATIONS_URL}/${declarationId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response?.ok) {
      const errorData = response ? await response.json() : null;
      throw new Error(errorData?.message || "Failed to fetch declaration");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching user declaration detail:", error);
    return null;
  }
};

export const initiateUserDeclarationPayment = async (declarationId) => {
  const token = getToken();

  try {
    const response = await makeAuthenticatedRequest(
      `${DECLARATIONS_URL}/${declarationId}/payments`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response?.ok) {
      const errorData = response ? await response.json() : null;
      throw new Error(
        errorData?.message || "Failed to initiate declaration payment"
      );
    }

    return response.json();
  } catch (error) {
    console.error("Error initiating user declaration payment:", error);
    return null;
  }
};
