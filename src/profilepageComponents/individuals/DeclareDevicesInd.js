import React, { useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { handleIMEI } from "../../functions/indDeclare";
import { searchBrands, searchModels } from "../../functions/catalog";

import AutocompleteField from "../../sharedComponents/AutocompleteField";
import DateField from "../../sharedComponents/DateField";
import IMEIInput from "../../sharedComponents/IMEIInput";
import DeclareDevicesIndCard from "./DeclareDevicesIndCard";
import Popup from "../Popup";

import valid from "../../assets/valid.svg";
import invalid from "../../assets/invalid.svg";
import xcircle from "../../assets/xcircle.svg";

const MAX_DEVICES = 4;
const IMEI_REGEX = /^\d{15}$/;
const DECLARED_VALUE_REGEX = /^[1-9]\d*$/;

const createEmptyDevice = () => ({
  brand: "",
  brandId: "",
  model: "",
  date: "",
  declaredValue: "",
  imei: "",
});

const EMPTY_FORM = {
  devices: [createEmptyDevice()],
};

const DeclareDevicesInd = () => {
  const { t } = useTranslation();
  const [validity, setValidity] = useState(null);
  const [errorText, setErrorText] = useState("");
  const [loading, setLoading] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [submittedDeclarationId, setSubmittedDeclarationId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const navigate = useNavigate();

  const resetValidation = () => {
    setValidity(null);
    setErrorText("");
  };

  const updateDevice = (index, updater) => {
    resetValidation();
    setFormData((prev) => ({
      ...prev,
      devices: prev.devices.map((device, deviceIndex) =>
        deviceIndex === index ? updater(device) : device
      ),
    }));
  };

  const handleBrandChange = (index) => (value) => {
    updateDevice(index, (device) => ({
      ...device,
      brand: value,
      brandId: "",
      model: "",
    }));
  };

  const handleBrandSelect = (index) => (item) => {
    updateDevice(index, (device) => ({
      ...device,
      brand: item.name,
      brandId: item.id,
    }));
  };

  const handleModelChange = (index) => (value) => {
    updateDevice(index, (device) => ({ ...device, model: value }));
  };

  const handleDateChange = (index) => (value) => {
    updateDevice(index, (device) => ({ ...device, date: value }));
  };

  const handleDeclaredValueChange = (index) => (value) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 9);
    updateDevice(index, (device) => ({ ...device, declaredValue: digitsOnly }));
  };

  const handleIMEIChange = (index) => (value) => {
    updateDevice(index, (device) => ({ ...device, imei: value }));
  };

  const addDevice = () => {
    resetValidation();
    setFormData((prev) =>
      prev.devices.length >= MAX_DEVICES
        ? prev
        : { ...prev, devices: [...prev.devices, createEmptyDevice()] }
    );
  };

  const removeDevice = (index) => {
    resetValidation();
    setFormData((prev) => {
      if (prev.devices.length <= 1) {
        return prev;
      }
      return {
        ...prev,
        devices: prev.devices.filter((_, deviceIndex) => deviceIndex !== index),
      };
    });
  };

  const isDeviceComplete = (device) =>
    device.brand.trim() &&
    device.model.trim() &&
    device.date &&
    DECLARED_VALUE_REGEX.test(device.declaredValue) &&
    IMEI_REGEX.test(device.imei.trim());

  const isButtonDisabled =
    formData.devices.length === 0 ||
    formData.devices.length > MAX_DEVICES ||
    formData.devices.some((device) => !isDeviceComplete(device));

  const buildPayload = () => ({
    devices: formData.devices.map((device) => ({
      brand: device.brand.trim(),
      model: device.model.trim(),
      date: device.date,
      declaredValue: Number(device.declaredValue),
      imeiNumber: device.imei.trim(),
    })),
  });

  const onCheckDevice = async () => {
    if (isButtonDisabled) return;

    const payload = buildPayload();

    try {
      setLoading(true);

      if (!validity) {
        const response = await handleIMEI(payload, false);
        setLoading(false);
        if (response) {
          if (response.status === 409) {
            setValidity(false);
            setErrorText("DeviceInfo_MaxDevices");
          } else if (response.status === 400) {
            setErrorText(response.message || "DeviceInfo_Invalid");
            setValidity(false);
          } else {
            setValidity(true);
            setErrorText("");
          }
        } else {
          setErrorText("DeviceInfo_Invalid");
          setValidity(false);
        }
      } else {
        const response = await handleIMEI(payload, true);
        setLoading(false);
        if (response?.masterStatus === "OK") {
          setSubmittedDeclarationId(response.declarationId || null);
          setPopupOpen(true);
          setValidity(null);
          setErrorText("");
        } else {
          setErrorText(response?.masterMessage || "DeviceInfo_Invalid");
          setValidity(false);
        }
      }
    } catch (error) {
      console.error("Error in individual declaration flow:", error);
      setLoading(false);
      setValidity(false);
      setErrorText("DeviceInfo_Invalid");
    }
  };

  const handlePopupClose = () => {
    setFormData(EMPTY_FORM);
    setSubmittedDeclarationId(null);
    setPopupOpen(false);
  };

  const handlePopupAction = () => {
    const targetId = submittedDeclarationId;
    setFormData(EMPTY_FORM);
    setSubmittedDeclarationId(null);
    setPopupOpen(false);
    if (targetId) {
      navigate(`/profile/role_user/DeclareDevices/${targetId}`);
    } else {
      navigate("/profile/role_user/DeclareDevices");
    }
  };

  return (
    <DeclareDevicesIndContainer>
      <Title>{t("DeclareDevicesInd_Title")}</Title>
      <Subtext>{t("DeclareDevicesInd_SubText")}</Subtext>

      {formData.devices.map((device, index) => (
        <DeviceSection key={`device-${index}`}>
          <DeviceSectionHeader>
            <DeviceSectionTitle>
              {t("DeclareDevicesInd_SubHeader")} {index + 1}
            </DeviceSectionTitle>
            {formData.devices.length > 1 && (
              <RemoveButton
                type="button"
                onClick={() => removeDevice(index)}
                title={t("DeclareDevicesInd_RemoveIMEI")}
              >
                <RemoveIcon src={xcircle} alt="remove" />
              </RemoveButton>
            )}
          </DeviceSectionHeader>

          <InputRow>
            <AutocompleteField
              fieldName="Input_Brand"
              value={device.brand}
              fetchSuggestions={searchBrands}
              changeValue={handleBrandChange(index)}
              onSelect={handleBrandSelect(index)}
              minChars={1}
            />
            <AutocompleteField
              fieldName="Input_Model"
              value={device.model}
              fetchSuggestions={(query) => searchModels(query, device.brandId)}
              changeValue={handleModelChange(index)}
              minChars={3}
              noResultsText={
                device.brandId
                  ? "Autocomplete_NoResults"
                  : "Model_SelectBrandFirst"
              }
            />
          </InputRow>

          <InputRow>
            <DateField
              fieldName="DeclareDevicesInd_DeclarationDate"
              value={device.date}
              changeValue={handleDateChange(index)}
            />
            <DeclaredValueField
              label={t("Declared Value (USD)")}
              value={device.declaredValue}
              onChange={handleDeclaredValueChange(index)}
              invalidMessage={`${t("Invalid")} ${t("Declared Value")}`}
            />
          </InputRow>

          <SingleFieldRow>
            <IMEIInput
              value={device.imei}
              label={`IMEI ${index + 1}`}
              changeValue={handleIMEIChange(index)}
            />
          </SingleFieldRow>
        </DeviceSection>
      ))}

      {formData.devices.length < MAX_DEVICES && (
        <AddDeviceButton type="button" onClick={addDevice}>
          <PlusSign>+</PlusSign>
          {t("DeclareDevicesInd_AddIMEI")}
        </AddDeviceButton>
      )}

      <Validity validity={validity === null ? null : validity ? "true" : "false"}>
        <SVG src={validity ? valid : invalid} alt="status icon" />
        {validity && t("DeviceInfo_Unregistered")}
        {!validity && t(errorText)}
      </Validity>

      <CheckButton disabled={isButtonDisabled || loading} onClick={onCheckDevice}>
        {loading
          ? t("Loading")
          : validity
            ? t("Submit to Customs")
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

const DeclaredValueField = ({ label, value, onChange, invalidMessage }) => {
  const isValid =
    value.length === 0 ? null : DECLARED_VALUE_REGEX.test(value.trim());

  return (
    <DeclaredValueContainer>
      <FieldName>{label}</FieldName>
      <DeclaredValueWrapper $isValid={isValid}>
        <DeclaredValueInput
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </DeclaredValueWrapper>
      <DeclaredValueMessage $isValid={isValid}>
        {isValid === false ? invalidMessage : ""}
      </DeclaredValueMessage>
    </DeclaredValueContainer>
  );
};

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
  color: #436c4d;
  margin-bottom: 10px;
`;

const Subtext = styled.p`
  font-size: 16px;
  margin-bottom: 30px;
`;

const DeviceSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
`;

const DeviceSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const DeviceSectionTitle = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #20294c;
`;

const InputRow = styled.div`
  display: flex;
  margin-bottom: 12px;
  gap: 50px;
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
    margin-bottom: 16px;
  }
`;

const SingleFieldRow = styled.div`
  width: 100%;
  margin-bottom: 8px;
`;

const RemoveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  opacity: 0.6;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
`;

const RemoveIcon = styled.img`
  width: 20px;
  height: 20px;
`;

const AddDeviceButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  margin: 4px 0 16px;
  padding: 0;
  background: none;
  border: none;
  color: #436c4d;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.75;
  }
`;

const PlusSign = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #436c4d;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
`;

const DeclaredValueContainer = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 4px;
`;

const FieldName = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: #797f94;
`;

const DeclaredValueWrapper = styled.div`
  display: flex;
  align-items: center;
  border-bottom: 1.5px solid
    ${({ $isValid }) => {
      if ($isValid === null) return "#20294c";
      return $isValid ? "#00953F" : "#EC011A";
    }};

  &:focus-within {
    border-bottom-color: #436c4d;
  }
`;

const DeclaredValueInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  font-weight: 500;
  padding: 4px 0px;
  background: none;
  color: #20294c;
  caret-color: #436c4d;
  font-family: "Lato", sans-serif;

  &::placeholder {
    color: #c6cace;
    font-weight: 500;
    font-family: "Lato", sans-serif;
  }
`;

const DeclaredValueMessage = styled.div`
  font-size: 12px;
  color: ${({ $isValid }) => ($isValid ? "#00953F" : "#EC011A")};
  height: 16px;
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
    validity === "true" ? "rgba(0, 149, 63, 0.05)" : "rgba(255, 0, 0, 0.05)"};
  color: ${({ validity }) => (validity === "true" ? "#00953F" : "#FF0000")};
`;

const SVG = styled.img`
  width: 20px;
`;

const CheckButton = styled.button`
  margin-bottom: auto;
  padding: 15px 50px;
  border-radius: 38px;
  background: ${({ disabled }) => (disabled ? "#d3d3d3" : "#436C4D")};
  color: white;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  opacity: ${({ disabled }) => (disabled ? "0.5" : "1")};
  transition: all 0.3s ease;

  &:hover {
    opacity: ${({ disabled }) => (disabled ? "0.5" : "0.7")};
  }
`;
