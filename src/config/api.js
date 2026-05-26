const DEFAULT_API_BASE_URL = "http://127.0.0.1:4041/rcit/v1/api";

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL;

export const API_BASE_URL = apiBaseUrl.replace(/\/$/, "");
export const USER_API_BASE_URL = `${API_BASE_URL}/user`;
export const ADMIN_API_BASE_URL = `${API_BASE_URL}/admin`;
export const CUSTOMS_API_BASE_URL = `${API_BASE_URL}/customs`;
