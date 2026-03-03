// src/functions/impDeclare.js
import { getToken } from "./token";
import { makeAuthenticatedRequest } from "./authenticatedRequest";

const BASE_URL = "http://10.0.204.83:8080/rcit/v1/api";
const BULK_URL = `${BASE_URL}/importers/bulk-uploads`;

const pollUploadResults = async (uploadID, interval = 1000) => {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const summary = await getSummaryData(uploadID);

        if (summary.status !== "PROCESSING") {
          resolve(summary);
        } else {
          setTimeout(poll, interval); // Retry after the specified interval
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
  const ret = {}
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
    ret.uploadId = data.uploadId

    // Start polling for summary status
    const summary = await pollUploadResults(data.uploadId);

    if (summary.status === "PROCESSED_OK" || summary.status === "PROCESSED_INVALID") {
      // Fetch final results once the upload process is completed
      const results = await fetchUploadResults(data.uploadId, 1, 10); // Adjust page & pageSize as needed
      ret.uploadedData = results
      ret.summaryData = summary
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
  return ret
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
  const url = `${BULK_URL}/${uploadID}`;

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
};
