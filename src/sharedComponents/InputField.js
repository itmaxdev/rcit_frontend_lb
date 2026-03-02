// src/sharedComponents/InputField.js
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

import eye from "../assets/eye.svg";

const InputField = ({
  fieldName,
  defaultValue = "",
  optional = false,
  isPassword = false,
  readOnly = false,
  validation = null,
  errorMessage = null,
  changeValue = () => {},
}) => {
  const { t } = useTranslation();
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [isValid, setIsValid] = useState(null);
  const [isFocused, setFocused] = useState(false);

  useEffect(() => {
    setValue(defaultValue);
    setIsValid(null);
  }, [defaultValue]);

  const handleInputChange = (e) => {
    if (readOnly) return;

    const newValue = e.target.value;
    setValue(newValue);
    if (isFocused) {
      setIsValid(null);
    }

    let validationStatus = null;

    if (validation) {
      if (optional && newValue === "") {
        validationStatus = null;
      } else {
        validationStatus = validation(newValue);
      }
    } else if (optional) {
      validationStatus = null;
    } else {
      validationStatus = newValue.trim() === "" ? false : null;
    }

    setIsValid(validationStatus);

    if (validationStatus === true || validationStatus === null) {
      changeValue(newValue.trim());
    } else {
      changeValue("");
    }
  };

  const handleInputBlur = () => {
    if (readOnly) return;

    setFocused(false);

    let validationStatus = null;

    if (validation) {
      if (optional && value === "") {
        validationStatus = null;
      } else {
        validationStatus = validation(value);
      }
    } else if (optional) {
      validationStatus = null;
    } else {
      validationStatus = value.trim() === "" ? false : null;
    }

    setIsValid(validationStatus);

    if (validationStatus === true || validationStatus === null) {
      changeValue(value.trim());
    } else {
      changeValue("");
    }
  };

  const handleInputFocus = () => {
    if (readOnly) return;

    setFocused(true);
    setIsValid(null);
  };

  const togglePasswordVisibilityOnHold = (isVisible) => {
    setPasswordVisible(isVisible);
  };

  return (
    <InputFieldContainer>
      <FieldName>{t(fieldName)}</FieldName>
      <InputWrapper isFocused={isFocused} isValid={isValid}>
        <Input
          type={isPassword ? (isPasswordVisible ? "text" : "password") : "text"}
          readOnly={readOnly}
          placeholder={
            t(fieldName) + " " + (optional ? t("Input_Optional") : "")
          }
          value={value}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
        />
        {isPassword && (
          <EyeIcon
            src={eye}
            alt="Toggle visibility"
            onMouseDown={() => togglePasswordVisibilityOnHold(true)}
            onMouseUp={() => togglePasswordVisibilityOnHold(false)}
            onMouseLeave={() => togglePasswordVisibilityOnHold(false)}
            draggable={false}
          />
        )}
      </InputWrapper>
      <Message isValid={isValid}>
        {isFocused
          ? ""
          : isValid === true
          ? t("Valid") + " " + t(fieldName)
          : isValid === false
          ? errorMessage || t("Invalid") + " " + t(fieldName)
          : ""}
      </Message>
    </InputFieldContainer>
  );
};

export default InputField;

const InputFieldContainer = styled.div`
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

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  border-bottom: 1.5px solid
    ${(props) => {
      if (props.isFocused) return "#1672C0";
      if (props.isValid === null) return "#20294C";
      return props.isValid ? "#00953F" : "#EC011A";
    }};
`;

const Input = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  font-weight: 500;
  padding: 4px 0px;
  background: none;
  color: #20294c;
  caret-color: #1672c0;
  font-family: "Lato", sans-serif;

  &::placeholder {
    color: #c6cace;
    font-weight: 500;
    font-family: "Lato", sans-serif;
  }
`;

const EyeIcon = styled.img`
  cursor: pointer;
  width: 20px;
  height: 20px;
`;

const Message = styled.div`
  font-size: 12px;
  color: ${(props) => (props.isValid ? "#00953F" : "#EC011A")};
  height: 16px;
`;
