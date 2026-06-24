import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import ImporterInvoicePreview from "./importers/ImporterInvoicePreview";

// Shared invoice modal: renders the Ministry of Finance invoice card with
// Back / Download / Proceed-to-Payment actions. Used by the individual
// declarations list to mirror the importer invoice popup.
const InvoiceModal = ({
  invoice,
  loading = false,
  error = "",
  onClose,
  onBack,
  onDownload,
  onProceed,
  showProceed = false,
  proceedBusy = false,
  onRetry,
}) => {
  const { t } = useTranslation();

  return (
    <InvoiceOverlay onClick={onClose}>
      <InvoicePanel onClick={(event) => event.stopPropagation()}>
        <InvoiceCloseButton type="button" onClick={onClose}>
          &#x2715;
        </InvoiceCloseButton>
        <InvoiceBody>
          {loading ? (
            <InvoiceStateCard>{t("Loading")}</InvoiceStateCard>
          ) : error ? (
            <InvoiceStateCard>
              <div>{error}</div>
              {onRetry && (
                <OutlineButton type="button" onClick={onRetry}>
                  {t("Retry")}
                </OutlineButton>
              )}
            </InvoiceStateCard>
          ) : !invoice ? (
            <InvoiceStateCard>{t("No data available")}</InvoiceStateCard>
          ) : (
            <ImporterInvoicePreview invoice={invoice} />
          )}
        </InvoiceBody>
        {!loading && !error && invoice && (
          <InvoiceActions>
            <InvoiceSecondaryButton type="button" onClick={onBack || onClose}>
              {t("Back to Declarations")}
            </InvoiceSecondaryButton>
            <InvoicePrimaryButton type="button" onClick={onDownload}>
              {t("Download Invoice")}
            </InvoicePrimaryButton>
            {showProceed && (
              <InvoiceProceedButton
                type="button"
                onClick={onProceed}
                disabled={proceedBusy}
              >
                {t("Proceed to Payment")}
              </InvoiceProceedButton>
            )}
          </InvoiceActions>
        )}
      </InvoicePanel>
    </InvoiceOverlay>
  );
};

export default InvoiceModal;

const InvoiceOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(13, 18, 28, 0.28);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 25;
`;

const InvoicePanel = styled.div`
  position: relative;
  width: min(980px, calc(100vw - 48px));
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 18px;
  border: 1px solid #edf0f7;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(17, 24, 39, 0.12);
  margin: 24px;
`;

const InvoiceCloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
  color: #8b92a8;
  line-height: 1;
  z-index: 2;
`;

const InvoiceBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 28px 24px 18px;
`;

const InvoiceStateCard = styled.div`
  width: 100%;
  min-height: 180px;
  border-radius: 18px;
  border: 1px solid #edf0f7;
  background: #fff;
  box-shadow: 0 20px 45px rgba(17, 24, 39, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #616a85;
  font-size: 14px;
`;

const OutlineButton = styled.button`
  border: 1px solid #20294c;
  border-radius: 999px;
  background: white;
  color: #20294c;
  padding: 12px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`;

const InvoiceActions = styled.div`
  display: flex;
  gap: 16px;
  flex-shrink: 0;
  padding: 18px 24px 20px;
  border-top: 1px solid #edf0f7;
  background: #fff;
  position: relative;
  z-index: 1;

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

const InvoiceActionButton = styled.button`
  flex: 1;
  height: 54px;
  border-radius: 28px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.88;
  }
`;

const InvoiceSecondaryButton = styled(InvoiceActionButton)`
  background: #ffffff;
  color: #20294c;
  border: 1px solid #20294c;
`;

const InvoicePrimaryButton = styled(InvoiceActionButton)`
  background: #2671d9;
  color: #ffffff;
  border: 1px solid #2671d9;
`;

const InvoiceProceedButton = styled(InvoiceActionButton)`
  background: #2f7d32;
  color: #ffffff;
  border: 1px solid #2f7d32;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
