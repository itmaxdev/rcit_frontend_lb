import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
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

    try {
      const canvas = await renderInvoiceToCanvas(invoice, t);
      const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.98);
      const pdfBlob = createPdfFromJpegDataUrl(
        jpegDataUrl,
        canvas.width,
        canvas.height
      );
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${invoice.invoiceNumber || "invoice"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (error) {
      console.error("Failed to generate importer invoice PDF", error);
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
                <InvoiceCloseButton
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                >
                  &#x2715;
                </InvoiceCloseButton>

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
              </>
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

const renderInvoiceToCanvas = async (invoice, t) => {
  if (!invoice) {
    throw new Error("Invoice data is missing");
  }

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const scale = Math.max(2, Math.min(window.devicePixelRatio || 1, 3));
  const width = 1180;
  const height = 830;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas context is unavailable");
  }

  context.scale(scale, scale);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  const logo = await loadImage(ministryLogo);
  const cardX = 24;
  const cardY = 24;
  const cardWidth = width - 48;
  const cardHeight = height - 48;

  drawRoundedRect(context, cardX, cardY, cardWidth, cardHeight, 22, "#ffffff");
  drawRoundedBorder(context, cardX, cardY, cardWidth, cardHeight, 22, "#dfe4ef", 1);

  let cursorY = 58;
  const leftX = 52;
  const rightX = width - 72;

  context.drawImage(logo, leftX, cursorY, 56, 56);
  drawText(context, t("Republic of Lebanon"), leftX + 74, cursorY + 10, {
    size: 13,
    color: "#8a93ad",
  });
  drawText(context, t("Ministry of Finance"), leftX + 74, cursorY + 32, {
    size: 19,
    color: "#1d2025",
    weight: 700,
  });
  drawText(context, t("Customs Directorate"), leftX + 74, cursorY + 56, {
    size: 17,
    color: "#1d2025",
    weight: 600,
  });

  drawText(context, t("Invoice"), rightX, cursorY + 18, {
    size: 18,
    color: "#1d2025",
    weight: 700,
    align: "right",
  });
  drawText(context, invoice.invoiceNumber || t("Invoice"), rightX, cursorY + 48, {
    size: 20,
    color: "#1d2025",
    weight: 700,
    align: "right",
  });

  cursorY += 90;
  drawLine(context, 48, cursorY, width - 48, cursorY, "#edf0f7", 1);
  cursorY += 24;

  const rowGap = 54;
  const metaColumns = [52, 410, 768];

  drawMetaBlock(context, metaColumns[0], cursorY, t("Declaration No."), invoice.declarationNumber);
  drawMetaBlock(context, metaColumns[1], cursorY, t("Devices Count"), String(invoice.devicesCount ?? 0));
  drawMetaBlock(context, metaColumns[2], cursorY, t("Importer"), invoice.importerName || "-");

  drawMetaBlock(context, metaColumns[0], cursorY + rowGap, t("Issue Date"), formatLongDate(invoice.issueDate));
  drawMetaBlock(context, metaColumns[1], cursorY + rowGap, t("Currency"), invoice.currency || "USD");
  drawMetaBlock(context, metaColumns[2], cursorY + rowGap, t("Declaration Date"), formatLongDate(invoice.declarationDate));

  drawMetaBlock(context, metaColumns[0], cursorY + rowGap * 2, t("Payment Status"), "", {
    drawBadge: true,
    badgeText: formatInvoiceStatusLabel(t, invoice.invoiceStatus),
    badgeStatus: invoice.invoiceStatus === "PAID" ? "PAID" : "AWAITING_PAYMENT",
  });

  cursorY += rowGap * 2 + 64;
  drawLine(context, 48, cursorY, width - 48, cursorY, "#edf0f7", 1);
  cursorY += 22;

  const summaryX = 48;
  const summaryWidth = width - 96;
  const rowHeight = 56;
  const labelX = summaryX + 8;
  const valueX = summaryX + summaryWidth - 8;

  drawSummaryRow(
    context,
    labelX,
    valueX,
    cursorY,
    t("Total Approved Value"),
    formatInvoiceMoney(invoice.approvedValueUsd),
    rowHeight
  );
  cursorY += rowHeight;
  drawSummaryRow(
    context,
    labelX,
    valueX,
    cursorY,
    `${t("Total Customs Duty")} (${Number(invoice.dutyPercentage || 0).toFixed(0)}%)`,
    formatInvoiceMoney(invoice.customsDutyUsd),
    rowHeight,
    { valueBold: true }
  );
  cursorY += rowHeight;
  drawSummaryRow(
    context,
    labelX,
    valueX,
    cursorY,
    t("Total (Approved Value + Customs Duty)"),
    formatInvoiceMoney(invoice.totalWithDutyUsd),
    rowHeight
  );
  cursorY += rowHeight;
  drawSummaryRow(
    context,
    labelX,
    valueX,
    cursorY,
    `${t("VAT")} (${Number(invoice.vatPercentage || 0).toFixed(0)}%)`,
    `+${formatInvoiceMoney(invoice.vatAmountUsd)}`,
    rowHeight,
    { valueBold: true, drawDivider: false }
  );
  cursorY += rowHeight + 14;

  drawRoundedRect(context, 48, cursorY, width - 96, 106, 16, "#f7fbf7");
  drawText(context, t("TOTAL PAYABLE"), 68, cursorY + 42, {
    size: 18,
    color: "#1d2025",
    weight: 700,
  });
  drawText(context, `(${t("TOTAL CUSTOMS DUTY + VAT")})`, 244, cursorY + 42, {
    size: 16,
    color: "#3f7f50",
  });
  drawText(context, formatInvoiceMoney(invoice.totalPayableUsd), width - 72, cursorY + 40, {
    size: 28,
    color: "#1b5e20",
    weight: 800,
    align: "right",
  });
  drawText(
    context,
    `≈ ${(Number(invoice.totalPayableUsd || 0) * Number(invoice.usdToLbpRate || 0)).toLocaleString()} LBP`,
    width - 72,
    cursorY + 70,
    {
      size: 13,
      color: "#6f7897",
      align: "right",
    }
  );
  drawText(
    context,
    `${t("Exchange Rate")}: ${Number(invoice.usdToLbpRate || 0).toLocaleString()} USD/LBP`,
    width - 72,
    cursorY + 92,
    {
      size: 11,
      color: "#98a0b7",
      align: "right",
    }
  );

  cursorY += 132;
  drawText(
    context,
    invoice.invoiceStatus === "PAID"
      ? t("Thank you. Payment received")
      : t("Invoice generated. Awaiting payment."),
    48,
    cursorY,
    {
      size: 13,
      color: "#a0a7bd",
    }
  );

  return canvas;
};

const loadImage = (source) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });

const createPdfFromJpegDataUrl = (jpegDataUrl, widthPx, heightPx) => {
  const base64 = jpegDataUrl.split(",")[1];
  const imageBytes = base64ToUint8Array(base64);
  const pageWidth = Number((widthPx * 0.75).toFixed(2));
  const pageHeight = Number((heightPx * 0.75).toFixed(2));
  const contentStream = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ`;

  const parts = [encodePdfText("%PDF-1.4\n")];
  const offsets = [0];
  const objects = [
    `<< /Type /Catalog /Pages 2 0 R >>`,
    `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
    {
      header: `<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`,
      bytes: imageBytes,
      footer: "\nendstream",
    },
    {
      header: `<< /Length ${contentStream.length} >>\nstream\n`,
      bytes: encodePdfText(contentStream),
      footer: "\nendstream",
    },
  ];

  objects.forEach((object, index) => {
    offsets.push(totalLength(parts));
    parts.push(encodePdfText(`${index + 1} 0 obj\n`));
    if (typeof object === "string") {
      parts.push(encodePdfText(object));
    } else {
      parts.push(encodePdfText(object.header));
      parts.push(object.bytes);
      parts.push(encodePdfText(object.footer));
    }
    parts.push(encodePdfText("\nendobj\n"));
  });

  const xrefOffset = totalLength(parts);
  parts.push(encodePdfText(`xref\n0 ${objects.length + 1}\n`));
  parts.push(encodePdfText("0000000000 65535 f \n"));
  offsets.slice(1).forEach((offset) => {
    parts.push(encodePdfText(`${String(offset).padStart(10, "0")} 00000 n \n`));
  });
  parts.push(
    encodePdfText(
      `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
    )
  );

  return new Blob(parts, { type: "application/pdf" });
};

const totalLength = (parts) =>
  parts.reduce((sum, part) => sum + part.length, 0);

const encodePdfText = (text) => new TextEncoder().encode(text);

const base64ToUint8Array = (base64) => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const drawRoundedRect = (context, x, y, width, height, radius, fillStyle) => {
  context.save();
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
  context.fillStyle = fillStyle;
  context.fill();
  context.restore();
};

const drawRoundedBorder = (context, x, y, width, height, radius, strokeStyle, lineWidth) => {
  context.save();
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;
  context.stroke();
  context.restore();
};

const drawText = (context, text, x, y, options = {}) => {
  const {
    size = 14,
    weight = 400,
    color = "#1d2025",
    align = "left",
  } = options;
  context.save();
  context.fillStyle = color;
  context.font = `${weight} ${size}px Arial`;
  context.textAlign = align;
  context.textBaseline = "top";
  context.fillText(text ?? "", x, y);
  context.restore();
};

const drawLine = (context, x1, y1, x2, y2, color, width) => {
  context.save();
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.strokeStyle = color;
  context.lineWidth = width;
  context.stroke();
  context.restore();
};

const drawMetaBlock = (context, x, y, label, value, options = {}) => {
  drawText(context, label, x, y, {
    size: 13,
    color: "#7d86a3",
  });

  if (options.drawBadge) {
    drawStatusBadge(context, x, y + 28, options.badgeText, options.badgeStatus);
    return;
  }

  drawText(context, value ?? "-", x, y + 28, {
    size: 17,
    weight: 700,
    color: "#1d2025",
  });
};

const drawStatusBadge = (context, x, y, text, status) => {
  const background = status === "PAID" ? "#ebf9ef" : "#fff5e8";
  const color = status === "PAID" ? "#0da44b" : "#ff9800";
  const textWidth = context.measureText(text).width;
  const width = Math.max(112, textWidth + 34);
  const height = 30;
  const radius = 15;

  drawRoundedRect(context, x, y, width, height, radius, background);

  if (status !== "PAID") {
    context.save();
    context.strokeStyle = color;
    context.lineWidth = 1.4;
    context.beginPath();
    context.moveTo(x + 12, y + 7);
    context.lineTo(x + 12, y + 23);
    context.stroke();
    context.beginPath();
    context.moveTo(x + 13.5, y + 8.5);
    context.lineTo(x + 22, y + 8.5);
    context.quadraticCurveTo(x + 24.5, y + 8.5, x + 24.5, y + 11);
    context.quadraticCurveTo(x + 24.5, y + 12, x + 23.9, y + 13);
    context.lineTo(x + 21.5, y + 17);
    context.quadraticCurveTo(x + 21, y + 17.8, x + 21.5, y + 18.6);
    context.lineTo(x + 23.9, y + 22.6);
    context.quadraticCurveTo(x + 24.5, y + 23.6, x + 24.5, y + 24.6);
    context.quadraticCurveTo(x + 24.5, y + 27.1, x + 22, y + 27.1);
    context.lineTo(x + 13.5, y + 27.1);
    context.closePath();
    context.fillStyle = color;
    context.fill();
    context.restore();
  }

  drawText(context, text, x + (status === "PAID" ? 14 : 34), y + 8, {
    size: 14,
    color,
  });
};

const drawSummaryRow = (
  context,
  labelX,
  valueX,
  y,
  label,
  value,
  height,
  options = {}
) => {
  const { valueBold = false, drawDivider = true } = options;
  drawText(context, label, labelX, y + 16, {
    size: 14,
    weight: 400,
    color: "#1d2025",
  });
  drawText(context, value, valueX, y + 16, {
    size: 14,
    weight: valueBold ? 700 : 400,
    color: "#1d2025",
    align: "right",
  });
  if (drawDivider) {
    drawLine(context, 48, y + height, 1132, y + height, "#edf0f7", 1);
  }
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
  background: #fff;
  border-radius: 18px;
  padding: 28px 24px 18px;
  border: 1px solid #edf0f7;
  overflow-y: auto;
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
  margin-top: 18px;

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
