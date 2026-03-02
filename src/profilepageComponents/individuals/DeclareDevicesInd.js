// src/profilepageComponents/individuals/DeclareDevicesInd.js
import React, { useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom"; // to handle navigation
import { handleIMEI } from "../../functions/indDeclare";

import InputField from "../../sharedComponents/InputField";
import DeclareDevicesIndCard from "./DeclareDevicesIndCard";
import Popup from "../Popup";

import valid from "../../assets/valid.svg";
import invalid from "../../assets/invalid.svg";

const DeclareDevicesInd = () => {
  const { t } = useTranslation();
  const [validity, setValidity] = useState(null);
  const [errorText, setErrorText] = useState("");
  // const [maxDevices, ] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    numberIMEIs: "",
    date: "",
    IMEIs: [],
  });

  const navigate = useNavigate();

  const handleChange = (field) => (value) => {
    setValidity(null);
    setFormData((prev) => {
      if (field === "numberIMEIs") {
        const updatedIMEIs = prev.IMEIs.slice(0, Number(value));
        return {
          ...prev,
          [field]: value,
          IMEIs: updatedIMEIs,
        };
      }

      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleIMEIChange = (index) => (value) => {
    setValidity(null);
    const newIMEIs = [...formData.IMEIs];
    newIMEIs[index] = value;
    setFormData((prev) => ({
      ...prev,
      IMEIs: newIMEIs,
    }));
  };

  const isButtonDisabled =
    !formData.brand ||
    !formData.model ||
    !formData.numberIMEIs ||
    formData.IMEIs.slice(0, Number(formData.numberIMEIs)).some(
      (imei) => imei.trim() === ""
    ) ||
    formData.IMEIs.length !== Number(formData.numberIMEIs);

  const onCheckDevice = async () => {
    if (isButtonDisabled) return;

    const payload = {
      imeiList: formData.IMEIs.map((imei, index) => ({
        id: index,
        imeiNumber: imei,
      })),
      brand: formData.brand,
      model: formData.model,
      date: validity ? formData.date : formData.date.split("/").join("-"),
    };

    try {
      setLoading(true);

      if (!validity) {
        const response = await handleIMEI(payload, false);
        setLoading(false);
        if (response) {
          if (response.status === 409) {
            setValidity(false);
            setErrorText("DeviceInfo_MaxDevices")
          } else if (response.status === 400) {
            setErrorText(response.message?.indexOf("already") != -1 ? response.message : "DeviceInfo_Invalid")
            setValidity(false);
          } else {
            setValidity(true);
          }
        } else {
          setErrorText("DeviceInfo_Invalid")
          setValidity(false);
        }
      } else if (validity) {
        const response = await handleIMEI(payload, true);
        setLoading(false);

        if (response && response?.status == 200) {
          setPopupOpen(true);
        } else {
          setErrorText(response.message?.indexOf("already") != -1 ? response.message : "DeviceInfo_Invalid")
          setValidity(false);
        }
      }
    } catch (error) {
      console.error("Error checking device validity:", error);
      setLoading(false);
      setValidity(false);
      setErrorText("")
    }
  };

  const handlePopupClose = () => {
    setFormData({
      brand: "",
      model: "",
      numberIMEIs: "",
      date: "",
      IMEIs: [],
    });
    navigate("/profile/role_user/dashboard");
    setPopupOpen(false);
  };

  const handlePopupAction = () => {
    setFormData({
      brand: "",
      model: "",
      numberIMEIs: "",
      date: "",
      IMEIs: [],
    });
    setPopupOpen(false);
  };

  return (
    <DeclareDevicesIndContainer>
      <Title>{t("DeclareDevicesInd_Title")}</Title>
      <Subtext>{t("DeclareDevicesInd_SubText")}</Subtext>
      <Subheader>{t("DeclareDevicesInd_SubHeader")}</Subheader>
      <InputRow>
        <InputField
          defaultValue={formData.brand}
          fieldName="Input_Brand"
          changeValue={handleChange("brand")}
        />
        <InputField
          defaultValue={formData.model}
          fieldName="Input_Model"
          changeValue={handleChange("model")}
        />
      </InputRow>
      <InputRow>
        <InputField
          defaultValue={formData.numberIMEIs}
          fieldName="Input_NumberofIMEIs"
          validation={(value) => ["1", "2", "3", "4"].includes(value)}
          changeValue={handleChange("numberIMEIs")}
        />
        <InputField
          defaultValue={formData.date}
          fieldName="Input_Date"
          validation={(value) =>
            /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/.test(value)
          }
          changeValue={handleChange("date")}
        />
      </InputRow>
      {Array.from({ length: Math.ceil(Number(formData.numberIMEIs) / 2) }).map(
        (_, rowIndex) => (
          <InputRow key={rowIndex}>
            {[...Array(2)].map((_, index) => {
              const imeiIndex = rowIndex * 2 + index;
              return imeiIndex < Number(formData.numberIMEIs) ? (
                <InputField
                  key={imeiIndex}
                  defaultValue={formData.IMEIs[rowIndex]}
                  fieldName={`IMEI ${imeiIndex + 1}`}
                  validation={(value) => /^\d{15}$/.test(value)}
                  changeValue={handleIMEIChange(imeiIndex)}
                />
              ) : null;
            })}
          </InputRow>
        )
      )}

      <Validity validity={validity === null ? null : (validity ? "true" : "false")}>
        <SVG src={validity ? valid : invalid} alt="status icon" />
        {validity && t("DeviceInfo_Unregistered")}
        {!validity && t(errorText)}
      </Validity>

      <CheckButton
        disabled={isButtonDisabled || loading}
        onClick={onCheckDevice}
      >
        {loading
          ? t("Loading")
          : validity
            ? t("Declare")
            : t("DeclareDevicesInd_CheckDevice")}
      </CheckButton>
      <DeclareDevicesIndCard />

      {popupOpen && (
        <Popup
          purpose="userDeclare"
          onClose={() => handlePopupClose()}
          onAction={() => handlePopupAction()}
          actionText={t("Popup_CloseButton")}
        />
      )}
    </DeclareDevicesIndContainer>
  );
};

export default DeclareDevicesInd;

const DeclareDevicesIndContainer = styled.div`
  display: flex;
  width: 90%;
  height: 100%;
  flex-direction: column;
  padding: 50px 0 0 0;
  align-items: start;

  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: #1672c0;
  margin-bottom: 10px;
`;

const Subtext = styled.p`
  font-size: 16px;
  margin-bottom: 30px;
`;

const Subheader = styled.div`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 10px;
`;

const InputRow = styled.div`
  display: flex;
  margin-bottom: 20px;
  gap: 50px;
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
    margin-bottom: 20px;
  }
`;

const Validity = styled.div`
  display: ${({ validity }) => (validity === null ? "none" : "flex")};
  align-items: center;
  gap: 10px;
  font-size: 16px;
  border-radius: 14px;
  padding: 10px;
  margin: 15px 0;
  background-color: ${({ validity }) =>
    validity == "true" ? "rgba(0, 149, 63, 0.05)" : "rgba(255, 0, 0, 0.05)"};
  color: ${({ validity }) => (validity == "true" ? "#00953F" : "#FF0000")};
`;

const SVG = styled.img`
  width: 20px;
`;

const CheckButton = styled.button`
  margin-bottom: auto;
  padding: 15px 50px;
  border-radius: 38px;
  background: ${({ disabled }) => (disabled ? "#d3d3d3" : "#1672c0")};
  color: white;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  transition: opacity 0.3s ease;
  opacity: ${({ disabled }) => (disabled ? "0.5" : "1")};
  transition: all 0.3s ease;

  &:hover {
    opacity: ${({ disabled }) => (disabled ? "0.5" : "0.7")};
  }
`;
