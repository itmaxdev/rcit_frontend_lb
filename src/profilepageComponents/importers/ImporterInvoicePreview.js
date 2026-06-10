import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { StatusBadge } from "../statusBadge";
import { formatCount } from "../../functions/format";
import ministryLogo from "../../assets/ministry_logo.jpeg";

const ImporterInvoicePreview = ({
  invoice,
  showProceedButton = false,
  onProceedToPayment,
  proceedBusy = false,
}) => {
  const { t } = useTranslation();

  if (!invoice) {
    return null;
  }

  const isPaid = invoice.invoiceStatus === "PAID";

  return (
    <InvoiceCard>
      <InvoiceHeaderBlock>
        <InvoiceLeftHeader>
          <InvoiceSeal>
            <img src={ministryLogo} alt="Ministry of Finance" />
          </InvoiceSeal>
          <InvoiceIssuerBlock>
            <InvoiceIssuerCountry>{t("Republic of Lebanon")}</InvoiceIssuerCountry>
            <InvoiceIssuerTitle>{t("Ministry of Finance")}</InvoiceIssuerTitle>
            <InvoiceIssuerSubtitle>{t("Customs Directorate")}</InvoiceIssuerSubtitle>
          </InvoiceIssuerBlock>
        </InvoiceLeftHeader>

        <InvoiceRightHeader>
          <InvoiceHeading>{t("Invoice")}</InvoiceHeading>
          <InvoiceNumber>{invoice.invoiceNumber}</InvoiceNumber>
        </InvoiceRightHeader>
      </InvoiceHeaderBlock>

      <InvoiceMetaGrid>
        <InvoiceMetaItem>
          <InvoiceMetaLabel>{t("Declaration No.")}</InvoiceMetaLabel>
          <InvoiceMetaValue>{invoice.declarationNumber}</InvoiceMetaValue>
        </InvoiceMetaItem>
        <InvoiceMetaItem>
          <InvoiceMetaLabel>{t("Devices Count")}</InvoiceMetaLabel>
          <InvoiceMetaValue>{formatCount(invoice.devicesCount)}</InvoiceMetaValue>
        </InvoiceMetaItem>
        <InvoiceMetaItem>
          <InvoiceMetaLabel>{t("Importer")}</InvoiceMetaLabel>
          <InvoiceMetaValue>{invoice.importerName}</InvoiceMetaValue>
        </InvoiceMetaItem>
        <InvoiceMetaItem>
          <InvoiceMetaLabel>{t("Issue Date")}</InvoiceMetaLabel>
          <InvoiceMetaValue>{formatDate(invoice.issueDate)}</InvoiceMetaValue>
        </InvoiceMetaItem>
        <InvoiceMetaItem>
          <InvoiceMetaLabel>{t("Currency")}</InvoiceMetaLabel>
          <InvoiceMetaValue>{invoice.currency}</InvoiceMetaValue>
        </InvoiceMetaItem>
        <InvoiceMetaItem>
          <InvoiceMetaLabel>{t("Declaration Date")}</InvoiceMetaLabel>
          <InvoiceMetaValue>{formatDate(invoice.declarationDate)}</InvoiceMetaValue>
        </InvoiceMetaItem>
        <InvoiceMetaItem>
          <InvoiceMetaLabel>{t("Payment Status")}</InvoiceMetaLabel>
          <InvoiceMetaValue>
            <StatusBadge $status={isPaid ? "PAID" : "AWAITING_PAYMENT"}>
              {formatInvoiceStatusLabel(t, invoice.invoiceStatus)}
            </StatusBadge>
          </InvoiceMetaValue>
        </InvoiceMetaItem>
      </InvoiceMetaGrid>

      <InvoiceSummaryCard>
        <InvoiceSummaryRow>
          <span>{t("Total Approved Value")}</span>
          <span>{formatInvoiceMoney(invoice.approvedValueUsd)}</span>
        </InvoiceSummaryRow>
        <InvoiceSummaryRow>
          <span>
            {t("Total Customs Duty")} ({Number(invoice.dutyPercentage || 0).toFixed(0)}%)
          </span>
          <strong>{formatInvoiceMoney(invoice.customsDutyUsd)}</strong>
        </InvoiceSummaryRow>
        <InvoiceSummaryRow>
          <span>{t("Total (Approved Value + Customs Duty)")}</span>
          <span>{formatInvoiceMoney(invoice.totalWithDutyUsd)}</span>
        </InvoiceSummaryRow>
        <InvoiceSummaryRow $last>
          <span>{t("VAT")} ({Number(invoice.vatPercentage || 0).toFixed(0)}%)</span>
          <strong>+{formatInvoiceMoney(invoice.vatAmountUsd)}</strong>
        </InvoiceSummaryRow>
      </InvoiceSummaryCard>

      <InvoiceTotalBox>
        <InvoiceTotalLeft>
          <strong>{t("TOTAL PAYABLE")}</strong>{" "}
          <InvoiceTotalSub>({t("TOTAL CUSTOMS DUTY + VAT")})</InvoiceTotalSub>
        </InvoiceTotalLeft>
        <InvoiceTotalRight>
          <InvoiceTotalAmount>{formatInvoiceMoney(invoice.totalPayableUsd)}</InvoiceTotalAmount>
          <InvoiceTotalApprox>
            ≈ {(Number(invoice.totalPayableUsd || 0) * Number(invoice.usdToLbpRate || 0)).toLocaleString()} LBP
          </InvoiceTotalApprox>
          <InvoiceTotalRate>
            {t("Exchange Rate")}: {Number(invoice.usdToLbpRate || 0).toLocaleString()} USD/LBP
          </InvoiceTotalRate>
        </InvoiceTotalRight>
      </InvoiceTotalBox>

      <InvoiceFooterRow>
        <InvoiceFooterNote>
          {isPaid
            ? t("Thank you. Payment received")
            : t("Invoice generated. Awaiting payment.")}
        </InvoiceFooterNote>

        {showProceedButton && (
          <ProceedButton
            type="button"
            onClick={onProceedToPayment}
            disabled={proceedBusy}
          >
            {t("Proceed to Payment")}
          </ProceedButton>
        )}
      </InvoiceFooterRow>
    </InvoiceCard>
  );
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatInvoiceMoney = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatInvoiceStatusLabel = (t, status) => {
  if (status === "PAID") {
    return t("Paid");
  }
  return t("Awaiting Payment");
};

export default ImporterInvoicePreview;

const InvoiceCard = styled.div`
  width: 100%;
  background: #fff;
  border-radius: 18px;
  padding: 22px 24px 18px;
  border: 1px solid #edf0f7;
  box-shadow: 0 20px 45px rgba(17, 24, 39, 0.06);
`;

const InvoiceHeaderBlock = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #edf0f7;
  margin-bottom: 10px;
`;

const InvoiceLeftHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
`;

const InvoiceRightHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
`;

const InvoiceSeal = styled.div`
  width: 60px;
  height: 60px;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
`;

const InvoiceIssuerBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const InvoiceIssuerCountry = styled.span`
  color: #8a93ad;
  font-size: 13px;
  line-height: 1.2;
`;

const InvoiceIssuerTitle = styled.span`
  color: #1d2025;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.2;
`;

const InvoiceIssuerSubtitle = styled.span`
  color: #1d2025;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
`;

const InvoiceHeading = styled.h2`
  font-size: 17px;
  color: #1d2025;
  margin: 0;
  font-weight: 700;
  line-height: 1.2;
`;

const InvoiceNumber = styled.div`
  font-size: 17px;
  font-weight: 700;
  color: #1d2025;
  text-align: right;
  line-height: 1.2;
`;

const InvoiceMetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px 26px;
  padding: 10px 0 16px;
  border-bottom: 1px solid #edf0f7;
  margin-bottom: 16px;
`;

const InvoiceMetaItem = styled.div`
  min-width: 0;
`;

const InvoiceMetaLabel = styled.div`
  color: #7d86a3;
  font-size: 12px;
  margin-bottom: 4px;
`;

const InvoiceMetaValue = styled.div`
  color: #1d2025;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
`;


const InvoiceSummaryCard = styled.div`
  background: transparent;
  padding: 0;
  margin-bottom: 14px;
`;

const InvoiceSummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 15px 4px;
  color: #1d2025;
  font-size: 14px;
  border-bottom: ${({ $last }) => ($last ? "none" : "1px solid #edf0f7")};
`;

const InvoiceTotalBox = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #f7fbf7;
`;

const InvoiceTotalLeft = styled.div`
  color: #1d2025;
  font-size: 13px;
`;

const InvoiceTotalSub = styled.span`
  color: #3f7f50;
  font-size: 13px;
  font-weight: 400;
`;

const InvoiceTotalRight = styled.div`
  text-align: right;
`;

const InvoiceTotalAmount = styled.div`
  color: #1b5e20;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.1;
`;

const InvoiceTotalApprox = styled.div`
  color: #6f7897;
  font-size: 11px;
  margin-top: 3px;
`;

const InvoiceTotalRate = styled.div`
  color: #98a0b7;
  font-size: 10px;
  margin-top: 2px;
`;

const InvoiceFooterRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-top: 14px;
`;

const InvoiceFooterNote = styled.div`
  color: #a0a7bd;
  font-size: 12px;
`;

const ProceedButton = styled.button`
  cursor: pointer;
  padding: 11px 22px;
  color: #fff;
  border-radius: 999px;
  border: none;
  background: #2671d9;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: #1d5cb5;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
