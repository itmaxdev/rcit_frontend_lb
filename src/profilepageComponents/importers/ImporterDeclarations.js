import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import emptySVG from "../../assets/noRegistered.svg";
import plusSVG from "../../assets/plus.svg";
import {
  downloadFullFile,
  fetchImporterDeclarations,
} from "../../functions/impDeclare";
import {
  clearImporterUploadData,
  fetchClearableImporterUpload,
} from "../../functions/registered";

const STATUS_STYLES = {
  SUBMITTED: { background: "#e8f1ff", color: "#2671d9" },
  UNDER_REVIEW: { background: "#fff3df", color: "#f19a15" },
  APPROVED: { background: "#e5f6e7", color: "#1c9d4b" },
  DECLINED: { background: "#ffe8e8", color: "#e03d3d" },
  AWAITING_PAYMENT: { background: "#fff0e6", color: "#d55d00" },
  PAID: { background: "#e5f6e7", color: "#1c9d4b" },
};

const ImporterDeclarations = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [declarations, setDeclarations] = useState([]);
  const [clearableUpload, setClearableUpload] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDeclarations = useCallback(async () => {
    setLoading(true);
    const response = await fetchImporterDeclarations(1, 100);
    setDeclarations(response?.data || []);
    setLoading(false);
  }, []);

  const loadClearableUpload = useCallback(async () => {
    const response = await fetchClearableImporterUpload();
    setClearableUpload(response);
  }, []);

  useEffect(() => {
    loadDeclarations();
    loadClearableUpload();
  }, [loadDeclarations, loadClearableUpload]);

  const handleRegisterDevices = () => {
    navigate("/profile/role_importer/RegisterDevices");
  };

  const handleOpenDeclaration = (uploadId) => {
    navigate(`/profile/role_importer/DeclareDevices/${uploadId}`);
  };

  const handleClearData = async () => {
    if (!clearableUpload?.uploadId) {
      return;
    }

    const shouldClear = window.confirm(t("ClearData_Confirmation"));
    if (!shouldClear) {
      return;
    }

    const cleared = await clearImporterUploadData(clearableUpload.uploadId);
    if (cleared) {
      await loadDeclarations();
      await loadClearableUpload();
    }
  };

  const handleViewCsv = async (uploadId) => {
    await downloadFullFile(uploadId);
  };

  if (!loading && declarations.length === 0) {
    return (
      <EmptyStateContainer>
        <EmptyStateSVG src={emptySVG} alt="No declarations" />
        <EmptyStateTitle>
          {t("ImporterDeclarations_EmptyTitle")}
          <br />
          <span>{t("ImporterDeclarations_EmptySubtitle")}</span>
        </EmptyStateTitle>
        <Button onClick={handleRegisterDevices}>
          {t("RegisteredDevices_AddButton")}
        </Button>
      </EmptyStateContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <TextContainer>
          <Title>{t("ImporterDeclarations_Title")}</Title>
          <Subtext>{t("ImporterDeclarations_Subtitle")}</Subtext>
        </TextContainer>
        <HeaderActions>
          {clearableUpload?.uploadId && (
            <SecondaryButton type="button" onClick={handleClearData}>
              {t("Clear Data")}
            </SecondaryButton>
          )}
          <Button onClick={handleRegisterDevices}>
            <img src={plusSVG} alt="Plus" />
            {t("RegisteredDevices_AddButton")}
          </Button>
        </HeaderActions>
      </Header>

      <DeclarationsContainer>
        {loading ? (
          <LoadingState>{t("Loading")}</LoadingState>
        ) : (
          declarations.map((declaration, index) => (
            <DeclarationCard
              key={declaration.id}
              role="button"
              tabIndex={0}
              onClick={() => handleOpenDeclaration(declaration.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleOpenDeclaration(declaration.id);
                }
              }}
            >
              <CardHeader>
                <CardTitleGroup>
                  <CardTitle>{t("Declaration")} {index + 1}</CardTitle>
                  <StatusBadge $status={declaration.importerStatus || declaration.customsStatus || "SUBMITTED"}>
                    {formatStatusLabel(t, declaration.importerStatus || declaration.customsStatus || "SUBMITTED")}
                  </StatusBadge>
                </CardTitleGroup>
                <CsvButton
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleViewCsv(declaration.id);
                  }}
                >
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
            </DeclarationCard>
          ))
        )}
      </DeclarationsContainer>
    </PageContainer>
  );
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
  if (!status) {
    return "-";
  }

  const labels = {
    SUBMITTED: t("Submitted"),
    UNDER_REVIEW: t("Under Review"),
    APPROVED: t("Approved"),
    DECLINED: t("Rejected"),
    AWAITING_PAYMENT: t("Awaiting Payment"),
    PAID: t("Paid"),
  };

  return labels[status] || status;
};

export default ImporterDeclarations;

const PageContainer = styled.div`
  display: flex;
  width: 90%;
  height: calc(100vh - 75px);
  flex-direction: column;
  padding: 40px 0;
  align-items: flex-start;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  width: 100%;
  gap: 20px;
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: #1d2d64;
  margin-bottom: 10px;
`;

const Subtext = styled.p`
  font-size: 16px;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 11px 18px 11px 28px;
  gap: 6px;
  color: #fff;
  border-radius: 38px;
  border: 1px solid #436c4d;
  background: #436c4d;
  white-space: nowrap;
  font-size: 14px;
`;

const SecondaryButton = styled.button`
  cursor: pointer;
  padding: 11px 24px;
  gap: 6px;
  color: #436c4d;
  border-radius: 38px;
  border: 1px solid #436c4d;
  background: #fff;
  white-space: nowrap;
  font-size: 14px;
`;

const DeclarationsContainer = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 12px;
  border: 1px solid #d4d6df;
  background: #fff;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const DeclarationCard = styled.div`
  width: 100%;
  border-radius: 12px;
  background: #f5f6fa;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    box-shadow: 0 8px 24px rgba(29, 45, 100, 0.08);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid #2671d9;
    outline-offset: 3px;
  }
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
  font-size: 14px;
  color: #1d2025;
  font-weight: 600;
`;

const LoadingState = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #797f94;
`;

const EmptyStateContainer = styled.div`
  display: flex;
  width: 90%;
  height: calc(100vh - 75px);
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
`;

const EmptyStateSVG = styled.img`
  width: 160px;
`;

const EmptyStateTitle = styled.h2`
  text-align: center;
  color: #1d2d64;
  font-size: 18px;
  font-weight: 400;

  span {
    font-weight: 700;
  }
`;
