// src/functions/signup.js
const BASE_URL = "http://10.0.204.83:8080/rcit/v1/api";
const REG_URL = `${BASE_URL}/user/register`;

export const handleSignup = async (
  data,
  accountType,
  setAccountType,
  setAccountState,
  setIsLoggedIn
) => {
  try {
    const registrationBody = {
      userName: `${data.firstName.replace(/\s+/g, "")}.${data.lastName.replace(
        /\s+/g,
        ""
      )}.${data.nationalIDNumber.replace(/\s+/g, "")}`,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      phoneNumber: data.phoneNumber,
      nuiID: data.niuNumber,
      userType: accountType === "ROLE_IMPORTER" ? "IMPORTER" : "USER",
      userNationalIdNumber: data.nationalIDNumber,
      companyName: accountType === "ROLE_IMPORTER" ? data.companyName : "",
      companyAddress:
        accountType === "ROLE_IMPORTER" ? data.companyAddress : "",
      companyRegistrationNumber:
        accountType === "ROLE_IMPORTER" ? data.companyRegistrationNumber : 0,
      companyOwnerName:
        accountType === "ROLE_IMPORTER" ? data.companyOwnerName : "",
      companyOwnerNationalIdNumber:
        accountType === "ROLE_IMPORTER" ? data.companyOwnerNationalIDNumber : 0,
    };

    const registrationResponse = await fetch(REG_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registrationBody),
    });

    const registrationData = await registrationResponse.json();

    if (!registrationResponse.ok) {
      global.alert2(registrationData.message || "Signup failed.");
      return;
    }

    const { authorities, isVerified } = registrationData;
    setAccountState(isVerified ? "Enabled" : "Pending");
    setAccountType(authorities?.[0] || "Unknown");

    // Document upload
    await uploadDocuments(registrationBody.userName, data, accountType);

    global.alert2("Signup and document upload successful!");
    setIsLoggedIn(true);
  } catch (error) {
    console.error("Signup error:", error);
    global.alert2("An error occurred during signup.");
  }
};

const uploadDocuments = async (userName, data, accountType) => {
  const uploadUrl = `${BASE_URL}/user/${userName}/documents`;
  const formData = new FormData();

  const files = [];

  // Append ID document
  if (data.documentIDDocument) {
    files.push(
      new File([data.documentIDDocument], `ID_${data.nationalIDNumber}.pdf`, {
        type: "application/pdf",
      })
    );
  }

  // Append Importer documents
  if (accountType === "ROLE_IMPORTER") {
    if (data.documentCompanyRegistrationDocument) {
      files.push(
        new File(
          [data.documentCompanyRegistrationDocument],
          `CRD_${data.nationalIDNumber}.pdf`,
          { type: "application/pdf" }
        )
      );
    }
    if (data.documentCompanyOwnerNationalID) {
      files.push(
        new File(
          [data.documentCompanyOwnerNationalID],
          `CONID_${data.nationalIDNumber}.pdf`,
          { type: "application/pdf" }
        )
      );
    }
  }

  // Append the files array to the form data
  files.forEach((file) => formData.append("files", file));

  // Send FormData via fetch
  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Document upload failed: ${error.message || "Unknown error"}`
    );
  }

  return response.json();
};
