// src/functions/profile.js
import { getToken } from "./token";
import { makeAuthenticatedRequest } from "./authenticatedRequest";
import { USER_API_BASE_URL } from "../config/api";

export const fetchUserSummary = async () => {
  try {
    const token = getToken();
    const url = `${USER_API_BASE_URL}/get-user`;
    const headers = { Authorization: `Bearer ${token}` };

    const response = await makeAuthenticatedRequest(url, {
      method: "POST",
      headers,
    });

    if (response?.ok) {
      return await response.json();
    } else if (response) {
      const errorData = await response.json();
      console.error(`Error fetching user: ${errorData.message}`);
      return null;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};

export const fetchUser = async () => {
  try {
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };
    const data = await fetchUserSummary();

    if (!data) {
      return null;
    }

    const { userName, documentUrl } = data;
    if (!userName || !documentUrl) {
      console.error("Missing username or document URL in user data.");
      return data;
    }

    const filePaths = documentUrl
      .split("|")
      .map((path) => path.split("/").pop());
    const documentPromises = filePaths.map(async (fileName) => {
      const docUrl = `${USER_API_BASE_URL}/documents/${fileName}`;
      const docResponse = await makeAuthenticatedRequest(docUrl, {
        method: "GET",
        headers,
      });
      const blob = await docResponse.blob();
      return { fileName, blob };
    });

    const documents = await Promise.all(documentPromises);

    return { ...data, documents };
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};
