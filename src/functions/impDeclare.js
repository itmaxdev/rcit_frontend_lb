// src/functions/impDeclare.js
import { getToken } from "./token";
import { makeAuthenticatedRequest } from "./authenticatedRequest";
import { API_BASE_URL } from "../config/api";

const BULK_URL = `${API_BASE_URL}/importers/bulk-uploads`;
const DECLARATIONS_URL = `${API_BASE_URL}/importers/declarations`;

const pollUploadResults = async (uploadID, interval = 1000) => {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const summary = await getSummaryData(uploadID);
        const totalIMEIs = Number(summary?.totalIMEIs ?? 0);
        const validRecordsCount = Number(summary?.validRecordsCount ?? 0);
        const invalidRecordsCount = Number(summary?.invalidRecordsCount ?? 0);
        const isTerminalStatus =
          summary?.status === "PROCESSED_OK" ||
          summary?.status === "PROCESSED_INVALID";
        const isCountComplete =
          totalIMEIs > 0 &&
          validRecordsCount + invalidRecordsCount >= totalIMEIs;

        if (isTerminalStatus && isCountComplete) {
          resolve(summary);
        } else {
          setTimeout(poll, interval);
        }
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
};

// Updated bulkUpload function
export const bulkUpload = async (file) => {
  const token = getToken();
  const ret = {};
  try {
    const formData = new FormData();
    formData.append("imeiBulkFile", file);

    const response = await makeAuthenticatedRequest(BULK_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      global.alert2(`Upload failed with status: ${errorData.message}`);
      return;
    }

    const data = await response.json();
    ret.uploadId = data.uploadId;

    // Start polling for summary status
    const summary = await pollUploadResults(data.uploadId);

    if (summary.status === "PROCESSED_OK" || summary.status === "PROCESSED_INVALID") {
      const results = await fetchUploadResults(data.uploadId, 1, 10);
      ret.uploadedData = results;
      ret.summaryData = summary;
    } else {
      const errorData = await response.json();
      console.error(
        "Bulk upload did not complete successfully. Final status:",
        errorData.message
      );
    }
  } catch (error) {
    console.error("Error during bulk upload:", error);
    global.alert2("Failed to upload file. Please try again.");
  }
  return ret;
};

export const fetchImporterDeclarations = async (page = 1, pageSize = 100) => {
  const token = getToken();
  const url = `${DECLARATIONS_URL}?page=${page}&pageSize=${pageSize}`;

  try {
    const response = await makeAuthenticatedRequest(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response?.ok) {
      const errorData = response ? await response.json() : null;
      throw new Error(errorData?.message || "Failed to fetch importer declarations");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching importer declarations:", error);
    return null;
  }
};

export const fetchImporterDeclarationById = async (uploadId) => {
  const token = getToken();
  const url = `${DECLARATIONS_URL}/${uploadId}`;

  try {
    const response = await makeAuthenticatedRequest(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response?.ok) {
      const errorData = response ? await response.json() : null;
      throw new Error(errorData?.message || "Failed to fetch importer declaration");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching importer declaration:", error);
    return null;
  }
};

export const initiateDeclarationPayment = async (uploadId) => {
  const token = getToken();
  const url = `${DECLARATIONS_URL}/${uploadId}/payments`;

  try {
    const response = await makeAuthenticatedRequest(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response?.ok) {
      const errorData = response ? await response.json() : null;
      throw new Error(errorData?.message || "Failed to initiate declaration payment");
    }

    return response.json();
  } catch (error) {
    console.error("Error initiating declaration payment:", error);
    return null;
  }
};

// Function to fetch results by upload ID
export const fetchUploadResults = async (uploadID, page, pageSize) => {
  const token = getToken();
  const url = `${BULK_URL}/${uploadID}/devices?page=${page}&pageSize=${pageSize}`;

  try {
    const response = await makeAuthenticatedRequest(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      global.alert2(`Failed to fetch results with status ${errorData.message}`);
      throw new Error(`HTTP error! status: ${errorData.message}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Error fetching upload results:", error);
    global.alert2("Failed to retrieve results. Please try again.");
  }
};

// Function to retrieve summary data
export const getSummaryData = async (uploadID) => {
  const token = getToken();
  const url = `${BULK_URL}/${uploadID}`;

  try {
    const response = await makeAuthenticatedRequest(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      global.alert2(`Failed to retrieve summary data with status ${errorData.message}`);
    }

    const data = await response.json();
    const summary = {
      totalIMEIs: data.totalIMEIs,
      validRecordsCount: data.validRecordsCount,
      invalidRecordsCount: data.invalidRecordsCount,
      status: data.status,
    };

    return summary;
  } catch (error) {
    console.error("Error fetching summary data:", error);
    global.alert2("Failed to retrieve summary data. Please try again.");
  }
};

// Function to retrieve the full file for download
export const downloadFullFile = async (uploadID) => {
  const token = getToken();
  const url = `${BULK_URL}/${uploadID}/exports`;

  try {
    const response = await makeAuthenticatedRequest(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      global.alert2(`Failed to retrieve full file with status ${errorData.message}`);
    }

    const blob = await response.blob();
    const fileName = `Report_${uploadID}.csv`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();

  } catch (error) {
    console.error("Error downloading full file:", error);
    global.alert2("Failed to download full file. Please try again.");
  }
};

// Function to declare the information
export const declareInformation = async (uploadID) => {
  const token = getToken();
  const url = `${BULK_URL}/${uploadID}/submit-to-customs`;

  try {
    const response = await makeAuthenticatedRequest(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      global.alert2(`Declaration failed with status ${errorData.message}`);
    }

    const data = await response;

    return data.status;
  } catch (error) {
    console.error("Error declaring information:", error);
    global.alert2("Failed to declare information. Please try again.");
  }
  return false;
};
