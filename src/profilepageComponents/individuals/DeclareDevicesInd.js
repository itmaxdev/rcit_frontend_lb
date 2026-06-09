// src/profilepageComponents/individuals/DeclareDevicesInd.js
import React, { useState, useCallback } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom"; // to handle navigation
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

const MAX_IMEIS = 4;
const IMEI_REGEX = /^\d{15}$/;

const EMPTY_FORM = {
  brand: "",
  brandId: "",
  model: "",
  date: "",
  IMEIs: [""],
};

const DeclareDevicesInd = () => {
  const { t } = useTranslation();
  const [validity, setValidity] = useState(null);
  const [errorText, setErrorText] = useState("");
  const [loading, setLoading] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const navigate = useNavigate();

  // Selecting a brand changes which models are valid, so the model is reset.
  const handleBrandChange = (value) => {
    setValidity(null);
    setFormData((prev) => ({ ...prev, brand: value, brandId: "", model: "" }));
  };

  const handleBrandSelect = (item) => {
    setValidity(null);
    setFormData((prev) => ({ ...prev, brand: item.name, brandId: item.id }));
  };

  const handleModelChange = (value) => {
    setValidity(null);
    setFormData((prev) => ({ ...prev, model: value }));
  };

  const handleDateChange = (value) => {
    setValidity(null);
    setFormData((prev) => ({ ...prev, date: value }));
  };

  const handleIMEIChange = (index) => (value) => {
    setValidity(null);
    setFormData((prev) => {
      const IMEIs = [...prev.IMEIs];
      IMEIs[index] = value;
      return { ...prev, IMEIs };
    });
  };

  const addIMEI = () => {
    setValidity(null);
    setFormData((prev) =>
      prev.IMEIs.length >= MAX_IMEIS
        ? prev
        : { ...prev, IMEIs: [...prev.IMEIs, ""] }
    );
  };

  const removeIMEI = (index) => {
    setValidity(null);
    setFormData((prev) => {
      if (prev.IMEIs.length <= 1) return prev;
      return { ...prev, IMEIs: prev.IMEIs.filter((_, i) => i !== index) };
    });
  };

  const fetchModels = useCallback(
    (query) => searchModels(query, formData.brandId),
    [formData.brandId]
  );

  const isButtonDisabled =
    !formData.brand ||
    !formData.model ||
    !formData.date ||
    formData.IMEIs.length === 0 ||
    formData.IMEIs.some((imei) => !IMEI_REGEX.test(imei.trim()));

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
            setErrorText("DeviceInfo_MaxDevices");
          } else if (response.status === 400) {
            setErrorText(
              response.message?.indexOf("already") != -1
                ? response.message
                : "DeviceInfo_Invalid"
            );
            setValidity(false);
          } else {
            setValidity(true);
          }
        } else {
          setErrorText("DeviceInfo_Invalid");
          setValidity(false);
        }
      } else if (validity) {
        const response = await handleIMEI(payload, true);
        setLoading(false);

        if (response && response?.status == 200) {
          setPopupOpen(true);
        } else {
          setErrorText(
            response.message?.indexOf("already") != -1
              ? response.message
              : "DeviceInfo_Invalid"
          );
          setValidity(false);
        }
      }
    } catch (error) {
      console.error("Error checking device validity:", error);
      setLoading(false);
      setValidity(false);
      setErrorText("");
    }
  };

  const handlePopupClose = () => {
    setFormData(EMPTY_FORM);
    navigate("/profile/role_user/dashboard");
    setPopupOpen(false);
  };

  const handlePopupAction = () => {
    setFormData(EMPTY_FORM);
    setPopupOpen(false);
  };

  return (
    <DeclareDevicesIndContainer>
      <Title>{t("DeclareDevicesInd_Title")}</Title>
      <Subtext>{t("DeclareDevicesInd_SubText")}</Subtext>
      <Subheader>{t("DeclareDevicesInd_SubHeader")}</Subheader>
      <InputRow>
        <AutocompleteField
          fieldName="Input_Brand"
          value={formData.brand}
          fetchSuggestions={searchBrands}
          changeValue={handleBrandChange}
          onSelect={handleBrandSelect}
          minChars={1}
        />
        <AutocompleteField
          fieldName="Input_Model"
          value={formData.model}
          fetchSuggestions={fetchModels}
          changeValue={handleModelChange}
          minChars={3}
          noResultsText={
            formData.brandId ? "Autocomplete_NoResults" : "Model_SelectBrandFirst"
          }
        />
      </InputRow>
      <InputRow>
        <DateField
          fieldName="Input_Date"
          value={formData.date}
          changeValue={handleDateChange}
        />
        <Spacer />
      </InputRow>

      <IMEISectionLabel>{t("DeclareDevicesInd_IMEIsLabel")}</IMEISectionLabel>
      {Array.from({ length: Math.ceil(formData.IMEIs.length / 2) }).map(
        (_, rowIndex) => (
          <InputRow key={rowIndex}>
            {[0, 1].map((col) => {
              const imeiIndex = rowIndex * 2 + col;
              if (imeiIndex >= formData.IMEIs.length) {
                return <Spacer key={col} />;
              }
              return (
                <IMEIItem key={imeiIndex}>
                  <IMEIInput
                    value={formData.IMEIs[imeiIndex]}
                    label={`IMEI ${imeiIndex + 1}`}
                    changeValue={handleIMEIChange(imeiIndex)}
                  />
                  {formData.IMEIs.length > 1 && (
                    <RemoveButton
                      type="button"
                      onClick={() => removeIMEI(imeiIndex)}
                      title={t("DeclareDevicesInd_RemoveIMEI")}
                    >
                      <RemoveIcon src={xcircle} alt="remove" />
                    </RemoveButton>
                  )}
                </IMEIItem>
              );
            })}
          </InputRow>
        )
      )}

      {formData.IMEIs.length < MAX_IMEIS && (
        <AddIMEIButton type="button" onClick={addIMEI}>
          <PlusSign>+</PlusSign>
          {t("DeclareDevicesInd_AddIMEI")}
        </AddIMEIButton>
      )}

      <Validity validity={validity === null ? null : validity ? "true" : "false"}>
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
  color: #436c4d;
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

const Spacer = styled.div`
  width: 100%;

  @media (max-width: 768px) {
    display: none;
  }
`;

const IMEISectionLabel = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #20294c;
  margin-bottom: 14px;
`;

const IMEIItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
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

const AddIMEIButton = styled.button`
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
  background: ${({ disabled }) => (disabled ? "#d3d3d3" : "#436C4D")};
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
