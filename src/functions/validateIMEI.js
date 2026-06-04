// src/functions/validateIMEI.js
import { API_BASE_URL } from "../config/api";

const VALIDATE_URL = `${API_BASE_URL}/imei/validate`;

export const validateIMEI = async (imei) => {
  try {
    const response = await fetch(`${VALIDATE_URL}?imei=${imei}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const result = await response.json();
      const registrationState = inferRegistrationState(result);

      let validity;
      switch (registrationState) {
        case "REGISTERED":
          validity = "valid";
          break;
        case "PAYMENT_PENDING":
        case "DECLARATION_IN_PROGRESS":
        case "NOT_REGISTERED":
          validity = "unregistered";
          break;
        default:
          switch (result.message) {
            case "IMEI is valid and not registered.":
              validity = "unregistered";
              break;
            case "IMEI is valid but already registered.":
              validity = "valid";
              break;
            default:
              validity = "invalid";
          }
      }

      const formattedData = {
        Model: result.data.deviceName_Model || "-",
        Validity: validity,
        RegistrationState: registrationState,
        Type: result.data.deviceType || "-",
        Manufacturer: result.data.manufacture || "-",
        Status: result.data.deviceStatus || "-",
      };

      console.log("IMEI validated successfully:", formattedData);
      return formattedData;
    } else {
      const errorData = await response.json();
      console.error("IMEI validation failed:", errorData.message);
      global.alert2(errorData.error || "Failed to validate IMEI.");
      return null;
    }
  } catch (error) {
    console.error("Error validating IMEI:", error);
    global.alert2("An error occurred while validating the IMEI.");
    return null;
  }
};

const inferRegistrationState = (result) => {
  const explicitState = result?.data?.registrationState;
  if (explicitState) {
    return explicitState;
  }

  switch (result?.message) {
    case "IMEI is valid but already registered.":
      return "REGISTERED";
    case "IMEI is valid and not registered.":
      return "NOT_REGISTERED";
    default:
      return "INVALID";
  }
};
