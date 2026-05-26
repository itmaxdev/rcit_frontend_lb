// src/profilepageComponents/Popup.js
import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

import adminApprove from "../assets/approve.svg";
import adminReject from "../assets/reject.svg";
import userApprove from "../assets/approved.svg";

const Popup = ({ data, purpose, onClose, onAction, reasonValue, onReasonChange, disabled }) => {
  const { t } = useTranslation();

  // Determine the content based on the purpose
  let img,
    headerText,
    subheaderText,
    actionText,
    cancelText = t("Cancel"),
    isRed = false,
    isColumn = false,
    isBlueHeader = false;
  if (purpose === "approve") {
    img = adminApprove;
    headerText = t("Approve Request");
    subheaderText = t("Are you sure you want to approve this request?");
    actionText = t("Approve");
  } else if (purpose === "reject") {
    img = adminReject;
    headerText = t("Reject Request");
    subheaderText = t("Are you sure you want to reject this request?");
    actionText = t("Reject");
    isRed = true;
  } else if (purpose === "disable") {
    img = adminReject;
    headerText = t("Reject Request");
    subheaderText = t("Are you sure you want to reject this request?");
    actionText = t("Reject");
    isRed = true;
  } else if (purpose === "edit") {
    img = adminApprove;
    headerText = t("Confirm Edit");
    subheaderText = t("Are you sure you want to edit this user?");
    actionText = t("Confirm");
  } else if (purpose === "userDeclare") {
    img = userApprove;
    headerText = t("Congratulations!");
    subheaderText = t(
      "Your device have been successfully declared. Note that you can declare up to 3 devices."
    );
    actionText = t("Declare a new device");
    cancelText = t("Go to dashboard");
    isColumn = true;
  } else if (purpose === "submitDevicesSuccess") {
    img = userApprove;
    headerText = t("Submitted Successfully!");
    subheaderText = <span><b>{t("Your $ uploaded devices").replace("$", data.devices)}</b>{" " + t("from the file document have been successfully submitted.")}</span>
    actionText = t("Track Devices Status");
    cancelText = t("Go to dashboard");
    isColumn = true;
  } else if (purpose === "rejectDeclaration") {
    img = adminReject;
    headerText = t("Are you sure do you want reject this declaration?");
    subheaderText = null;
    actionText = t("Reject");
    isRed = true;
    isColumn = true;
    isBlueHeader = true;
  }

  return (
    <Overlay>
      <PopupContainer>
        <SVG src={img} alt="Icon" />
        <Header isBlue={isBlueHeader}>{headerText}</Header>
        {subheaderText && <Subheader>{subheaderText}</Subheader>}
        {purpose === "rejectDeclaration" && onReasonChange && (
          <ReasonSection>
            <ReasonLabel>
              {t("Rejection Reason")}
              <ReasonRequired> *</ReasonRequired>
            </ReasonLabel>
            <ReasonSubLabel>{t("Add Reason")}</ReasonSubLabel>
            <ReasonTextarea
              value={reasonValue || ""}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder={t("Reason goes here")}
              rows={4}
            />
          </ReasonSection>
        )}
        <ButtonsContainer isColumn={isColumn}>
          <CancelButton isColumn={isColumn} onClick={onClose}>
            {cancelText}
          </CancelButton>
          <ActionButton isColumn={isColumn} isRed={isRed} onClick={onAction} disabled={disabled}>
            {actionText}
          </ActionButton>
        </ButtonsContainer>
      </PopupContainer>
    </Overlay>
  );
};

export default Popup;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5); /* Greys out the background */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const PopupContainer = styled.div`
  background: white;
  padding: 50px;
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 400px;
  width: 90%;
`;

const SVG = styled.img`
  height: 150px;
  margin-bottom: 20px;
`;

const Header = styled.h2`
  margin: 0;
  font-size: ${({ isBlue }) => (isBlue ? "28px" : "40px")};
  font-weight: 800;
  color: ${({ isBlue }) => (isBlue ? "#2671d9" : "#436C4D")};
`;

const Subheader = styled.p`
  margin: 15px 0 20px;
  font-size: 18px;
  font-weight: 400;
`;

const ReasonSection = styled.div`
  width: 100%;
  text-align: left;
  margin: 20px 0 4px;
`;

const ReasonLabel = styled.p`
  font-size: 15px;
  font-weight: 700;
  color: #1d2025;
  margin: 0 0 4px;
`;

const ReasonRequired = styled.span`
  color: #ec011a;
`;

const ReasonSubLabel = styled.p`
  font-size: 13px;
  color: #6f7897;
  margin: 0 0 8px;
`;

const ReasonTextarea = styled.textarea`
  width: 100%;
  border: 1px solid #d4d6df;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  color: #1d2025;
  font-family: inherit;
  resize: vertical;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: #2671d9;
  }

  &::placeholder {
    color: #b0b5c9;
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: ${({ isColumn }) => (isColumn ? "column-reverse" : "row")};
  justify-content: space-around;
  gap: 10px;
  margin-top: 50px;
`;

const ActionButton = styled.button`
  padding: ${({ isColumn }) => (isColumn ? "13px 20px" : "10px 20px")};
  border-radius: 38px;
  background: ${({ isRed }) => (isRed ? "#EC011A" : "#436C4D")};
  color: white;
  font-size: 15px;
  font-weight: 400;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  width: ${({ isColumn }) => (isColumn ? "100%" : "45%")};

  &:hover:not(:disabled) {
    opacity: 0.7;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  padding: ${({ isColumn }) => (isColumn ? "11px 20px" : "10px 20px")};
  border-radius: 38px;
  background: none;
  color: #20294c;
  border: 1px solid #20294c;
  font-size: 15px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.3s ease;
  width: ${({ isColumn }) => (isColumn ? "100%" : "45%")};

  &:hover {
    opacity: 0.7;
  }
`;
