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
