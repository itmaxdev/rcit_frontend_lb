// src/profilepageComponents/Popup.js
import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

import adminApprove from "../assets/approve.svg";
import adminReject from "../assets/reject.svg";
import userApprove from "../assets/approved.svg";

const Popup = ({ purpose, onClose, onAction }) => {
  const { t } = useTranslation();

  // Determine the content based on the purpose
  let img,
    headerText,
    subheaderText,
    actionText,
    cancelText = t("Cancel"),
    isRed = false,
    isColumn = false;
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
  }

  return (
    <Overlay>
      <PopupContainer>
        <SVG src={img} alt="Icon" />
        <Header>{headerText}</Header>
        <Subheader>{subheaderText}</Subheader>
        <ButtonsContainer isColumn={isColumn}>
          <CancelButton isColumn={isColumn} onClick={onClose}>
            {cancelText}
          </CancelButton>
          <ActionButton isColumn={isColumn} isRed={isRed} onClick={onAction}>
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
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 400px;
  width: 90%;
`;

const SVG = styled.img`
  height: 70px;
  margin-bottom: 20px;
`;

const Header = styled.h2`
  margin: 0;
  font-size: 26px;
  font-weight: 700;
`;

const Subheader = styled.p`
  margin: 10px 0 20px;
  font-size: 14px;
  font-weight: 400;
`;

const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: ${({ isColumn }) => (isColumn ? "column-reverse" : "row")};
  justify-content: space-around;
  gap: 10px;
  margin-top: 50px;
`;

const ActionButton = styled.button`
  padding: 10px 20px;
  border-radius: 38px;
  background: ${({ isRed }) => (isRed ? "#EC011A" : "#23863A")};
  color: white;
  font-size: 14px;
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
  padding: 10px 25px;
  border-radius: 38px;
  background: none;
  color: #20294c;
  border: 1px solid #20294c;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.3s ease;
  width: ${({ isColumn }) => (isColumn ? "100%" : "45%")};

  &:hover {
    opacity: 0.7;
  }
`;
