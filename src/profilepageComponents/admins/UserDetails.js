// src/profilepageComponents/admins/UserDetails.js
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router-dom";
import { fetchUser, manageUserAction, updateUser } from "../../functions/admin";

import InputField from "../../sharedComponents/InputField";
import AdminDocumentUpload from "./AdminDocumentUpload";
import Popup from "../Popup";

import chevron from "../../assets/chevron-down.svg";

const initialFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  userNationalIdNumber: "",
  nuID: "",
  documentIDDocument: null,
  companyName: "",
  companyRegistrationNumber: "",
  companyOwnerName: "",
  companyOwnerNationalIDNumber: "",
  companyAddress: "",
  documentCompanyRegistrationDocument: null,
  documentCompanyOwnerNationalID: null,
  status: "",
  roles: "",
  documents: [],
};

const UserDetails = () => {
  const { t } = useTranslation();
  const { userId } = useParams();

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupPurpose, setPopupPurpose] = useState("");
  const [popupAction, setPopupAction] = useState(() => () => {});

  const fetchData = async () => {
    const data = await fetchUser(userId);
    setFormData(data || []);
    setOriginalData(data || {});
  };

  const handleAction = (purpose, actionFunction) => () => {
    setPopupPurpose(purpose);
    setPopupAction(() => actionFunction);
    setPopupVisible(true);
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const [originalData, setOriginalData] = useState(initialFormData);
  const [formData, setFormData] = useState(initialFormData);

  const hasChanges = () => {
    if (!originalData) return false;
    return Object.keys(formData).some(
      (key) => formData[key] !== originalData[key]
    );
  };

  const saveChanges = () => {
    if (hasChanges()) {
      setPopupPurpose("edit");
      setPopupAction(() => async () => {
        const success = await updateUser(userId, formData);
        if (success) {
          fetchData();
        }
      });
      setPopupVisible(true);
    }
  };

  const handleChange = (field) => (value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNumericChange = (field) => (value) => {
    const numericValue = value === "" ? 0 : parseInt(value, 10);
    setFormData((prev) => ({
      ...prev,
      [field]: numericValue,
    }));
  };

  return (
    <UserDetailsContainer>
      <Link to="/profile/role_admin/UserManagement">
        <BackButton>
          <Chevron src={chevron} alt="Chevron" />
          {t("UserManagement_Back")}
        </BackButton>
      </Link>

      <Header>
        <NameContainer>
          <Name>
            {originalData.firstName} {originalData.lastName}
          </Name>
          <AccountType>
            / {originalData.roles[0] === "ROLE_USER" ? "User" : "Importer"}
          </AccountType>
          <StatusBadge status={originalData.status}>
            {t(originalData.status)}
          </StatusBadge>
        </NameContainer>
        <ButtonsContainer>
          <RejectButton
            active={
              (originalData.status === "APPROVED" ||
                originalData.status === "REJECTED") &&
              !hasChanges()
            }
            onClick={handleAction("disable", () =>
              manageUserAction(userId, "disable")
            )}
          >
            {t("Disable")}
          </RejectButton>
          <RejectButton
            active={originalData.status === "PENDING" && !hasChanges()}
            onClick={handleAction("reject", () =>
              manageUserAction(userId, "reject")
            )}
          >
            {t("Reject")}
          </RejectButton>
          <ApproveButton
            active={originalData.status !== "APPROVED" && !hasChanges()}
            onClick={handleAction("approve", () =>
              manageUserAction(userId, "approve")
            )}
          >
            {t("Approve")}
          </ApproveButton>
          <SaveButton active={hasChanges()} onClick={saveChanges}>
            {t("Confirm Edits")}
          </SaveButton>
        </ButtonsContainer>
      </Header>

      <InfoBlock selected>
        <Subheader>{t("SignupPage_Personal")}</Subheader>

        <InputRow>
          <InputField
            fieldName="Input_FirstName"
            changeValue={handleChange("firstName")}
            defaultValue={formData.firstName}
            validation={(value) => /^[\p{L} ]+$/u.test(value)}
            errorMessage={t("Error_Name")}
          />
          <InputField
            fieldName="Input_LastName"
            changeValue={handleChange("lastName")}
            defaultValue={formData.lastName}
            validation={(value) => /^[\p{L} ]+$/u.test(value)}
            errorMessage={t("Error_Name")}
          />
        </InputRow>
        <InputRow>
          <InputField
            fieldName="Input_Email"
            validation={(value) =>
              /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)
            }
            changeValue={handleChange("email")}
            defaultValue={formData.email}
            errorMessage={t("Error_Email")}
          />
          <InputField
            fieldName="Input_PhoneNumber"
            validation={(value) =>
              /^\+(\d{1,3})[\s-]?\(?(\d{1,4})\)?[\s-]?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,4}$/.test(
                value
              )
            }
            changeValue={handleChange("phoneNumber")}
            defaultValue={formData.phoneNumber}
            errorMessage={t("Error_Phone")}
          />
        </InputRow>
      </InfoBlock>
      <InfoBlock selected={formData.roles[0] === "ROLE_USER"}>
        <Subheader>{t("SignupPage_Additional")}</Subheader>
        <InputRow>
          <InputField
            fieldName="Input_NationalIDNumber"
            changeValue={handleChange("userNationalIdNumber")}
            defaultValue={formData.userNationalIdNumber}
            validation={(value) => /^\d+$/.test(value)}
            errorMessage={t("Error_Number")}
          />
          <InputField
            fieldName="Input_NIUNumber"
            optional
            changeValue={handleChange("nuID")}
            defaultValue={formData.nuID}
            validation={(value) => /^\d+$/.test(value)}
            errorMessage={t("Error_Number")}
          />
        </InputRow>
        <InputRow>
          <AdminDocumentUpload
            fieldName={"Document_IDDocument"}
            changeDocument={handleChange("documentIDDocument")}
            defaultValue={
              formData.documents && formData.documents.length > 0
                ? formData.documents[0]
                : null
            }
          />
        </InputRow>
      </InfoBlock>
      <InfoBlock selected={formData.roles[0] === "ROLE_IMPORTER"}>
        <Subheader>{t("SignupPage_Company")}</Subheader>
        <InputRow>
          <InputField
            fieldName="Input_NationalIDNumber"
            changeValue={handleChange("userNationalIdNumber")}
            defaultValue={formData.userNationalIdNumber}
            validation={(value) => /^\d+$/.test(value)}
            errorMessage={t("Error_Number")}
          />
          <InputField
            fieldName="Input_CompanyName"
            changeValue={handleChange("companyName")}
            defaultValue={formData.companyName}
          />
        </InputRow>
        <InputRow>
          <InputField
            fieldName="Input_CompanyRegistrationNumber"
            validation={(value) => /^\d+$/.test(value)}
            changeValue={handleNumericChange("companyRegistrationNumber")}
            defaultValue={formData.companyRegistrationNumber}
            errorMessage={t("Error_Number")}
          />
          <InputField
            fieldName="Input_CompanyOwnerName"
            changeValue={handleChange("companyOwnerName")}
            defaultValue={formData.companyOwnerName}
            validation={(value) => /^[\p{L} ]+$/u.test(value)}
            errorMessage={t("Error_Name")}
          />
        </InputRow>
        <InputRow>
          <InputField
            fieldName="Input_CompanyOwnerNationalIDNumber"
            validation={(value) => /^\d+$/.test(value)}
            changeValue={handleNumericChange("companyOwnerNationalIDNumber")}
            defaultValue={formData.companyOwnerNationalIDNumber}
            errorMessage={t("Error_Number")}
          />
          <InputField
            fieldName="Input_CompanyAddress"
            changeValue={handleChange("companyAddress")}
            defaultValue={formData.companyAddress}
          />
        </InputRow>
        <InputRow>
          <AdminDocumentUpload
            fieldName={"Document_CompanyRegistrationDocument"}
            changeDocument={handleChange("documentCompanyRegistrationDocument")}
            defaultValue={
              formData.documents && formData.documents.length > 0
                ? formData.documents[0]
                : null
            }
          />
          <AdminDocumentUpload
            fieldName={"Document_CompanyOwnerNationalID"}
            changeDocument={handleChange("documentCompanyOwnerNationalID")}
            defaultValue={
              formData.documents && formData.documents.length > 0
                ? formData.documents[1]
                : null
            }
          />
        </InputRow>
      </InfoBlock>

      {popupVisible && (
        <Popup
          purpose={popupPurpose}
          onClose={() => setPopupVisible(false)}
          onAction={async () => {
            await popupAction();
            setPopupVisible(false);
            fetchData();
          }}
        />
      )}
    </UserDetailsContainer>
  );
};

export default UserDetails;

const UserDetailsContainer = styled.div`
  display: flex;
  width: 90%;
  height: calc(100vh - 75px);
  flex-direction: column;
  padding: 30px 0;
  align-items: start;

  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const BackButton = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
`;

const Chevron = styled.img`
  width: 14px;
  margin-top: 2px;
  transform: rotate(90deg);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 10px;
  padding: 20px 0;
`;

const Name = styled.h1`
  font-size: 20px;
  font-weight: 800;
  color: #436C4D;
`;

const AccountType = styled.h1`
  font-size: 20px;
  font-weight: 400;
  color: #436C4D;
`;

const StatusBadge = styled.span`
  padding: 7px 10px;
  border-radius: 40px;
  font-size: 14px;
  background-color: ${(props) =>
    props.status === "APPROVED"
      ? "rgba(0, 149, 63, 0.07)"
      : props.status === "PENDING"
      ? "rgba(252, 116, 19, 0.07)"
      : props.status === "REJECTED"
      ? "rgba(236, 1, 26, 0.07)"
      : props.status === "DISABLED"
      ? "#F7F7F7"
      : "transparent"};
  color: ${(props) =>
    props.status === "APPROVED"
      ? "#00953F"
      : props.status === "PENDING"
      ? "#FC7413"
      : props.status === "REJECTED"
      ? "#EC011A"
      : props.status === "DISABLED"
      ? "#9098A0"
      : "black"};
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const ApproveButton = styled.button`
  display: ${({ active }) => (active ? "block" : "none")};
  padding: 15px 25px;
  border-radius: 38px;
  background: #436C4D;
  color: white;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    opacity: 0.7;
  }
`;

const RejectButton = styled.button`
  display: ${({ active }) => (active ? "block" : "none")};
  padding: 15px 25px;
  border-radius: 38px;
  color: #ec011a;
  background: none;
  border: 1px solid #ec011a;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    opacity: 0.7;
  }
`;

const SaveButton = styled.button`
  display: ${({ active }) => (active ? "block" : "none")};
  padding: 15px 25px;
  border-radius: 38px;
  background: #436C4D;
  color: white;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    opacity: 0.7;
  }
`;

const Subheader = styled.div`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 10px;
`;

const InfoBlock = styled.div`
  display: ${({ selected }) => (selected ? "block" : "none")};
  width: 100%;
  padding: 24px;
  border-radius: 16px;
  background: var(--Light-grey-2, #f7f7f7);
  margin-bottom: 20px;
`;

const InputRow = styled.div`
  display: flex;
  margin-top: 30px;
  gap: 50px;
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
    margin-bottom: 20px;
  }
`;

const NameContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;
