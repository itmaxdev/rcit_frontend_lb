// src/sharedComponents/DocumentUpload.js
import React, { useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

import documentIcon from "../assets/document.svg";
import xcircle from "../assets/xcircle.svg";
import upload from "../assets/upload.svg";

const DocumentUpload = ({ fieldName, changeDocument, defaultValue = null }) => {
  const { t } = useTranslation();
  const [uploadedFile, setUploadedFile] = useState(defaultValue);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setUploadedFile(file);
      changeDocument(file);
    } else {
      global.alert2(t("Invalid_File_Type"));
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    changeDocument(null);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setUploadedFile(file);
      changeDocument(file);
    } else {
      global.alert2(t("Invalid_File_Type"));
    }
  };

  return (
    <DocumentUploadContainer>
      <FieldName>{t(fieldName)}</FieldName>
      <UploadWrapper
        onClick={() => document.getElementById(fieldName).click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        uploaded={uploadedFile}
      >
        {uploadedFile ? (
          <FileInfo>
            <img src={documentIcon} alt="Document icon" />
            <FileDetails>
              <FileName>{uploadedFile.name}</FileName>
              <FileSize>{(uploadedFile.size / 1024).toFixed(2)} KBs</FileSize>
            </FileDetails>
            <RemoveIcon
              src={xcircle}
              alt="Remove file"
              onClick={handleRemoveFile}
            />
          </FileInfo>
        ) : (
          <Placeholder>
            <img src={upload} alt="Upload icon" />
            <PlaceholderText>{t("Document_Upload")}</PlaceholderText>
          </Placeholder>
        )}
      </UploadWrapper>
      <input
        type="file"
        id={fieldName}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      {!uploadedFile && <Message>{t("Document_MaxSize")}</Message>}
    </DocumentUploadContainer>
  );
};

export default DocumentUpload;

const DocumentUploadContainer = styled.div`
  display: flex;
  flex: 1;
  width: 100%;
  flex-direction: column;
  gap: 7px;
`;

const FieldName = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #797f94;
`;

const UploadWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${({ uploaded }) => (uploaded ? "flex-start" : "center")};
  border: ${({ uploaded }) => (uploaded ? "none" : "2px dashed #d3d3d3")};
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  background-color: ${({ uploaded }) => (uploaded ? "transparent" : "#f9f9f9")};
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ uploaded }) =>
      uploaded ? "transparent" : "#f1f1f1"};
  }
`;

const Placeholder = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PlaceholderText = styled.span`
  font-size: 16px;
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FileDetails = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const FileName = styled.span`
  font-size: 14px;
  font-weight: 700;
  text-decoration-line: underline;
`;

const FileSize = styled.span`
  font-size: 12px;
  color: #797f94;
`;

const RemoveIcon = styled.img`
  cursor: pointer;
  width: 20px;
`;

const Message = styled.div`
  font-size: 12px;
  color: #797f94;
  height: 16px;
`;
