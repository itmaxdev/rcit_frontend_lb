import { getToken } from "./token";
import { makeAuthenticatedRequest } from "./authenticatedRequest";
import { CUSTOMS_API_BASE_URL } from "../config/api";

export const fetchCustomsDashboard = async () => {
  try {
    const token = getToken();
    const response = await makeAuthenticatedRequest(
      `${CUSTOMS_API_BASE_URL}/dashboard`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response?.ok) {
      const errorData = response ? await response.json() : null;
      throw new Error(errorData?.message || "Failed to fetch customs dashboard");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching customs dashboard:", error);
    return null;
  }
};

export const fetchCustomsInvoiceConfiguration = async () => {
  try {
    const token = getToken();
    const response = await makeAuthenticatedRequest(
      `${CUSTOMS_API_BASE_URL}/configuration/invoice-rates`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response?.ok) {
      const errorData = response ? await response.json() : null;
      throw new Error(
        errorData?.message || "Failed to fetch customs configuration"
      );
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching customs configuration:", error);
    return null;
  }
};

export const fetchCustomsDeclarations = async (
  declarationType = "IMPORTER",
  page = 1,
  pageSize = 10,
  search = "",
  archived = false
) => {
  try {
    const token = getToken();
    const params = new URLSearchParams({
      type: declarationType,
      page,
      pageSize,
      archived,
    });

    if (search) {
      params.append("search", search);
    }

    const response = await makeAuthenticatedRequest(
      `${CUSTOMS_API_BASE_URL}/declarations?${params.toString()}`,
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
    console.error("Error fetching customs declarations:", error);
    return null;
  }
};

export const fetchCustomsDeclarationDetail = async (
  declarationType,
  declarationId
) => {
  try {
    const token = getToken();
    const response = await makeAuthenticatedRequest(
      `${CUSTOMS_API_BASE_URL}/declarations/${declarationType}/${declarationId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response?.ok) {
      const errorData = response ? await response.json() : null;
      throw new Error(errorData?.message || "Failed to fetch declaration detail");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching customs declaration detail:", error);
    return null;
  }
};

export const fetchCustomsDeclarationInvoice = async (
  declarationType,
  declarationId
) => {
  try {
    const token = getToken();
    const response = await makeAuthenticatedRequest(
      `${CUSTOMS_API_BASE_URL}/declarations/${declarationType}/${declarationId}/invoice`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response?.ok) {
      const errorData = response ? await response.json() : null;
      throw new Error(errorData?.message || "Failed to fetch declaration invoice");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching customs declaration invoice:", error);
    return null;
  }
};

const extractFilename = (response, fallbackFileName) => {
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="([^"]+)"/i);
  return match?.[1] || fallbackFileName;
};

const downloadBlobResponse = async (response, fallbackFileName) => {
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = extractFilename(response, fallbackFileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};

export const downloadCustomsDeclarationInvoicePdf = async (
  declarationType,
  declarationId,
  fallbackFileName = "invoice.pdf"
) => {
  try {
    const token = getToken();
    const response = await makeAuthenticatedRequest(
      `${CUSTOMS_API_BASE_URL}/declarations/${declarationType}/${declarationId}/invoice/pdf`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response?.ok) {
      const errorData = response ? await response.json() : null;
      throw new Error(errorData?.message || "Failed to download declaration invoice");
    }

    await downloadBlobResponse(response, fallbackFileName);
    return true;
  } catch (error) {
    console.error("Error downloading customs declaration invoice PDF:", error);
    return false;
  }
};

export const startCustomsDeclarationReview = async (
  declarationType,
  declarationId
) => {
  try {
    const token = getToken();
    const response = await makeAuthenticatedRequest(
      `${CUSTOMS_API_BASE_URL}/declarations/${declarationType}/${declarationId}/start-review`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response?.ok) {
      const errorData = response ? await response.json() : null;
      throw new Error(errorData?.message || "Failed to start declaration review");
    }

    return response.json();
  } catch (error) {
    console.error("Error starting customs declaration review:", error);
    return null;
  }
};

export const adjustDeclarationValue = async (
  declarationType,
  declarationId,
  adjustedValue,
  reason
) => {
  try {
    const token = getToken();
    const response = await makeAuthenticatedRequest(
      `${CUSTOMS_API_BASE_URL}/declarations/${declarationType}/${declarationId}/adjust`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adjustedValue, reason }),
      }
    );

    if (!response?.ok) {
      const errorData = response ? await response.json() : null;
      throw new Error(errorData?.message || "Failed to adjust declaration value");
    }

    return response.json();
  } catch (error) {
    console.error("Error adjusting declaration value:", error);
    return null;
  }
};

export const approveDeclaration = async (declarationType, declarationId) => {
  try {
    const token = getToken();
    const response = await makeAuthenticatedRequest(
      `${CUSTOMS_API_BASE_URL}/declarations/${declarationType}/${declarationId}/approve`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response?.ok) {
      const errorData = response ? await response.json() : null;
      throw new Error(errorData?.message || "Failed to approve declaration");
    }

    return response.json();
  } catch (error) {
    console.error("Error approving declaration:", error);
    return null;
  }
};

export const generateInvoice = async (declarationType, declarationId) => {
  try {
    const token = getToken();
    const response = await makeAuthenticatedRequest(
      `${CUSTOMS_API_BASE_URL}/declarations/${declarationType}/${declarationId}/generate-invoice`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response?.ok) {
      const errorData = response ? await response.json() : null;
      throw new Error(errorData?.message || "Failed to generate invoice");
    }

    return response.json();
  } catch (error) {
    console.error("Error generating invoice:", error);
    return null;
  }
};

export const releaseInvoice = async (declarationType, declarationId) => {
  try {
    const token = getToken();
    const response = await makeAuthenticatedRequest(
      `${CUSTOMS_API_BASE_URL}/declarations/${declarationType}/${declarationId}/release-invoice`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response?.ok) {
      const errorData = response ? await response.json() : null;
      throw new Error(errorData?.message || "Failed to release invoice");
    }

    return response.json();
  } catch (error) {
    console.error("Error releasing invoice:", error);
    return null;
  }
};

export const rejectDeclaration = async (declarationType, declarationId, reason) => {
  try {
    const token = getToken();
    const response = await makeAuthenticatedRequest(
      `${CUSTOMS_API_BASE_URL}/declarations/${declarationType}/${declarationId}/reject`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      }
    );

    if (!response?.ok) {
      const errorData = response ? await response.json() : null;
      throw new Error(errorData?.message || "Failed to reject declaration");
    }

    return response.json();
  } catch (error) {
    console.error("Error rejecting declaration:", error);
    return null;
  }
};

export const closeDeclaration = async (declarationType, declarationId) => {
  try {
    const token = getToken();
    const response = await makeAuthenticatedRequest(
      `${CUSTOMS_API_BASE_URL}/declarations/${declarationType}/${declarationId}/close`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response?.ok) {
      const errorData = response ? await response.json() : null;
      throw new Error(errorData?.message || "Failed to close declaration");
    }

    return response.json();
  } catch (error) {
    console.error("Error closing declaration:", error);
    return null;
  }
};
