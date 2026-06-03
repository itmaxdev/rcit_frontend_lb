import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import {
  fetchInvoiceConfiguration,
  updateInvoiceConfiguration,
} from "../../functions/admin";

const DEFAULT_FORM = {
  customsDutyPercentage: "5.00",
  vatPercentage: "11.00",
};

const Configuration = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [initialForm, setInitialForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setLoading(true);
    setLoadError(false);
    setSaveError("");
    const response = await fetchInvoiceConfiguration();
    if (!response) {
      setLoadError(true);
      setForm(DEFAULT_FORM);
      setInitialForm(DEFAULT_FORM);
      setLoading(false);
      return;
    }

    const nextForm = {
      customsDutyPercentage: formatPercentInput(response.customsDutyPercentage),
      vatPercentage: formatPercentInput(response.vatPercentage),
    };
    setForm(nextForm);
    setInitialForm(nextForm);
    setLoading(false);
  };

  const handleChange = (field, value) => {
    if (!/^\d{0,3}(\.\d{0,2})?$/.test(value)) {
      return;
    }
    setSaveError("");
    setSaveSuccess(false);
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const canSave = useMemo(() => {
    return (
      isValidPercent(form.customsDutyPercentage) &&
      isValidPercent(form.vatPercentage) &&
      (JSON.stringify(form) !== JSON.stringify(initialForm) || loadError)
    );
  }, [form, initialForm, loadError]);

  const handleSave = async () => {
    if (!canSave) {
      return;
    }

    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    const response = await updateInvoiceConfiguration({
      customsDutyPercentage: Number(form.customsDutyPercentage),
      vatPercentage: Number(form.vatPercentage),
    });

    setSaving(false);

    if (!response) {
      setSaveError(t("Configuration_SaveError"));
      return;
    }

    const nextForm = {
      customsDutyPercentage: formatPercentInput(response.customsDutyPercentage),
      vatPercentage: formatPercentInput(response.vatPercentage),
    };
    setForm(nextForm);
    setInitialForm(nextForm);
    setLoadError(false);
    setSaveSuccess(true);
  };

  return (
    <ConfigurationContainer>
      <Title>{t("Configuration_Title")}</Title>
      <Subtext>{t("Configuration_Subtext")}</Subtext>

      <Card>
        <CardHeader>
          <CardTitle>{t("Configuration_InvoiceRatesTitle")}</CardTitle>
          <CardDescription>
            {t("Configuration_InvoiceRatesDescription")}
          </CardDescription>
        </CardHeader>

        {loading ? (
          <StateText>{t("Loading")}</StateText>
        ) : (
          <>
            {loadError ? (
              <StateStack>
                <ErrorText>{t("Configuration_LoadError")}</ErrorText>
                <RetryButton type="button" onClick={loadConfiguration}>
                  {t("Retry")}
                </RetryButton>
              </StateStack>
            ) : null}

            <FieldsGrid>
              <FieldCard>
                <FieldLabel>{t("Configuration_CustomsDuty")}</FieldLabel>
                <FieldInputRow>
                  <FieldInput
                    type="text"
                    inputMode="decimal"
                    value={form.customsDutyPercentage}
                    onChange={(event) =>
                      handleChange("customsDutyPercentage", event.target.value)
                    }
                    onBlur={() =>
                      setForm((previous) => ({
                        ...previous,
                        customsDutyPercentage: normalizePercentInput(
                          previous.customsDutyPercentage
                        ),
                      }))
                    }
                    placeholder="5.00"
                  />
                  <FieldSuffix>%</FieldSuffix>
                </FieldInputRow>
              </FieldCard>

              <FieldCard>
                <FieldLabel>{t("Configuration_VAT")}</FieldLabel>
                <FieldInputRow>
                  <FieldInput
                    type="text"
                    inputMode="decimal"
                    value={form.vatPercentage}
                    onChange={(event) =>
                      handleChange("vatPercentage", event.target.value)
                    }
                    onBlur={() =>
                      setForm((previous) => ({
                        ...previous,
                        vatPercentage: normalizePercentInput(
                          previous.vatPercentage
                        ),
                      }))
                    }
                    placeholder="11.00"
                  />
                  <FieldSuffix>%</FieldSuffix>
                </FieldInputRow>
              </FieldCard>
            </FieldsGrid>

            <HelperText>{t("Configuration_AutoRefreshNote")}</HelperText>

            {saveError ? <ErrorText>{saveError}</ErrorText> : null}
            {saveSuccess ? (
              <SuccessText>{t("Configuration_SaveSuccess")}</SuccessText>
            ) : null}

            <Actions>
              <SaveButton
                type="button"
                onClick={handleSave}
                disabled={!canSave || saving}
              >
                {saving ? t("Configuration_Saving") : t("Configuration_Save")}
              </SaveButton>
            </Actions>
          </>
        )}
      </Card>
    </ConfigurationContainer>
  );
};

const isValidPercent = (value) => {
  if (value === "") {
    return false;
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0 && numericValue <= 100;
};

const formatPercentInput = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : "";
};

const normalizePercentInput = (value) => {
  if (value === "" || !isValidPercent(value)) {
    return value;
  }
  return formatPercentInput(value);
};

export default Configuration;

const ConfigurationContainer = styled.div`
  display: flex;
  width: 90%;
  min-height: calc(100vh - 75px);
  flex-direction: column;
  padding: 40px 0;
  align-items: start;
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
  color: #20294c;
`;

const Card = styled.div`
  display: flex;
  width: 100%;
  max-width: 900px;
  flex-direction: column;
  border-radius: 16px;
  border: 1px solid #eaebef;
  background: #fff;
  padding: 28px;
  gap: 24px;
`;

const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CardTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #20294c;
`;

const CardDescription = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: #797f94;
  max-width: 680px;
`;

const FieldsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FieldCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const FieldLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #20294c;
`;

const FieldInputRow = styled.div`
  display: flex;
  align-items: center;
  border-radius: 12px;
  border: 1px solid #dbe0ea;
  overflow: hidden;
  background: #fff;
`;

const FieldInput = styled.input`
  width: 100%;
  border: 0;
  outline: none;
  padding: 14px 16px;
  font-size: 16px;
  color: #20294c;
`;

const FieldSuffix = styled.span`
  padding: 0 16px;
  color: #797f94;
  font-weight: 600;
`;

const HelperText = styled.p`
  font-size: 13px;
  color: #797f94;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const SaveButton = styled.button`
  cursor: pointer;
  border: 0;
  border-radius: 10px;
  background: #436c4d;
  color: #fff;
  padding: 14px 24px;
  font-size: 14px;
  font-weight: 700;
  transition: opacity 0.2s ease;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const RetryButton = styled.button`
  cursor: pointer;
  border: 1px solid #20294c;
  border-radius: 10px;
  background: #fff;
  color: #20294c;
  padding: 12px 18px;
  font-size: 14px;
  font-weight: 600;
`;

const StateStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
`;

const StateText = styled.p`
  font-size: 14px;
  color: #20294c;
`;

const ErrorText = styled.p`
  font-size: 14px;
  color: #d32f2f;
`;

const SuccessText = styled.p`
  font-size: 14px;
  color: #1c9d72;
`;
