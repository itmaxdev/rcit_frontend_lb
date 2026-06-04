import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import Popup from "../Popup";
import {
  deleteAllDeclarations,
  fetchInvoiceConfiguration,
  updateInvoiceConfiguration,
} from "../../functions/admin";

const DEFAULT_FORM = {
  customsDutyPercentage: "5.00",
  vatPercentage: "11.00",
  priceAdjustmentEnabled: false,
  declarationDeletionEnabled: false,
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
  const [deleting, setDeleting] = useState(false);
  const [deleteToggleSaving, setDeleteToggleSaving] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deletePopupOpen, setDeletePopupOpen] = useState(false);

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
      priceAdjustmentEnabled: Boolean(response.priceAdjustmentEnabled),
      declarationDeletionEnabled: Boolean(response.declarationDeletionEnabled),
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
    setDeleteError("");
    setDeleteSuccess(false);
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleToggleChange = (field) => {
    if (field === "declarationDeletionEnabled") {
      handleDeleteToggleChange();
      return;
    }

    setSaveError("");
    setSaveSuccess(false);
    setDeleteError("");
    setDeleteSuccess(false);
    setForm((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  const handleDeleteToggleChange = async () => {
    if (deleteToggleSaving || loadError) {
      return;
    }

    const nextValue = !form.declarationDeletionEnabled;
    setDeleteToggleSaving(true);
    setDeleteError("");
    setDeleteSuccess(false);

    const response = await updateInvoiceConfiguration({
      customsDutyPercentage: Number(initialForm.customsDutyPercentage),
      vatPercentage: Number(initialForm.vatPercentage),
      priceAdjustmentEnabled: initialForm.priceAdjustmentEnabled,
      declarationDeletionEnabled: nextValue,
    });

    setDeleteToggleSaving(false);

    if (!response) {
      setDeleteError(t("Configuration_SaveError"));
      return;
    }

    const normalizedValue = Boolean(response.declarationDeletionEnabled);
    setInitialForm((previous) => ({
      ...previous,
      declarationDeletionEnabled: normalizedValue,
    }));
    setForm((previous) => ({
      ...previous,
      declarationDeletionEnabled: normalizedValue,
    }));
  };

  const canSave = useMemo(() => {
    return (
      isValidPercent(form.customsDutyPercentage) &&
      isValidPercent(form.vatPercentage) &&
      (form.customsDutyPercentage !== initialForm.customsDutyPercentage ||
        form.vatPercentage !== initialForm.vatPercentage ||
        form.priceAdjustmentEnabled !== initialForm.priceAdjustmentEnabled ||
        loadError)
    );
  }, [form, initialForm, loadError]);

  const handleSave = async () => {
    if (!canSave) {
      return;
    }

    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    setDeleteError("");
    setDeleteSuccess(false);

    const response = await updateInvoiceConfiguration({
      customsDutyPercentage: Number(form.customsDutyPercentage),
      vatPercentage: Number(form.vatPercentage),
      priceAdjustmentEnabled: form.priceAdjustmentEnabled,
      declarationDeletionEnabled: form.declarationDeletionEnabled,
    });

    setSaving(false);

    if (!response) {
      setSaveError(t("Configuration_SaveError"));
      return;
    }

    const nextForm = {
      customsDutyPercentage: formatPercentInput(response.customsDutyPercentage),
      vatPercentage: formatPercentInput(response.vatPercentage),
      priceAdjustmentEnabled: Boolean(response.priceAdjustmentEnabled),
      declarationDeletionEnabled: Boolean(response.declarationDeletionEnabled),
    };
    setForm(nextForm);
    setInitialForm(nextForm);
    setLoadError(false);
    setSaveSuccess(true);
  };

  const canDeleteDeclarations =
    form.declarationDeletionEnabled && !loadError && !deleteToggleSaving;

  const handleDeleteDeclarations = async () => {
    if (!canDeleteDeclarations || deleting) {
      return;
    }

    setDeleting(true);
    setDeleteError("");
    setDeleteSuccess(false);

    const deleted = await deleteAllDeclarations();

    setDeleting(false);

    if (!deleted) {
      setDeleteError(t("Configuration_DeleteError"));
      setDeletePopupOpen(false);
      return;
    }

    setDeletePopupOpen(false);
    setDeleteSuccess(true);
  };

  return (
    <ConfigurationContainer>
      {deletePopupOpen ? (
        <Popup
          purpose="deleteDeclarations"
          onClose={() => {
            if (!deleting) {
              setDeletePopupOpen(false);
            }
          }}
          onAction={handleDeleteDeclarations}
          busy={deleting}
        />
      ) : null}

      <Title>{t("Configuration_Title")}</Title>
      <Subtext>{t("Configuration_Subtext")}</Subtext>

      {loading ? (
        <Card>
          <StateText>{t("Loading")}</StateText>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t("Configuration_PriceAdjustmentTitle")}</CardTitle>
              <CardDescription>
                {t("Configuration_PriceAdjustmentDescription")}
              </CardDescription>
            </CardHeader>

            {loadError ? (
              <StateStack>
                <ErrorText>{t("Configuration_LoadError")}</ErrorText>
                <RetryButton type="button" onClick={loadConfiguration}>
                  {t("Retry")}
                </RetryButton>
              </StateStack>
            ) : null}

            <ToggleCard>
              <ToggleTextStack>
                <FieldLabel>{t("Adjust")}</FieldLabel>
              </ToggleTextStack>

              <ToggleAction>
                <ToggleStatus $enabled={form.priceAdjustmentEnabled}>
                  {form.priceAdjustmentEnabled
                    ? t("Configuration_Enabled")
                    : t("Configuration_Disabled")}
                </ToggleStatus>
                <ToggleButton
                  type="button"
                  role="switch"
                  aria-checked={form.priceAdjustmentEnabled}
                  onClick={() => handleToggleChange("priceAdjustmentEnabled")}
                  $enabled={form.priceAdjustmentEnabled}
                >
                  <ToggleThumb $enabled={form.priceAdjustmentEnabled} />
                </ToggleButton>
              </ToggleAction>
            </ToggleCard>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("Configuration_InvoiceRatesTitle")}</CardTitle>
              <CardDescription>
                {t("Configuration_InvoiceRatesDescription")}
              </CardDescription>
            </CardHeader>

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
          </Card>

          <FooterActions>
            <FeedbackStack>
              {saveError ? <ErrorText>{saveError}</ErrorText> : null}
              {saveSuccess ? (
                <SuccessText>{t("Configuration_SaveSuccess")}</SuccessText>
              ) : null}
            </FeedbackStack>

            <Actions>
              <SaveButton
                type="button"
                onClick={handleSave}
                disabled={!canSave || saving}
              >
                {saving ? t("Configuration_Saving") : t("Configuration_Save")}
              </SaveButton>
            </Actions>
          </FooterActions>

          <Card>
            <CardHeader>
              <CardTitle>{t("Configuration_DeleteActionTitle")}</CardTitle>
              <CardDescription>
                {canDeleteDeclarations
                  ? t("Configuration_DeleteActionEnabledDescription")
                  : t("Configuration_DeleteActionDisabledDescription")}
              </CardDescription>
            </CardHeader>

            <ToggleCard>
              <ToggleTextStack>
                <FieldLabel>{t("Configuration_CanDelete")}</FieldLabel>
              </ToggleTextStack>

              <ToggleAction>
                <ToggleStatus $enabled={form.declarationDeletionEnabled}>
                  {form.declarationDeletionEnabled
                    ? t("Configuration_Enabled")
                    : t("Configuration_Disabled")}
                </ToggleStatus>
                <ToggleButton
                  type="button"
                  role="switch"
                  aria-checked={form.declarationDeletionEnabled}
                  onClick={() => handleToggleChange("declarationDeletionEnabled")}
                  $enabled={form.declarationDeletionEnabled}
                  disabled={deleteToggleSaving}
                >
                  <ToggleThumb $enabled={form.declarationDeletionEnabled} />
                </ToggleButton>
              </ToggleAction>
            </ToggleCard>

            <DangerActions>
              <DangerButton
                type="button"
                onClick={() => {
                  setDeleteError("");
                  setDeleteSuccess(false);
                  setDeletePopupOpen(true);
                }}
                disabled={!canDeleteDeclarations || deleting}
              >
                {deleting
                  ? t("Configuration_Deleting")
                  : t("Configuration_DeleteAllDeclarations")}
              </DangerButton>
            </DangerActions>

            {deleteError ? <ErrorText>{deleteError}</ErrorText> : null}
            {deleteSuccess ? (
              <SuccessText>{t("Configuration_DeleteSuccess")}</SuccessText>
            ) : null}
          </Card>
        </>
      )}
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
  gap: 24px;
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

const ToggleCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px;
  border-radius: 14px;
  border: 1px solid #eaebef;
  background: #fbfcfe;
  flex-wrap: wrap;
`;

const ToggleTextStack = styled.div`
  display: flex;
  min-width: 0;
  flex: 1 1 280px;
  flex-direction: column;
  gap: 6px;
`;

const ToggleAction = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const ToggleStatus = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: ${({ $enabled }) => ($enabled ? "#1c9d72" : "#797f94")};
`;

const ToggleButton = styled.button`
  position: relative;
  width: 56px;
  height: 32px;
  border: 0;
  border-radius: 999px;
  padding: 4px;
  background: ${({ $enabled }) => ($enabled ? "#436c4d" : "#d8dfeb")};
  cursor: pointer;
  transition: background 0.2s ease;
`;

const ToggleThumb = styled.span`
  display: block;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12);
  transform: translateX(${({ $enabled }) => ($enabled ? "24px" : "0")});
  transition: transform 0.2s ease;
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

const DangerActions = styled.div`
  display: flex;
  justify-content: flex-start;
`;

const FooterActions = styled.div`
  display: flex;
  width: 100%;
  max-width: 900px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const FeedbackStack = styled.div`
  display: flex;
  min-height: 24px;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8px;
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

const DangerButton = styled.button`
  cursor: pointer;
  border: 0;
  border-radius: 10px;
  background: #d32f2f;
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
