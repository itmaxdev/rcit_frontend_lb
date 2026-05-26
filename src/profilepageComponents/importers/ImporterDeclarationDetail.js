import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  downloadFullFile,
  fetchImporterDeclarationById,
  initiateDeclarationPayment,
} from "../../functions/impDeclare";
import PaymentSummary from "../paymentSummary";

const STATUS_STYLES = {
  SUBMITTED: { background: "#e8f1ff", color: "#2671d9" },
  UNDER_REVIEW: { background: "#fff3df", color: "#f19a15" },
  APPROVED: { background: "#e5f6e7", color: "#1c9d4b" },
  DECLINED: { background: "#ffe8e8", color: "#e03d3d" },
  AWAITING_PAYMENT: { background: "#fff0e6", color: "#d55d00" },
  PAID: { background: "#e5f6e7", color: "#1c9d4b" },
};

const ImporterDeclarationDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { declarationId } = useParams();
  const [declaration, setDeclaration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentBusy, setPaymentBusy] = useState(false);

  const loadDeclaration = useCallback(async () => {
    setLoading(true);
    const response = await fetchImporterDeclarationById(declarationId);
    setDeclaration(response);
    setLoading(false);
  }, [declarationId]);

  useEffect(() => {
    loadDeclaration();
  }, [loadDeclaration]);

  const handleBack = () => {
    navigate("/profile/role_importer/DeclareDevices");
  };

  const handleViewCsv = async () => {
    if (!declaration?.id) {
      return;
    }

    await downloadFullFile(declaration.id);
  };

  const handlePay = async () => {
    if (!declaration?.id || paymentBusy) {
      return;
    }

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
          await loadDeclaration();
        }
      );
      return;
    }

    global.alert2?.(
      t("Failed to initiate payment. Please try again.")
    );
  };

  if (loading) {
    return <PageState>{t("Loading")}</PageState>;
  }

  if (!declaration) {
    return (
      <PageState>
        <div>{t("ImporterDeclarations_EmptyTitle")}</div>
        <BackButton type="button" onClick={handleBack}>
          {t("Back to Declarations")}
        </BackButton>
      </PageState>
    );
  }

  const currentStatus =
    declaration.importerStatus || declaration.customsStatus || "SUBMITTED";
  const trackerSteps = getTrackerSteps(currentStatus);
  const currentStepIndex = getTrackerStepIndex(currentStatus, trackerSteps);

  return (
    <PageContainer>
      <TrackerContainer>
        {trackerSteps.map((step, index) => {
          const isComplete = index < currentStepIndex;
          const isActive = index === currentStepIndex;

          return (
            <TrackerStep key={step}>
              {index > 0 && (
                <TrackerLine
                  $complete={index - 1 < currentStepIndex}
                  $active={index - 1 === currentStepIndex && currentStepIndex > 0}
                />
              )}
              <TrackerMarker $complete={isComplete} $active={isActive} />
              <TrackerLabel>{formatStatusLabel(t, step)}</TrackerLabel>
            </TrackerStep>
          );
        })}
      </TrackerContainer>

      <CardContainer>
        <CardHeader>
          <CardTitleGroup>
            <CardTitle>{t("Declaration")}</CardTitle>
            <StatusBadge $status={currentStatus}>
              {formatStatusLabel(t, currentStatus)}
            </StatusBadge>
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
          <DetailItem>
            <DetailLabel>{t("Nbr of Devices")}</DetailLabel>
            <DetailValue>{declaration.devicesCount ?? 0}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>{t("Declaration Date")}</DetailLabel>
            <DetailValue>{formatDate(declaration.createdAt)}</DetailValue>
          </DetailItem>
        </DetailsGrid>
      </CardContainer>

      {currentStatus === "AWAITING_PAYMENT" && (
        <PaymentSection>
          <PaymentSummary
            data={{
              totalDeclaredValue: declaration.totalDeclaredValue,
              totalApprovedValue: declaration.totalApprovedValue,
              totalCustomsDuty: declaration.totalCustomsDuty,
              totalPayable: declaration.totalFees,
              vatAmount: declaration.vatAmount,
              dutyPercentage: declaration.dutyPercentage,
              vatPercentage: declaration.vatPercentage,
              usdToLbpRate: declaration.usdToLbpRate,
            }}
            busy={paymentBusy}
            onClose={handleBack}
            onPay={handlePay}
          />
        </PaymentSection>
      )}

      {currentStatus === "DECLINED" && declaration.rejectionReason && (
        <ReasonSection>
          <ReasonTitle>{t("Rejection Reason")}</ReasonTitle>
          <ReasonCard>{declaration.rejectionReason}</ReasonCard>
        </ReasonSection>
      )}

      <Footer>
        <BackButton type="button" onClick={handleBack}>
          {t("Back to Declarations")}
        </BackButton>
      </Footer>
    </PageContainer>
  );
};

const getTrackerSteps = (status) => {
  if (status === "DECLINED") {
    return ["SUBMITTED", "UNDER_REVIEW", "DECLINED"];
  }

  return ["SUBMITTED", "UNDER_REVIEW", "AWAITING_PAYMENT", "PAID"];
};

const getTrackerStepIndex = (status, trackerSteps) => {
  if (status === "APPROVED") {
    return trackerSteps.indexOf("AWAITING_PAYMENT");
  }

  const index = trackerSteps.indexOf(status);
  return index >= 0 ? index : 0;
};

const formatDeclarationNumber = (value) =>
  `#${String(value).padStart(6, "0")}`;

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

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

const PageContainer = styled.div`
  display: flex;
  width: 90%;
  min-height: calc(100vh - 75px);
  flex-direction: column;
  padding: 32px 0 40px;
`;

const TrackerContainer = styled.div`
  width: 100%;
  max-width: 520px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin: 0 auto 28px;
  position: relative;
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
  top: 8px;
  right: calc(50% + 16px);
  width: calc(100% - 32px);
  height: 2px;
  background: ${({ $complete, $active }) =>
    $complete || $active ? "#2d9cdb" : "#d9dce8"};
`;

const TrackerMarker = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid
    ${({ $complete, $active }) =>
      $complete || $active ? "#2d9cdb" : "#d9dce8"};
  background: ${({ $complete, $active }) =>
    $complete ? "#28b463" : $active ? "#2d9cdb" : "#ffffff"};
  z-index: 1;
`;

const TrackerLabel = styled.span`
  margin-top: 10px;
  font-size: 12px;
  color: #797f94;
  text-align: center;
`;

const CardContainer = styled.div`
  width: 100%;
  border-radius: 12px;
  background: #f5f6fa;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
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

const StatusBadge = styled.span`
  padding: 7px 12px;
  border-radius: 40px;
  font-size: 14px;
  white-space: nowrap;
  background: ${({ $status }) => STATUS_STYLES[$status]?.background || "#e8f1ff"};
  color: ${({ $status }) => STATUS_STYLES[$status]?.color || "#2671d9"};
`;

const CsvButton = styled.button`
  border: none;
  background: transparent;
  color: #2671d9;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
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

const Footer = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 32px;
`;

const PaymentSection = styled.div`
  width: 100%;
  margin-top: 28px;
`;

const ReasonSection = styled.div`
  width: 100%;
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ReasonTitle = styled.h3`
  font-size: 18px;
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
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
`;

const BackButton = styled.button`
  cursor: pointer;
  padding: 12px 24px;
  color: #ffffff;
  border-radius: 999px;
  border: 1px solid #2671d9;
  background: #2671d9;
  font-size: 14px;
  font-weight: 600;
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
