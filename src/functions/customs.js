import { getToken } from "./token";
import { makeAuthenticatedRequest } from "./authenticatedRequest";
import { CUSTOMS_API_BASE_URL } from "../config/api";

export const fetchCustomsDeclarations = async (
  declarationType = "IMPORTER",
  page = 1,
  pageSize = 10,
  search = ""
) => {
  try {
    const token = getToken();
    const params = new URLSearchParams({
      type: declarationType,
      page,
      pageSize,
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
