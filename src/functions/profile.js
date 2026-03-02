// src/functions/profile.js
import { getToken } from "./token";
import { makeAuthenticatedRequest } from "./authenticatedRequest";

const BASE_URL = "http://10.0.204.83:8080/rcit/v1/api/user";

export const fetchUser = async () => {
  try {
    const token = getToken();
    const url = `${BASE_URL}/get-user`;
    const headers = { Authorization: `Bearer ${token}` };

    const response = await makeAuthenticatedRequest(url, {
      method: "POST",
      headers,
    });

    if (response) {
      const data = await response.json();

      const { userName, documentUrl } = data;
      if (!userName || !documentUrl) {
        console.error("Missing username or document URL in user data.");
        return data;
      }

      const filePaths = documentUrl
        .split("|")
        .map((path) => path.split("/").pop());
      const documentPromises = filePaths.map(async (fileName) => {
        const docUrl = `${BASE_URL}/documents/${fileName}`;
        const docResponse = await makeAuthenticatedRequest(docUrl, {
          method: "GET",
          headers,
        });
        const blob = await docResponse.blob();
        return { fileName, blob };
      });

      const documents = await Promise.all(documentPromises);

      return { ...data, documents };
    } else {
        const errorData = await response.json();
      console.error(`Error fetching user: ${errorData.message}`);
      return null;
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};
