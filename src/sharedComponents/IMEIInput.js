// src/sharedComponents/IMEIInput.js
import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

const IMEI_LENGTH = 15;

// A fully controlled IMEI input: the parent always holds the raw typed value,
// so the field never resets itself mid-typing. Only digits are accepted and
// the value is capped at 15 characters.
const IMEIInput = ({ label, value = "", changeValue = () => {} }) => {
  const { t } = useTranslation();

  const handleChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, IMEI_LENGTH);
    changeValue(digitsOnly);
  };

  const hasValue = value.length > 0;
  const isComplete = value.length === IMEI_LENGTH;
  const isValid = !hasValue ? null : isComplete;

  return (
    <FieldContainer>
      <FieldName>{label}</FieldName>
      <InputWrapper $isValid={isValid}>
        <Input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={label}
          value={value}
          onChange={handleChange}
        />
      </InputWrapper>
      <Message $isValid={isValid}>
        {isValid === false
          ? `${t("Invalid")} (${value.length}/${IMEI_LENGTH})`
          : isValid === true
            ? t("Valid")
            : ""}
      </Message>
    </FieldContainer>
  );
};

export default IMEIInput;

const FieldContainer = styled.div`
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
    ${({ $isValid }) => {
      if ($isValid === null) return "#20294c";
      return $isValid ? "#00953F" : "#EC011A";
    }};

  &:focus-within {
    border-bottom-color: #436c4d;
  }
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
  caret-color: #436c4d;
  font-family: "Lato", sans-serif;

  &::placeholder {
    color: #c6cace;
    font-weight: 500;
    font-family: "Lato", sans-serif;
  }
`;

const Message = styled.div`
  font-size: 12px;
  color: ${({ $isValid }) => ($isValid ? "#00953F" : "#EC011A")};
  height: 16px;
`;
