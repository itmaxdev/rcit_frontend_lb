const DEFAULT_API_BASE_URL = "http://10.0.204.83:8080/rcit/v1/api";

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL;

export const API_BASE_URL = apiBaseUrl.replace(/\/$/, "");
export const USER_API_BASE_URL = `${API_BASE_URL}/user`;
export const ADMIN_API_BASE_URL = `${API_BASE_URL}/admin`;
