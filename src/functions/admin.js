// src/functions/admin.js
import { getToken } from "./token";
import { makeAuthenticatedRequest } from "./authenticatedRequest";

const BASE_URL = "http://10.0.204.83:8080/rcit/v1/api/admin";

export const fetchPendingEntities = async (
  isUser = true,
  page = 0,
  pageSize = 10,
  setTotalElements
) => {
  try {
    const token = getToken();
    const endpoint = isUser ? "/users/pending" : "/importers/pending";
    const params = new URLSearchParams({ page, size: pageSize });
    const url = `${BASE_URL}${endpoint}?${params.toString()}`;
    const headers = { Authorization: `Bearer ${token}` };

    const response = await makeAuthenticatedRequest(url, {
      method: "GET",
      headers,
    });

    if (response) {
      const data = await response.json();
      console.log(data);
      setTotalElements(data.totalElements);
      return data.content;
    } else {
      console.error(`Error fetching pending entities: ${response.message}`);
      return null;
    }
  } catch (error) {
    console.error("Error fetching pending entities:", error);
    return null;
  }
};

export const fetchUser = async (userId) => {
  try {
    const token = getToken();
    const url = `${BASE_URL}/get-user/${userId}`;
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
        const docUrl = `${BASE_URL}/documents/${userName}/${fileName}`;
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

export const manageUserAction = async (userId, action) => {
  try {
    const token = getToken();
    let endpoint;

    switch (action) {
      case "approve":
        endpoint = `/approve/${userId}`;
        break;
      case "reject":
        endpoint = `/reject/${userId}`;
        break;
      case "disable":
        endpoint = `/disable/${userId}`;
        break;
      default:
        throw new Error("Invalid action provided");
    }

    const url = `${BASE_URL}${endpoint}`;
    const headers = { Authorization: `Bearer ${token}` };

    const response = await makeAuthenticatedRequest(url, {
      method: "POST",
      headers,
    });

    if (response.ok) {
      return true;
    } else {
      const errorData = await response.json();
      console.error(
        `Error performing ${action} action for user ${userId}: ${errorData.message}`
      );
      return false;
    }
  } catch (error) {
    console.error(
      `Error performing ${action} action for user ${userId}:`,
      error
    );
    return false;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const token = getToken();
    const url = `${BASE_URL}/update-user/${userId}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const response = await makeAuthenticatedRequest(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(userData),
    });

    if (response.ok) {
      // Extract document data from userData
      const documentData = {
        documentIDDocument: userData.documentIDDocument,
        documentCompanyRegistrationDocument:
          userData.documentCompanyRegistrationDocument,
        documentCompanyOwnerNationalID: userData.documentCompanyOwnerNationalID,
      };

      // Call editUserDocuments with the username and document data
      const username =
        userData.firstName +
        "." +
        userData.lastName +
        "." +
        userData.userNationalIdNumber;
      const editDocumentsResult = await editUserDocuments(
        username,
        userData.userNationalIdNumber,
        documentData
      );

      if (!editDocumentsResult) {
        console.error(`Failed to edit documents for user ${username}`);
        return false;
      }

      return true; // Update and document editing successful
    } else {
      const errorData = await response.json();
      console.error(`Error updating user ${userId}: ${errorData.message}`);
      return false;
    }
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    return false;
  }
};

export const editUserDocuments = async (
  username,
  nationalIDNumber,
  documentData
) => {
  try {
    const token = getToken();
    const files = [];

    // Prepare files
    if (documentData.documentIDDocument?.blob) {
      files.push({
        file: new File(
          [documentData.documentIDDocument.blob],
          `ID_${nationalIDNumber}.pdf`,
          { type: "application/pdf" }
        ),
        endpoint: `${BASE_URL}/${username}/edit-documents`,
      });
    }

    if (documentData.documentCompanyRegistrationDocument?.blob) {
      files.push({
        file: new File(
          [documentData.documentCompanyRegistrationDocument.blob],
          `CRD_${nationalIDNumber}.pdf`,
          { type: "application/pdf" }
        ),
        endpoint: `${BASE_URL}/${username}/edit-documents`,
      });
    }

    if (documentData.documentCompanyOwnerNationalID?.blob) {
      files.push({
        file: new File(
          [documentData.documentCompanyOwnerNationalID.blob],
          `CONID_${nationalIDNumber}.pdf`,
          { type: "application/pdf" }
        ),
        endpoint: `${BASE_URL}/${username}/edit-documents`,
      });
    }

    console.log(files);
    // Upload files separately
    for (const { file, endpoint } of files) {
      const formData = new FormData();
      formData.append("file", file);

      const response = await makeAuthenticatedRequest(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "*/*",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          `Error uploading document for user ${username}: ${errorData.message}`
        );
        return false; // Fail if any upload fails
      }
    }

    return true; // All documents uploaded successfully
  } catch (error) {
    console.error(`Error editing documents for user ${username}:`, error);
    return false;
  }
};
