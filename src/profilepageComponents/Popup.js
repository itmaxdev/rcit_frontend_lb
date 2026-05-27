// src/profilepageComponents/Popup.js
import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

import adminApprove from "../assets/approve.svg";
import adminReject from "../assets/reject.svg";
import userApprove from "../assets/approved.svg";
import reject2SVG from "../assets/reject2.svg";

const Popup = ({ data, purpose, onClose, onAction, reason, onReasonChange, reasonError, busy }) => {
  const { t } = useTranslation();

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
    img = reject2SVG;
    headerText = t("Are you sure do you want reject this declaration?");
    actionText = busy ? t("Rejecting...") : t("Reject");
    isRed = true;
    isColumn = true;
    isBlueHeader = true;
  }

  return (
    <Overlay>
      <PopupContainer $wide={purpose === "rejectDeclaration"}>
        <SVG src={img} alt="Icon" />
        <Header $isBlue={isBlueHeader}>{headerText}</Header>
        {subheaderText && <Subheader>{subheaderText}</Subheader>}

        {purpose === "rejectDeclaration" && (
          <ReasonBlock>
            <ReasonLabel>
              {t("Rejection Reason")} <RequiredStar>*</RequiredStar>
            </ReasonLabel>
            <ReasonHint>{t("Add Reason")}</ReasonHint>
            <ReasonTextarea
              placeholder={t("Reason goes here")}
              value={reason || ""}
              onChange={onReasonChange}
              rows={4}
            />
            {reasonError && <ReasonError>{reasonError}</ReasonError>}
          </ReasonBlock>
        )}

        <ButtonsContainer isColumn={isColumn}>
          <CancelButton isColumn={isColumn} onClick={onClose}>
            {cancelText}
          </CancelButton>
          <ActionButton
            isColumn={isColumn}
            isRed={isRed}
            onClick={onAction}
            disabled={busy || (purpose === "rejectDeclaration" && !reason?.trim())}
          >
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
  padding: 40px 36px 36px;
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: ${({ $wide }) => ($wide ? "540px" : "400px")};
  width: 90%;
`;

const SVG = styled.img`
  height: 120px;
  margin-bottom: 20px;
`;

const Header = styled.h2`
  margin: 0;
  font-size: ${({ $isBlue }) => ($isBlue ? "28px" : "40px")};
  font-weight: 800;
  line-height: 1.35;
  color: ${({ $isBlue }) => ($isBlue ? "#2671d9" : "#436C4D")};
`;

const Subheader = styled.p`
  margin: 15px 0 20px;
  font-size: 18px;
  font-weight: 400;
`;

const ReasonBlock = styled.div`
  margin-top: 20px;
  text-align: left;
`;

const ReasonLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 700;
  color: #1d2025;
  margin-bottom: 6px;
`;

const RequiredStar = styled.span`
  color: #e03d3d;
`;

const ReasonHint = styled.span`
  display: block;
  font-size: 13px;
  color: #6f7897;
  margin-bottom: 8px;
`;

const ReasonTextarea = styled.textarea`
  width: 100%;
  border: 1px solid #d4d6df;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  color: #1d2025;
  outline: none;
  resize: none;
  min-height: 110px;
  font-family: inherit;
  box-sizing: border-box;

  &:focus {
    border-color: #2671d9;
  }

  &::placeholder {
    color: #b0b5c9;
  }
`;

const ReasonError = styled.p`
  margin: 8px 0 0;
  font-size: 13px;
  color: #e03d3d;
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

  &:hover {
    opacity: 0.7;
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
