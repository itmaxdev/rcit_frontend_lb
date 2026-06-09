import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import PaymentSummary from "../paymentSummary";
import { StatusBadge } from "../statusBadge";
import {
  fetchUserDeclarationById,
  initiateUserDeclarationPayment,
} from "../../functions/indDeclare";

const TRACKER_COMPLETE_COLOR = "#1c9d4b";

const IndividualDeclarationDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { declarationId } = useParams();
  const [declaration, setDeclaration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [showPaymentSummary, setShowPaymentSummary] = useState(false);

  const loadDeclaration = useCallback(async () => {
    setLoading(true);
    const response = await fetchUserDeclarationById(declarationId);
    setDeclaration(response);
    setShowPaymentSummary(
      response?.status === "PAID" || response?.status === "CLOSED"
    );
    setLoading(false);
  }, [declarationId]);

  useEffect(() => {
    loadDeclaration();
  }, [loadDeclaration]);

  const handleBack = () => {
    navigate("/profile/role_user/DeclareDevices");
  };

  const handlePay = async () => {
    if (!declaration?.id || paymentBusy) {
      return;
    }

    setPaymentBusy(true);
    const response = await initiateUserDeclarationPayment(declaration.id);
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
          setShowPaymentSummary(true);
          await loadDeclaration();
        }
      );
      return;
    }

    global.alert2?.(t("Failed to initiate payment. Please try again."));
  };

  const paymentSummaryData = useMemo(() => {
    if (!declaration) {
      return null;
    }

    return {
      totalDeclaredValue:
        declaration.approvedValueUsd ?? declaration.declaredValueUsd,
      totalCustomsDuty: declaration.customsDutyUsd,
      totalWithDuty: declaration.totalWithDutyUsd,
      vatAmount: declaration.vatAmountUsd,
      totalPayable: declaration.totalPayableUsd,
      dutyPercentage: declaration.dutyPercentage,
      vatPercentage: declaration.vatPercentage,
      usdToLbpRate: declaration.usdToLbpRate,
    };
  }, [declaration]);

  if (loading) {
    return <PageState>{t("Loading")}</PageState>;
  }

  if (!declaration) {
    return (
      <PageState>
        <div>{t("IndividualDeclarations_EmptyTitle")}</div>
        <OutlineButton type="button" onClick={handleBack}>
          {t("Back to Declarations")}
        </OutlineButton>
      </PageState>
    );
  }

  const currentStatus = declaration.status || "SUBMITTED";
  const trackerSteps = getTrackerSteps(currentStatus);
  const currentStepIndex = getTrackerStepIndex(currentStatus);
  const showPaymentLaunch =
    currentStatus === "AWAITING_PAYMENT" && !showPaymentSummary;
  const showPaymentSection =
    currentStatus === "PAID" ||
    currentStatus === "CLOSED" ||
    (currentStatus === "AWAITING_PAYMENT" && showPaymentSummary);
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
              {index > 0 && <TrackerLine $complete={index <= currentStepIndex} />}
              <TrackerMarker
                $complete={isComplete}
                $active={isActive}
                $rejected={isActive && step === "DECLINED"}
              >
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
                    <path d="M3 3L11 11" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <path d="M11 3L3 11" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </TrackerMarker>
              <TrackerLabel>{formatStatusLabel(t, step)}</TrackerLabel>
            </TrackerStep>
          );
        })}
      </TrackerContainer>

      <DeclarationCard>
        <CardHeader>
          <CardTitleGroup>
            <CardTitle>{t("Declaration")} {declaration.id}</CardTitle>
            {showCardStatus && (
              <StatusBadge $status={currentStatus}>
                {formatStatusLabel(t, currentStatus)}
              </StatusBadge>
            )}
          </CardTitleGroup>
        </CardHeader>

        <DetailsGrid>
          <DetailItem>
            <DetailLabel>{t("Declaration Number")}</DetailLabel>
            <DetailValue>{declaration.declarationNumber}</DetailValue>
          </DetailItem>
          <DetailDivider />
          <DetailItem>
            <DetailLabel>{t("Nbr of Devices")}</DetailLabel>
            <DetailValue>{declaration.devicesCount}</DetailValue>
          </DetailItem>
          <DetailDivider />
          <DetailItem>
            <DetailLabel>{t("Declaration Date")}</DetailLabel>
            <DetailValue>{formatDate(declaration.declarationDate)}</DetailValue>
          </DetailItem>
          <DetailDivider />
          <DetailItem>
            <DetailLabel>{t("Import Date")}</DetailLabel>
            <DetailValue>{formatDate(declaration.importDate)}</DetailValue>
          </DetailItem>
        </DetailsGrid>
      </DeclarationCard>

      {showPaymentLaunch && (
        <ActionSection>
          <ActionLaunchCard>
            <ActionLaunchTitle>{t("Awaiting Payment")}</ActionLaunchTitle>
            <ActionLaunchText>
              {t("IndividualDeclarations_AwaitingPaymentText")}
            </ActionLaunchText>
            <ActionLaunchButton
              type="button"
              onClick={() => setShowPaymentSummary(true)}
            >
              {t("Proceed to Payment")}
            </ActionLaunchButton>
          </ActionLaunchCard>
        </ActionSection>
      )}

      <InfoCard>
        <InfoCardTitle>{t("DeviceInfo_Details")}</InfoCardTitle>
        <DeviceGrid>
          <DeviceItem>
            <DetailLabel>{t("Brand")}</DetailLabel>
            <DetailValue>{declaration.brand || "-"}</DetailValue>
          </DeviceItem>
          <DeviceItem>
            <DetailLabel>{t("Model")}</DetailLabel>
            <DetailValue>{declaration.model || "-"}</DetailValue>
          </DeviceItem>
          <DeviceItem>
            <DetailLabel>{t("Device Type")}</DetailLabel>
            <DetailValue>{declaration.technology || "-"}</DetailValue>
          </DeviceItem>
        </DeviceGrid>

        <ImeiSection>
          <DetailLabel>{t("IMEIs")}</DetailLabel>
          <ImeiList>
            {(declaration.imeis || []).map((imei) => (
              <ImeiPill key={imei}>{imei}</ImeiPill>
            ))}
          </ImeiList>
        </ImeiSection>
      </InfoCard>

      {(currentStatus === "SUBMITTED" ||
        currentStatus === "UNDER_REVIEW" ||
        currentStatus === "DECLINED") && (
        <InfoStateCard>
          <InfoStateTitle>{getInfoTitle(t, currentStatus)}</InfoStateTitle>
          <InfoStateText>{getInfoText(t, currentStatus)}</InfoStateText>
          {currentStatus === "DECLINED" && declaration.rejectionReason && (
            <ReasonBlock>
              <ReasonLabel>{t("Rejection Reason")}</ReasonLabel>
              <ReasonText>{declaration.rejectionReason}</ReasonText>
            </ReasonBlock>
          )}
        </InfoStateCard>
      )}

      {showPaymentSection && paymentSummaryData && (
        <PaymentSection>
          <PaymentSummary
            data={paymentSummaryData}
            busy={paymentBusy}
            onPay={handlePay}
            paid={currentStatus === "PAID" || currentStatus === "CLOSED"}
            baseValueLabel={
              declaration.approvedValueUsd != null
                ? t("Total Approved Value")
                : t("Total Declared Value (USD)")
            }
          />
        </PaymentSection>
      )}

      <FooterRow>
        <OutlineButton type="button" onClick={handleBack}>
          {t("Back to Declarations")}
        </OutlineButton>
      </FooterRow>
    </PageContainer>
  );
};

export default IndividualDeclarationDetail;

const getTrackerSteps = (status) => {
  if (status === "DECLINED") {
    return ["SUBMITTED", "UNDER_REVIEW", "DECLINED"];
  }
  if (status === "CLOSED") {
    return ["SUBMITTED", "UNDER_REVIEW", "AWAITING_PAYMENT", "PAID", "CLOSED"];
  }

  return ["SUBMITTED", "UNDER_REVIEW", "AWAITING_PAYMENT", "PAID"];
};

const getTrackerStepIndex = (status) => {
  switch (status) {
    case "SUBMITTED":
      return 0;
    case "UNDER_REVIEW":
      return 1;
    case "AWAITING_PAYMENT":
      return 2;
    case "PAID":
      return 3;
    case "CLOSED":
      return 4;
    case "DECLINED":
      return 2;
    default:
      return 0;
  }
};

const formatStatusLabel = (t, status) => {
  switch (status) {
    case "SUBMITTED":
      return t("Submitted");
    case "UNDER_REVIEW":
      return t("Under Review");
    case "AWAITING_PAYMENT":
      return t("Awaiting Payment");
    case "PAID":
      return t("Paid");
    case "CLOSED":
      return t("Closed");
    case "DECLINED":
      return t("Rejected");
    default:
      return status;
  }
};

const getInfoTitle = (t, status) => {
  if (status === "UNDER_REVIEW") {
    return t("IndividualDeclarations_UnderReviewTitle");
  }
  if (status === "DECLINED") {
    return t("Rejected");
  }
  return t("Submitted");
};

const getInfoText = (t, status) => {
  if (status === "UNDER_REVIEW") {
    return t("IndividualDeclarations_UnderReviewText");
  }
  if (status === "DECLINED") {
    return t("IndividualDeclarations_RejectedText");
  }
  return t("IndividualDeclarations_SubmittedText");
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }
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

const PageContainer = styled.div`
  width: 90%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 36px 0 30px;
`;

const PageState = styled.div`
  width: 100%;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16px;
  color: #6f7897;
`;

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
  border:
    ${({ $complete, $active, $rejected }) =>
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

const DeclarationCard = styled.div`
  background: #fff;
  border: 1px solid #e8eaf0;
  border-radius: 16px;
  padding: 24px 28px;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
`;

const CardTitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const CardTitle = styled.h2`
  margin: 0;
  font-size: 24px;
  color: #1d2025;
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const DetailLabel = styled.span`
  font-size: 13px;
  color: #6f7897;
`;

const DetailValue = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #1d2025;
`;

const DetailDivider = styled.div`
  display: none;
`;

const InfoCard = styled.div`
  background: #fff;
  border: 1px solid #e8eaf0;
  border-radius: 16px;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InfoCardTitle = styled.h3`
  font-size: 20px;
  color: #1d2025;
  margin: 0;
`;

const DeviceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const DeviceItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ImeiSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ImeiList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const ImeiPill = styled.span`
  padding: 10px 14px;
  border-radius: 999px;
  background: #f5f6fa;
  color: #20294c;
  font-size: 14px;
  font-weight: 500;
`;

const InfoStateCard = styled.div`
  background: #fff;
  border: 1px solid #e8eaf0;
  border-radius: 16px;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ActionSection = styled.div`
  width: 100%;
  margin-top: -4px;
`;

const ActionLaunchCard = styled.div`
  background: #fff;
  border: 1px solid #e8eaf0;
  border-radius: 16px;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const ActionLaunchTitle = styled.h3`
  margin: 0;
  font-size: 20px;
  color: #20294c;
`;

const ActionLaunchText = styled.p`
  margin: 0;
  font-size: 15px;
  color: #6f7897;
  line-height: 1.6;
`;

const ActionLaunchButton = styled.button`
  align-self: flex-start;
  border: none;
  border-radius: 999px;
  background: #1f4fd7;
  color: #fff;
  padding: 12px 22px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`;

const PaymentSection = styled.div`
  width: 100%;
`;

const InfoStateTitle = styled.h3`
  margin: 0;
  font-size: 20px;
  color: #20294c;
`;

const InfoStateText = styled.p`
  margin: 0;
  font-size: 15px;
  color: #6f7897;
  line-height: 1.6;
`;

const ReasonBlock = styled.div`
  margin-top: 12px;
  padding: 16px;
  border-radius: 12px;
  background: #fff5f5;
`;

const ReasonLabel = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #a23d3d;
  margin-bottom: 8px;
`;

const ReasonText = styled.div`
  font-size: 14px;
  color: #5b2d2d;
  line-height: 1.5;
`;

const FooterRow = styled.div`
  display: flex;
  justify-content: flex-start;
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
