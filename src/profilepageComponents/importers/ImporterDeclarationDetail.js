import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  downloadImporterDeclarationInvoicePdf,
  downloadFullFile,
  fetchImporterDeclarationById,
  fetchImporterDeclarationInvoice,
  initiateDeclarationPayment,
} from "../../functions/impDeclare";
import PaymentSummary from "../paymentSummary";
import { StatusBadge } from "../statusBadge";
import ministryLogo from "../../assets/ministry_logo.jpeg";

const TRACKER_COMPLETE_COLOR = "#1c9d4b";

const ImporterDeclarationDetail = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { declarationId } = useParams();
  const [declaration, setDeclaration] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");
  const [showPaymentSummary, setShowPaymentSummary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const loadInvoice = useCallback(async (uploadId, status) => {
    if (!shouldLoadInvoice(status)) {
      setInvoice(null);
      setInvoiceError("");
      setInvoiceLoading(false);
      setShowPaymentSummary(false);
      return null;
    }

    setInvoiceLoading(true);
    setInvoiceError("");
    const response = await fetchImporterDeclarationInvoice(uploadId);
    setInvoice(response);
    setInvoiceLoading(false);

    if (!response) {
      setInvoiceError(t("Failed to load invoice. Please try again."));
      setShowPaymentSummary(false);
      return null;
    }

    return response;
  }, [t]);

  const loadDeclaration = useCallback(async () => {
    setLoading(true);
    const response = await fetchImporterDeclarationById(declarationId);
    setDeclaration(response);
    if (!response) {
      setInvoice(null);
      setInvoiceError("");
      setShowPaymentSummary(false);
      setLoading(false);
      return;
    }

    const status = response.importerStatus || response.customsStatus || "SUBMITTED";
    await loadInvoice(response.id, status);
    setLoading(false);
  }, [declarationId, loadInvoice]);

  useEffect(() => {
    loadDeclaration();
  }, [loadDeclaration]);

  useEffect(() => {
    if (!location.state?.openInvoice) {
      return;
    }

    setIsInvoiceModalOpen(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const handleBack = () => {
    navigate("/profile/role_importer/DeclareDevices");
  };

  const handleViewCsv = async () => {
    if (!declaration?.id) return;
    await downloadFullFile(declaration.id);
  };

  const handlePay = async () => {
    if (!declaration?.id || paymentBusy) return;

    setPaymentBusy(true);
    const response = await initiateDeclarationPayment(declaration.id);
    setPaymentBusy(false);

    if (response?.checkoutUrl) {
      window.location.href = response.checkoutUrl;
      return;
    }

    if (response?.status === "COMPLETED") {
      global.alert2?.(
        t("You have successfully completed the payment"),
        "",
        async () => {
          setShowPaymentSummary(false);
          setIsInvoiceModalOpen(false);
          await loadDeclaration();
        }
      );
      return;
    }

    global.alert2?.(t("Failed to initiate payment. Please try again."));
  };

  const handleDownloadInvoice = async () => {
    if (!invoice) return;

    const downloaded = await downloadImporterDeclarationInvoicePdf(
      declaration.id,
      `${invoice.invoiceNumber || "invoice"}.pdf`
    );

    if (!downloaded) {
      global.alert2?.(t("Failed to download invoice. Please try again."));
    }
  };

  if (loading) {
    return <PageState>{t("Loading")}</PageState>;
  }

  if (!declaration) {
    return (
      <PageState>
        <div>{t("ImporterDeclarations_EmptyTitle")}</div>
        <OutlineButton type="button" onClick={handleBack}>
          {t("Back to Declarations")}
        </OutlineButton>
      </PageState>
    );
  }

  const rawStatus =
    declaration.importerStatus || declaration.customsStatus || "SUBMITTED";
  const currentStatus = getDisplayStatus(declaration);
  const trackerSteps = getTrackerSteps(currentStatus);
  const currentStepIndex = getTrackerStepIndex(currentStatus);
  const isPaid = rawStatus === "PAID";
  const showInvoiceAccess =
    shouldLoadInvoice(rawStatus) &&
    !(rawStatus === "AWAITING_PAYMENT" && showPaymentSummary);
  const showProceedToPayment =
    rawStatus === "AWAITING_PAYMENT" &&
    invoice?.invoiceStatus !== "PAID" &&
    !showPaymentSummary;
  const showPayment = rawStatus === "AWAITING_PAYMENT" && showPaymentSummary && !!invoice;
  const showCardStatus =
    rawStatus !== "AWAITING_PAYMENT" && rawStatus !== "PAID";

  return (
    <PageContainer>
      <TrackerContainer>
        {trackerSteps.map((step, index) => {
          const isComplete = index < currentStepIndex;
          const isActive = index === currentStepIndex;

          return (
            <TrackerStep key={step}>
              {index > 0 && (
                <TrackerLine $complete={index <= currentStepIndex} />
              )}
              <TrackerMarker $complete={isComplete} $active={isActive} $rejected={isActive && step === "DECLINED"}>
                {isComplete && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8.5L6.5 12L13 5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {isActive && step === "DECLINED" && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 3L11 11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M11 3L3 11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
              </TrackerMarker>
              <TrackerLabel>
                {formatStatusLabel(t, step)}
              </TrackerLabel>
            </TrackerStep>
          );
        })}
      </TrackerContainer>

      <DeclarationCard>
        <CardHeader>
          <CardTitleGroup>
            <CardTitle>
              {t("Declaration")} {declaration.id}
            </CardTitle>
            {showCardStatus && (
              <StatusBadge $status={currentStatus}>
                {formatStatusLabel(t, currentStatus)}
              </StatusBadge>
            )}
          </CardTitleGroup>
          <CsvButton type="button" onClick={handleViewCsv}>
            {t("View CSV")}
          </CsvButton>
        </CardHeader>

        <DetailsGrid>
          <DetailItem>
            <DetailLabel>{t("Declaration Number")}</DetailLabel>
            <DetailValue>{formatDeclarationNumber(declaration.id)}</DetailValue>
          </DetailItem>
          <DetailDivider />
          <DetailItem>
            <DetailLabel>{t("Nbr of Devices")}</DetailLabel>
            <DetailValue>{declaration.devicesCount ?? 0}</DetailValue>
          </DetailItem>
          <DetailDivider />
          <DetailItem>
            <DetailLabel>{t("Declaration Date")}</DetailLabel>
            <DetailValue>{formatDate(declaration.createdAt)}</DetailValue>
          </DetailItem>
        </DetailsGrid>
      </DeclarationCard>

      {showInvoiceAccess && (
        <InvoiceSection>
          {invoiceLoading ? (
            <InvoiceStateCard>{t("Loading")}</InvoiceStateCard>
          ) : invoiceError ? (
            <InvoiceStateCard>
              <div>{invoiceError}</div>
              <OutlineButton
                type="button"
                onClick={() => loadInvoice(declaration.id, currentStatus)}
              >
                {t("Retry")}
              </OutlineButton>
            </InvoiceStateCard>
          ) : (
            <InvoiceLaunchCard>
              <InvoiceLaunchTitle>{t("Invoice")}</InvoiceLaunchTitle>
              <InvoiceLaunchText>
                {isPaid
                  ? t("View the generated invoice at any time.")
                  : t("Review the generated invoice before proceeding to payment.")}
              </InvoiceLaunchText>
              <InvoiceLaunchButton
                type="button"
                onClick={() => setIsInvoiceModalOpen(true)}
              >
                {t("View Invoice")}
              </InvoiceLaunchButton>
            </InvoiceLaunchCard>
          )}
        </InvoiceSection>
      )}

      {rawStatus === "APPROVED" && (
        <PendingMessageCard>
          <PendingMessageTitle>{t("Pending Invoice Generation")}</PendingMessageTitle>
          <PendingMessageText>
            {t("Your declaration has been approved and is waiting for customs to generate the invoice.")}
          </PendingMessageText>
        </PendingMessageCard>
      )}

      {showPayment && (
        <PaymentSection>
          <PaymentSummary
            data={{
              totalApprovedValue: invoice.approvedValueUsd,
              totalCustomsDuty: invoice.customsDutyUsd,
              totalWithDuty: invoice.totalWithDutyUsd,
              totalPayable: invoice.totalPayableUsd,
              vatAmount: invoice.vatAmountUsd,
              dutyPercentage: invoice.dutyPercentage,
              vatPercentage: invoice.vatPercentage,
              usdToLbpRate: invoice.usdToLbpRate,
            }}
            busy={paymentBusy}
            onPay={handlePay}
            paid={isPaid || invoice?.invoiceStatus === "PAID"}
          />
        </PaymentSection>
      )}

      {rawStatus === "DECLINED" && declaration.rejectionReason && (
        <ReasonSection>
          <ReasonTitle>{t("Rejection Reason")}</ReasonTitle>
          <ReasonCard>{declaration.rejectionReason}</ReasonCard>
        </ReasonSection>
      )}

      {isInvoiceModalOpen && (
        <InvoiceOverlay onClick={() => setIsInvoiceModalOpen(false)}>
          <InvoicePanel onClick={(event) => event.stopPropagation()}>
            <InvoiceCloseButton
              type="button"
              onClick={() => setIsInvoiceModalOpen(false)}
            >
              &#x2715;
            </InvoiceCloseButton>
            <InvoiceBody>
              {invoiceLoading ? (
                <InvoiceStateCard>{t("Loading")}</InvoiceStateCard>
              ) : invoiceError ? (
                <InvoiceStateCard>
                  <div>{invoiceError}</div>
                  <OutlineButton
                    type="button"
                    onClick={() => loadInvoice(declaration.id, rawStatus)}
                  >
                    {t("Retry")}
                  </OutlineButton>
                </InvoiceStateCard>
              ) : !invoice ? (
                <InvoiceStateCard>{t("No data available")}</InvoiceStateCard>
              ) : (
                <>
                <InvoiceHeaderBlock>
                  <InvoiceLeftHeader>
                    <InvoiceSeal>
                      <img src={ministryLogo} alt="Ministry of Finance" />
                    </InvoiceSeal>
                    <InvoiceIssuerBlock>
                      <InvoiceIssuerCountry>
                        {t("Republic of Lebanon")}
                      </InvoiceIssuerCountry>
                      <InvoiceIssuerTitle>
                        {t("Ministry of Finance")}
                      </InvoiceIssuerTitle>
                      <InvoiceIssuerSubtitle>
                        {t("Customs Directorate")}
                      </InvoiceIssuerSubtitle>
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
                    <InvoiceMetaValue>{invoice.devicesCount}</InvoiceMetaValue>
                  </InvoiceMetaItem>
                  <InvoiceMetaItem>
                    <InvoiceMetaLabel>{t("Importer")}</InvoiceMetaLabel>
                    <InvoiceMetaValue>{invoice.importerName}</InvoiceMetaValue>
                  </InvoiceMetaItem>
                  <InvoiceMetaItem>
                    <InvoiceMetaLabel>{t("Issue Date")}</InvoiceMetaLabel>
                    <InvoiceMetaValue>{formatLongDate(invoice.issueDate)}</InvoiceMetaValue>
                  </InvoiceMetaItem>
                  <InvoiceMetaItem>
                    <InvoiceMetaLabel>{t("Currency")}</InvoiceMetaLabel>
                    <InvoiceMetaValue>{invoice.currency}</InvoiceMetaValue>
                  </InvoiceMetaItem>
                  <InvoiceMetaItem>
                    <InvoiceMetaLabel>{t("Declaration Date")}</InvoiceMetaLabel>
                    <InvoiceMetaValue>{formatLongDate(invoice.declarationDate)}</InvoiceMetaValue>
                  </InvoiceMetaItem>
                  <InvoiceMetaItem>
                    <InvoiceMetaLabel>{t("Payment Status")}</InvoiceMetaLabel>
                    <InvoiceMetaValue>
                      <StatusBadge
                        $status={invoice.invoiceStatus === "PAID" ? "PAID" : "AWAITING_PAYMENT"}
                      >
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
                    <InvoiceTotalSub>
                      ({t("TOTAL CUSTOMS DUTY + VAT")})
                    </InvoiceTotalSub>
                  </InvoiceTotalLeft>
                  <InvoiceTotalRight>
                    <InvoiceTotalAmount>
                      {formatInvoiceMoney(invoice.totalPayableUsd)}
                    </InvoiceTotalAmount>
                    <InvoiceTotalApprox>
                      ≈ {(Number(invoice.totalPayableUsd || 0) * Number(invoice.usdToLbpRate || 0)).toLocaleString()} LBP
                    </InvoiceTotalApprox>
                    <InvoiceTotalRate>
                      {t("Exchange Rate")}: {Number(invoice.usdToLbpRate || 0).toLocaleString()} USD/LBP
                    </InvoiceTotalRate>
                  </InvoiceTotalRight>
                </InvoiceTotalBox>

                <InvoiceFooterNote>
                  {invoice.invoiceStatus === "PAID"
                    ? t("Thank you. Payment received")
                    : t("Invoice generated. Awaiting payment.")}
                </InvoiceFooterNote>
                </>
              )}
            </InvoiceBody>
            {!invoiceLoading && !invoiceError && invoice && (
                <InvoiceActions>
                  <InvoiceSecondaryButton type="button" onClick={handleBack}>
                    {t("Back to Declarations")}
                  </InvoiceSecondaryButton>
                  <InvoicePrimaryButton
                    type="button"
                    onClick={handleDownloadInvoice}
                  >
                    {t("Download Invoice")}
                  </InvoicePrimaryButton>
                  {showProceedToPayment && (
                    <InvoiceProceedButton
                      type="button"
                      onClick={() => {
                        setIsInvoiceModalOpen(false);
                        setShowPaymentSummary(true);
                      }}
                      disabled={paymentBusy}
                    >
                      {t("Proceed to Payment")}
                    </InvoiceProceedButton>
                  )}
                </InvoiceActions>
            )}
          </InvoicePanel>
        </InvoiceOverlay>
      )}
    </PageContainer>
  );
};

const getTrackerSteps = (status) => {
  if (status === "DECLINED") return ["SUBMITTED", "UNDER_REVIEW", "DECLINED"];
  if (status === "SUBMITTED" || status === "UNDER_REVIEW") {
    return ["SUBMITTED", "UNDER_REVIEW", "AWAITING_PAYMENT"];
  }
  if (status === "PENDING_APPROVAL") {
    return ["SUBMITTED", "PENDING_APPROVAL", "AWAITING_PAYMENT"];
  }
  if (status === "PAID") return ["SUBMITTED", "APPROVED", "PAID"];
  return ["SUBMITTED", "APPROVED", "AWAITING_PAYMENT"];
};

const getTrackerStepIndex = (status) => {
  const map = {
    SUBMITTED: 0,
    UNDER_REVIEW: 1,
    PENDING_APPROVAL: 1,
    APPROVED: 1,
    AWAITING_PAYMENT: 2,
    PAID: 2,
    DECLINED: 2,
  };
  return map[status] ?? 0;
};

const shouldLoadInvoice = (status) =>
  status === "AWAITING_PAYMENT" || status === "PAID";

const formatDeclarationNumber = (value) =>
  `#${String(value).padStart(6, "0")}`;

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatLongDate = (value) => {
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

const formatStatusLabel = (t, status) => {
  const labels = {
    SUBMITTED: t("Submitted"),
    UNDER_REVIEW: t("Under Review"),
    PENDING_APPROVAL: t("Pending Approval"),
    APPROVED: t("Approved"),
    DECLINED: t("Rejected"),
    AWAITING_PAYMENT: t("Awaiting Payment"),
    PAID: t("Paid"),
  };
  return labels[status] || status || "-";
};

const getDisplayStatus = (declaration) => {
  const rawStatus =
    declaration.importerStatus || declaration.customsStatus || "SUBMITTED";

  if (
    rawStatus === "UNDER_REVIEW" &&
    declaration.totalApprovedValue != null &&
    declaration.adjustmentReason?.trim()
  ) {
    return "PENDING_APPROVAL";
  }

  return rawStatus;
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

export default ImporterDeclarationDetail;

/* ─── Tracker ─────────────────────────────────────────────── */

const TrackerContainer = styled.div`
  width: 100%;
  max-width: 560px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin: 0 auto 32px;
`;

const TrackerStep = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

const TrackerLine = styled.div`
  position: absolute;
  top: 14px;
  right: calc(50% + 14px);
  width: calc(100% - 28px);
  height: 3px;
  border-radius: 2px;
  background: ${({ $complete }) =>
    $complete ? TRACKER_COMPLETE_COLOR : "#d9dce8"};
`;

const TrackerMarker = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  flex-shrink: 0;
  background: ${({ $complete, $active, $rejected }) =>
    $complete ? TRACKER_COMPLETE_COLOR : $rejected ? "#e03d3d" : "#fff"};
  border: ${({ $complete, $active, $rejected }) =>
    $complete || $rejected
      ? "none"
      : $active
        ? "2px solid #2671d9"
        : "2px solid #d9dce8"};
  position: relative;

  &::after {
    content: ${({ $active, $rejected }) =>
      $active && !$rejected ? '""' : "none"};
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #2671d9;
    display: block;
  }
`;

const TrackerLabel = styled.span`
  margin-top: 10px;
  font-size: 12px;
  text-align: center;
  color: #797f94;
`;

/* ─── Declaration card ────────────────────────────────────── */

const DeclarationCard = styled.div`
  width: 100%;
  border-radius: 12px;
  background: #f5f6fa;
  border: 1px solid #e8eaf0;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
`;

const CardTitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const CardTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #1d2d64;
`;


const CsvButton = styled.button`
  border: none;
  background: transparent;
  color: #2671d9;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
`;

const DetailsGrid = styled.div`
  display: flex;
  align-items: stretch;
  gap: 0;
`;

const DetailItem = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 24px 0 0;

  &:first-child {
    padding-left: 0;
  }
`;

const DetailDivider = styled.div`
  width: 1px;
  background: #d9dce8;
  margin: 0 24px 0 0;
  align-self: stretch;
`;

const DetailLabel = styled.span`
  font-size: 13px;
  color: #797f94;
`;

const DetailValue = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: #1d2d64;
`;

/* ─── Payment section ─────────────────────────────────────── */

const PaymentSection = styled.div`
  width: 100%;
  margin-top: 20px;
`;

const InvoiceSection = styled.div`
  width: 100%;
  margin-top: 20px;
`;

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

const InvoiceBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 28px 24px 18px;
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
  padding-right: 32px;
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

const InvoiceHeaderBlock = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #edf0f7;
  margin-bottom: 10px;
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
  border-radius: 0;
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
  border: none;
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

const InvoiceFooterNote = styled.div`
  color: #a0a7bd;
  font-size: 12px;
  margin-top: 12px;
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

const InvoiceLaunchCard = styled.div`
  width: 100%;
  border-radius: 18px;
  border: 1px solid #edf0f7;
  background: #fff;
  box-shadow: 0 20px 45px rgba(17, 24, 39, 0.06);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
`;

const InvoiceLaunchTitle = styled.h3`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1d2d64;
`;

const InvoiceLaunchText = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #616a85;
`;

const InvoiceLaunchButton = styled.button`
  cursor: pointer;
  padding: 12px 22px;
  color: #fff;
  border-radius: 999px;
  border: none;
  background: #2671d9;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;

  &:hover {
    background: #1d5cb5;
  }
`;

const PendingMessageCard = styled.div`
  width: 100%;
  margin-top: 20px;
  border-radius: 16px;
  border: 1px solid #dbe8ff;
  background: #f5f9ff;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PendingMessageTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #1d2d64;
  margin: 0;
`;

const PendingMessageText = styled.p`
  font-size: 14px;
  color: #616a85;
  line-height: 1.6;
  margin: 0;
`;

/* ─── Rejection ───────────────────────────────────────────── */

const ReasonSection = styled.div`
  width: 100%;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ReasonTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #1d2d64;
`;

const ReasonCard = styled.div`
  width: 100%;
  border-radius: 12px;
  border: 1px solid #f2c8c8;
  background: #fff6f6;
  padding: 18px 20px;
  color: #7a2f2f;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
`;

const OutlineButton = styled.button`
  cursor: pointer;
  padding: 11px 24px;
  color: #1d2025;
  border-radius: 999px;
  border: 1.5px solid #d4d6df;
  background: #fff;
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;

  &:hover {
    background: #f5f7fb;
  }
`;

const PageContainer = styled.div`
  display: flex;
  width: 90%;
  min-height: calc(100vh - 75px);
  flex-direction: column;
  padding: 32px 0 40px;
`;

const PageState = styled.div`
  display: flex;
  width: 90%;
  min-height: calc(100vh - 75px);
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
  color: #555;
`;
