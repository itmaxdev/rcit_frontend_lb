// src/functions/authenticatedRequests.js
import { getToken, deleteToken, parseJwt } from './token';
import { refreshToken } from './refresh';

// Utility to check if a token is expired
const isTokenExpired = (token) => {
  const decodedToken = parseJwt(token);
  const expiryTime = decodedToken ? decodedToken.exp * 1000 : Date.now();
  return Date.now() > expiryTime;
};

// Function to handle the request logic, including token refresh if expired
export const makeAuthenticatedRequest = async (url, options = {}) => {
  let accessToken = getToken(); // Get current access token

  // Check if the token is expired
  if ((accessToken && isTokenExpired(accessToken)) || !accessToken) {
    console.log('Access token expired. Attempting to refresh...');

    // Attempt to refresh the token
    const success = await refreshToken();

    if (!success) {
      console.error('Token refresh failed. Logging out...');
      deleteToken(); // If refresh fails, clear tokens
      return; // Optionally redirect to login
    }

    // Retrieve the new access token
    accessToken = getToken();
  }

  // Set the Authorization header with the (possibly refreshed) token
  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
  };
  
  // Make the API request
  return fetch(url, options); // Return the response object for handling at the top level
};
