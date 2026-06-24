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

const extractFilename = (response, fallbackFileName) => {
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="([^"]+)"/i);
  return match?.[1] || fallbackFileName;
};

// Fetches the invoice PDF (same document customs downloads) and opens it in a
// new tab so the user can view it. Returns false on failure.
export const viewUserDeclarationInvoicePdf = async (
  declarationId,
  fallbackFileName = "invoice.pdf"
) => {
  const token = getToken();

  try {
    const response = await makeAuthenticatedRequest(
      `${DECLARATIONS_URL}/${declarationId}/invoice/pdf`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response?.ok) {
      const errorData = response ? await response.json() : null;
      throw new Error(errorData?.message || "Failed to load invoice");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      // Popup blocked: fall back to a download so the user still gets the file.
      const link = document.createElement("a");
      link.href = url;
      link.download = extractFilename(response, fallbackFileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    window.setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    return true;
  } catch (error) {
    console.error("Error loading user declaration invoice PDF:", error);
    return false;
  }
};
