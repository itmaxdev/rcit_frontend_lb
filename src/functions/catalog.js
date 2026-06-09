// src/functions/catalog.js
import { getToken } from "./token";
import { makeAuthenticatedRequest } from "./authenticatedRequest";
import { API_BASE_URL } from "../config/api";

const BRANDS_URL = `${API_BASE_URL}/brands`;
const MODELS_URL = `${API_BASE_URL}/models`;

// The /models endpoint requires the query to be at least 3 characters long.
const MIN_MODEL_QUERY_LENGTH = 3;

const fetchSuggestions = async (url) => {
  try {
    const token = getToken();
    const response = await makeAuthenticatedRequest(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response?.ok) {
      return [];
    }

    const json = await response.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return [];
  }
};

// Returns a list of brands matching the typed text: [{ id, name }, ...].
export const searchBrands = async (name = "") => {
  const params = new URLSearchParams({ name, page: 1, pageSize: 8 });
  return fetchSuggestions(`${BRANDS_URL}?${params.toString()}`);
};

// Returns a list of models for a given brand: [{ id, name, technology, brandId }, ...].
// Requires a selected brandId and at least 3 typed characters (backend constraint).
export const searchModels = async (name = "", brandId = "") => {
  if (!brandId || name.trim().length < MIN_MODEL_QUERY_LENGTH) {
    return [];
  }
  const params = new URLSearchParams({ name, brandId, page: 1, pageSize: 8 });
  return fetchSuggestions(`${MODELS_URL}?${params.toString()}`);
};
