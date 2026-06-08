// src/functions/impDeclare.js
import { getToken } from "./token";
import { makeAuthenticatedRequest } from "./authenticatedRequest";
import { API_BASE_URL } from "../config/api";

const BULK_URL = `${API_BASE_URL}/importers/bulk-uploads`;
const DECLARATIONS_URL = `${API_BASE_URL}/importers/declarations`;

const isAbortError = (error) =>
  error?.name === "AbortError" || error?.message === "Polling aborted";

const parseErrorData = async (response, fallbackMessage) => {
  try {
    return await response.json();
  } catch (error) {
    return { message: fallbackMessage || response.statusText || "Unknown error" };
  }
};

const pollUploadResults = async (uploadID, interval = 1000, signal) => {
  return new Promise((resolve, reject) => {
    let timeoutId;

    const poll = async () => {
      if (signal?.aborted) {
        reject(new DOMException("Polling aborted", "AbortError"));
        return;
      }

      try {
        const summary = await getSummaryData(uploadID, {
          silentAuthErrors: true,
          signal,
        });

        if (signal?.aborted) {
          reject(new DOMException("Polling aborted", "AbortError"));
          return;
        }

        if (!summary) {
          if (!getToken()) {
            reject(new DOMException("Polling aborted", "AbortError"));
            return;
          }
          reject(new Error("Failed to retrieve summary data"));
          return;
        }

        const totalIMEIs = Number(summary?.totalIMEIs ?? 0);
        const validRecordsCount = Number(summary?.validRecordsCount ?? 0);
        const invalidRecordsCount = Number(summary?.invalidRecordsCount ?? 0);
        const isTerminalStatus =
          summary?.status === "PROCESSED_OK" ||
          summary?.status === "PROCESSED_INVALID";
        const isCountComplete =
          totalIMEIs === 0 ||
          validRecordsCount + invalidRecordsCount >= totalIMEIs;

        if (isTerminalStatus && isCountComplete) {
          resolve(summary);
        } else {
          timeoutId = setTimeout(poll, interval);
        }
      } catch (error) {
        reject(error);
      }
    };

    if (signal) {
      signal.addEventListener(
        "abort",
        () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          reject(new DOMException("Polling aborted", "AbortError"));
        },
        { once: true }
      );
    }

    poll();
  });
};

// Updated bulkUpload function
export const bulkUpload = async (file, options = {}) => {
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
      signal: options.signal,
    });

    if (!response) {
      return ret;
    }

    if (!response.ok) {
      const errorData = await parseErrorData(response, "Upload failed");
      global.alert2(`Upload failed with status: ${errorData.message}`);
      return;
    }

    const data = await response.json();
    ret.uploadId = data.uploadId;

    // Start polling for summary status
    const summary = await pollUploadResults(data.uploadId, 1000, options.signal);

    if (summary.status === "PROCESSED_OK" || summary.status === "PROCESSED_INVALID") {
      const results = await fetchUploadResults(
        data.uploadId,
        1,
        10,
        {},
        { silentAuthErrors: true, signal: options.signal }
      );
      ret.uploadedData = results;
      ret.summaryData = summary;
    } else {
      console.error(
        "Bulk upload did not complete successfully. Final status:",
        summary.status
      );
    }
  } catch (error) {
    if (isAbortError(error)) {
      return ret;
    }
    console.error("Error during bulk upload:", error);
    global.alert2("Failed to upload file. Please try again.");
  }
  return ret;
};

export const fetchImporterDeclarations = async (
  page = 1,
  pageSize = 100,
  search = "",
  archived = false
) => {
  const token = getToken();
  const params = new URLSearchParams({ page, pageSize, archived });
  if (search) {
    params.append("search", search);
  }
  const url = `${DECLARATIONS_URL}?${params.toString()}`;

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

export const fetchImporterDeclarationInvoice = async (uploadId) => {
  const token = getToken();
  const url = `${DECLARATIONS_URL}/${uploadId}/invoice`;

  try {
    const response = await makeAuthenticatedRequest(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response?.ok) {
      const errorData = response ? await response.json() : null;
      throw new Error(errorData?.message || "Failed to fetch importer invoice");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching importer invoice:", error);
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

export const downloadImporterDeclarationInvoicePdf = async (
  uploadId,
  fallbackFileName = "invoice.pdf"
) => {
  const token = getToken();
  const url = `${DECLARATIONS_URL}/${uploadId}/invoice/pdf`;

  try {
    const response = await makeAuthenticatedRequest(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response?.ok) {
      const errorData = response ? await response.json() : null;
      throw new Error(errorData?.message || "Failed to download importer invoice");
    }

    await downloadBlobResponse(response, fallbackFileName);
    return true;
  } catch (error) {
    console.error("Error downloading importer invoice PDF:", error);
    return false;
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
export const fetchUploadResults = async (
  uploadID,
  page,
  pageSize,
  filters = {},
  { silentAuthErrors = false, signal } = {}
) => {
  const token = getToken();
  const params = new URLSearchParams({ page, pageSize });
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "All") {
      params.append(key, value);
    }
  });
  const url = `${BULK_URL}/${uploadID}/devices?${params.toString()}`;

  try {
    const response = await makeAuthenticatedRequest(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    });

    if (!response) {
      return null;
    }

    if (!response.ok) {
      const errorData = await parseErrorData(
        response,
        "Failed to retrieve results"
      );
      const isAuthFailure = response.status === 401 || response.status === 403;

      if (!(silentAuthErrors && isAuthFailure)) {
        global.alert2(`Failed to fetch results with status ${errorData.message}`);
      }
      return null;
    }

    const data = await response.json();

    return data;
  } catch (error) {
    if (isAbortError(error)) {
      return null;
    }
    console.error("Error fetching upload results:", error);
    if (!silentAuthErrors) {
      global.alert2("Failed to retrieve results. Please try again.");
    }
    return null;
  }
};

// Function to retrieve summary data
export const getSummaryData = async (
  uploadID,
  { silentAuthErrors = false, signal } = {}
) => {
  const token = getToken();
  const url = `${BULK_URL}/${uploadID}`;

  try {
    const response = await makeAuthenticatedRequest(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    });

    if (!response) {
      return null;
    }

    if (!response.ok) {
      const errorData = await parseErrorData(
        response,
        "Failed to retrieve summary data"
      );
      const isAuthFailure = response.status === 401 || response.status === 403;

      if (!(silentAuthErrors && isAuthFailure)) {
        global.alert2(
          `Failed to retrieve summary data with status ${errorData.message}`
        );
      }
      return null;
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
    if (isAbortError(error)) {
      return null;
    }
    console.error("Error fetching summary data:", error);
    if (!silentAuthErrors) {
      global.alert2("Failed to retrieve summary data. Please try again.");
    }
    return null;
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
