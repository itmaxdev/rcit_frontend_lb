import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  downloadFullFile,
  fetchImporterDeclarationById,
  fetchImporterDeclarationInvoice,
  initiateDeclarationPayment,
} from "../../functions/impDeclare";
import ImporterInvoicePreview from "./ImporterInvoicePreview";
import PaymentSummary from "../paymentSummary";
import { StatusBadge } from "../statusBadge";

const TRACKER_COMPLETE_COLOR = "#1c9d4b";

const ImporterDeclarationDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { declarationId } = useParams();
  const [declaration, setDeclaration] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");
  const [showPaymentSummary, setShowPaymentSummary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentBusy, setPaymentBusy] = useState(false);

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
          await loadDeclaration();
        }
      );
      return;
    }

    global.alert2?.(t("Failed to initiate payment. Please try again."));
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

  const currentStatus =
    declaration.importerStatus || declaration.customsStatus || "SUBMITTED";
  const trackerSteps = getTrackerSteps(currentStatus);
  const currentStepIndex = getTrackerStepIndex(currentStatus);
  const isPaid = currentStatus === "PAID";
  const showInvoice =
    shouldLoadInvoice(currentStatus) &&
    !(currentStatus === "AWAITING_PAYMENT" && showPaymentSummary);
  const showProceedToPayment =
    currentStatus === "AWAITING_PAYMENT" &&
    invoice?.invoiceStatus !== "PAID" &&
    !showPaymentSummary;
  const showPayment = currentStatus === "AWAITING_PAYMENT" && showPaymentSummary && !!invoice;
  const showCardStatus =
    currentStatus !== "AWAITING_PAYMENT" && currentStatus !== "PAID";

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

      {showInvoice && (
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
          ) : invoice ? (
            <ImporterInvoicePreview
              invoice={invoice}
              showProceedButton={showProceedToPayment}
              onProceedToPayment={() => setShowPaymentSummary(true)}
              proceedBusy={paymentBusy}
            />
          ) : null}
        </InvoiceSection>
      )}

      {currentStatus === "APPROVED" && (
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

      {currentStatus === "DECLINED" && declaration.rejectionReason && (
        <ReasonSection>
          <ReasonTitle>{t("Rejection Reason")}</ReasonTitle>
          <ReasonCard>{declaration.rejectionReason}</ReasonCard>
        </ReasonSection>
      )}
    </PageContainer>
  );
};

const getTrackerSteps = (status) => {
  if (status === "DECLINED") return ["SUBMITTED", "UNDER_REVIEW", "DECLINED"];
  if (status === "SUBMITTED" || status === "UNDER_REVIEW") {
    return ["SUBMITTED", "UNDER_REVIEW", "AWAITING_PAYMENT"];
  }
  if (status === "PAID") return ["SUBMITTED", "APPROVED", "PAID"];
  return ["SUBMITTED", "APPROVED", "AWAITING_PAYMENT"];
};

const getTrackerStepIndex = (status) => {
  const map = {
    SUBMITTED: 0,
    UNDER_REVIEW: 1,
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

const formatStatusLabel = (t, status) => {
  const labels = {
    SUBMITTED: t("Submitted"),
    UNDER_REVIEW: t("Under Review"),
    APPROVED: t("Approved"),
    DECLINED: t("Rejected"),
    AWAITING_PAYMENT: t("Awaiting Payment"),
    PAID: t("Paid"),
  };
  return labels[status] || status || "-";
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
