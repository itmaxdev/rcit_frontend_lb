// src/functions/validateIMEI.js
const BASE_URL = "http://10.0.204.83:8080/rcit/v1/api";
const VALIDATE_URL = `${BASE_URL}/imei/validate`;

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

      let validity;
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

      const formattedData = {
        Model: result.data.deviceName_Model || "-",
        Validity: validity,
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

