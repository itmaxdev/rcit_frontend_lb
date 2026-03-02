// src/functions/registered.js
import { getToken } from "./token";
import { makeAuthenticatedRequest } from "./authenticatedRequest";

const BASE_URL = "http://10.0.204.83:8080/rcit/v1/api";
const USER_URL = `${BASE_URL}/imeis`;
const ADMIN_URL = `${BASE_URL}/admins/imeis`;

export const fetchRegisteredDevices = async (
  page = 1,
  size = 10,
  search,
  userId = null,
  isAdmin = false
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
