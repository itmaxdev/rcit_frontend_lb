import { API_BASE_URL } from "../config/api";
import { makeAuthenticatedRequest } from "./authenticatedRequest";
import { getToken } from "./token";

export const fetchNotifications = async () => {
  try {
    const token = getToken();
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/notifications`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response?.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return null;
  }
};

export const markNotificationRead = async (notificationId) => {
  try {
    const token = getToken();
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/notifications/${notificationId}/read`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response?.ok;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
};

export const markAllNotificationsRead = async () => {
  try {
    const token = getToken();
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/notifications/read-all`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response?.ok;
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return false;
  }
};
