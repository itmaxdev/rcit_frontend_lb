// src/profilepageComponents/Profile.js
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { fetchUser } from "../functions/profile";

import InputField from "../sharedComponents/InputField";
import AdminDocumentUpload from "./admins/AdminDocumentUpload";

const basicFormData = {
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

const Profile = () => {
  const { t } = useTranslation();

  const fetchData = async () => {
    const data = await fetchUser();
    setFormData(data || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [formData, setFormData] = useState(basicFormData);

  return (
    <ProfileContainer>
      <Header>
        <NameContainer>
          <Name>
            {formData.firstName} {formData.lastName}
          </Name>
          <AccountType>
            / {formData.roles[0] === "ROLE_USER" ? "User" : "Importer"}
          </AccountType>
          <StatusBadge status={formData.status}>
            {t(formData.status)}
          </StatusBadge>
        </NameContainer>
      </Header>

      <InfoBlock selected>
        <Subheader>{t("SignupPage_Personal")}</Subheader>

        <InputRow>
          <InputField
            fieldName="Input_FirstName"
            defaultValue={formData.firstName}
            validation={(value) => /^[\p{L} ]+$/u.test(value)}
            errorMessage={t("Error_Name")}
            readOnly
          />
          <InputField
            fieldName="Input_LastName"
            defaultValue={formData.lastName}
            validation={(value) => /^[\p{L} ]+$/u.test(value)}
            errorMessage={t("Error_Name")}
            readOnly
          />
        </InputRow>
        <InputRow>
          <InputField
            fieldName="Input_Email"
            validation={(value) =>
              /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)
            }
            defaultValue={formData.email}
            errorMessage={t("Error_Email")}
            readOnly
          />
          <InputField
            fieldName="Input_PhoneNumber"
            validation={(value) =>
              /^\+(\d{1,3})[\s-]?\(?(\d{1,4})\)?[\s-]?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,4}$/.test(
                value
              )
            }
            defaultValue={formData.phoneNumber}
            errorMessage={t("Error_Phone")}
            readOnly
          />
        </InputRow>
      </InfoBlock>
      <InfoBlock selected={formData.roles[0] === "ROLE_USER"}>
        <Subheader>{t("SignupPage_Additional")}</Subheader>
        <InputRow>
          <InputField
            fieldName="Input_NationalIDNumber"
            defaultValue={formData.userNationalIdNumber}
            validation={(value) => /^\d+$/.test(value)}
            errorMessage={t("Error_Number")}
            readOnly
          />
          <InputField
            fieldName="Input_NIUNumber"
            defaultValue={formData.nuID}
            validation={(value) => /^\d+$/.test(value)}
            errorMessage={t("Error_Number")}
            readOnly
          />
        </InputRow>
        <InputRow>
          <AdminDocumentUpload
            fieldName={"Document_IDDocument"}
            defaultValue={
              formData.documents && formData.documents.length > 0
                ? formData.documents[0]
                : null
            }
            readOnly
          />
        </InputRow>
      </InfoBlock>
      <InfoBlock selected={formData.roles[0] === "ROLE_IMPORTER"}>
        <Subheader>{t("SignupPage_Company")}</Subheader>
        <InputRow>
          <InputField
            fieldName="Input_NationalIDNumber"
            defaultValue={formData.userNationalIdNumber}
            validation={(value) => /^\d+$/.test(value)}
            errorMessage={t("Error_Number")}
            readOnly
          />
          <InputField
            fieldName="Input_CompanyName"
            defaultValue={formData.companyName}
            readOnly
          />
        </InputRow>
        <InputRow>
          <InputField
            fieldName="Input_CompanyRegistrationNumber"
            validation={(value) => /^\d+$/.test(value)}
            defaultValue={formData.companyRegistrationNumber}
            errorMessage={t("Error_Number")}
            readOnly
          />
          <InputField
            fieldName="Input_CompanyOwnerName"
            defaultValue={formData.companyOwnerName}
            validation={(value) => /^[\p{L} ]+$/u.test(value)}
            errorMessage={t("Error_Name")}
            readOnly
          />
        </InputRow>
        <InputRow>
          <InputField
            fieldName="Input_CompanyOwnerNationalIDNumber"
            validation={(value) => /^\d+$/.test(value)}
            defaultValue={formData.companyOwnerNationalIDNumber}
            errorMessage={t("Error_Number")}
            readOnly
          />
          <InputField
            fieldName="Input_CompanyAddress"
            defaultValue={formData.companyAddress}
            readOnly
          />
        </InputRow>
        <InputRow>
          <AdminDocumentUpload
            fieldName={"Document_CompanyRegistrationDocument"}
            defaultValue={
              formData.documents && formData.documents.length > 0
                ? formData.documents[0]
                : null
            }
            readOnly
          />
          <AdminDocumentUpload
            fieldName={"Document_CompanyOwnerNationalID"}
            defaultValue={
              formData.documents && formData.documents.length > 0
                ? formData.documents[1]
                : null
            }
            readOnly
          />
        </InputRow>
      </InfoBlock>
    </ProfileContainer>
  );
};

export default Profile;

const ProfileContainer = styled.div`
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
  color: #23863A;
`;

const AccountType = styled.h1`
  font-size: 20px;
  font-weight: 400;
  color: #23863A;
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
