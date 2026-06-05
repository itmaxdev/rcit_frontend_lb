// src/functions/registered.js
import { getToken } from "./token";
import { makeAuthenticatedRequest } from "./authenticatedRequest";
import { API_BASE_URL } from "../config/api";

const USER_URL = `${API_BASE_URL}/imeis`;
const ADMIN_URL = `${API_BASE_URL}/admins/imeis`;
const IMPORTER_BULK_UPLOADS_URL = `${API_BASE_URL}/importers/bulk-uploads`;

export const fetchRegisteredDevices = async (
  page = 1,
  size = 10,
  search,
  userId = null,
  isAdmin = false,
  filters = {}
) => {
  try {
    const selectedURL = isAdmin ? ADMIN_URL : USER_URL;
    const token = getToken();
    const params = new URLSearchParams({ page, pageSize: size });
    if (search) {
      params.append("search", search);
    }
    if (isAdmin && userId) {
      params.append("userId", userId);
    }
    if (isAdmin && filters) {
      if (filters.brand) params.append("brand", filters.brand);
      if (filters.country) params.append("country", filters.country);
      if (filters.technology) params.append("technology", filters.technology);
      if (filters.declDateFrom) params.append("declDateFrom", filters.declDateFrom);
      if (filters.declDateTo) params.append("declDateTo", filters.declDateTo);
    }

    const url = `${selectedURL}?${params.toString()}`;
    const headers = { Authorization: `Bearer ${token}` };

    const data = await makeAuthenticatedRequest(url, {
      method: "GET",
      headers,
    });

    if (data) {
      return data.json();
    } else {
      console.error(
        "Error fetching registered devices: API request failed or returned no data."
      );
      return null;
    }
  } catch (error) {
    console.error("Error fetching registered devices:", error);
    return null;
  }
};

export const fetchClearableImporterUpload = async () => {
  try {
    const token = getToken();
    const url = `${IMPORTER_BULK_UPLOADS_URL}/clearable`;
    const response = await makeAuthenticatedRequest(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response?.ok) {
      return null;
    }

    if (response.status === 204) {
      return null;
    }

    const responseText = await response.text();
    if (!responseText) {
      return null;
    }

    return JSON.parse(responseText);
  } catch (error) {
    console.error("Error fetching clearable importer upload:", error);
    return null;
  }
};

export const clearImporterUploadData = async (uploadId) => {
  try {
    const token = getToken();
    const url = `${IMPORTER_BULK_UPLOADS_URL}/${uploadId}/clear-data`;
    const response = await makeAuthenticatedRequest(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response?.ok) {
      const errorData = response ? await response.json() : null;
      throw new Error(errorData?.message || "Failed to clear importer data");
    }

    return true;
  } catch (error) {
    console.error("Error clearing importer upload data:", error);
    global.alert2?.("Failed to clear importer data. Please try again.");
    return false;
  }
};
