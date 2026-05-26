import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import emptySVG from "../../assets/noRegistered.svg";
import plusSVG from "../../assets/plus.svg";
import searchSVG from "../../assets/search3.svg";
import eyeSVG from "../../assets/eye.svg";
import {
  downloadFullFile,
  fetchImporterDeclarations,
} from "../../functions/impDeclare";
import {
  clearImporterUploadData,
  fetchClearableImporterUpload,
} from "../../functions/registered";

const STATUS_STYLES = {
  SUBMITTED: {
    background: "#e8f1ff",
    color: "#2671d9",
    icon: "dot",
    iconColor: "#2671d9",
  },
  UNDER_REVIEW: {
    background: "#fff3df",
    color: "#f19a15",
    icon: "clock",
    iconColor: "#f19a15",
  },
  APPROVED: {
    background: "#e5f6e7",
    color: "#1c9d4b",
    icon: "check",
    iconColor: "#1c9d4b",
  },
  DECLINED: {
    background: "#ffe8e8",
    color: "#e03d3d",
    icon: "cross",
    iconColor: "#e03d3d",
  },
  AWAITING_PAYMENT: {
    background: "#fff0e6",
    color: "#d55d00",
    icon: "flag",
    iconColor: "#e03d3d",
  },
  PAID: {
    background: "#eef6ef",
    color: "#516275",
    icon: "check",
    iconColor: "#1c9d4b",
  },
};

const ImporterDeclarations = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [declarations, setDeclarations] = useState([]);
  const [clearableUpload, setClearableUpload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadDeclarations = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    const response = await fetchImporterDeclarations(1, 100);
    if (!response) {
      setDeclarations([]);
      setLoadError(true);
      setLoading(false);
      return;
    }
    setDeclarations(response.data || []);
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

  const filteredDeclarations = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return declarations;
    }

    return declarations.filter((declaration) => {
      const declarationNumber = formatDeclarationNumber(declaration.id).toLowerCase();
      const status = formatStatusLabel(
        t,
        declaration.importerStatus || declaration.customsStatus || "SUBMITTED"
      ).toLowerCase();
      const filename = (declaration.originalFilename || "").toLowerCase();

      return (
        declarationNumber.includes(normalizedQuery) ||
        status.includes(normalizedQuery) ||
        filename.includes(normalizedQuery)
      );
    });
  }, [declarations, searchQuery, t]);

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

  const handleViewCsv = async (event, uploadId) => {
    event.stopPropagation();
    await downloadFullFile(uploadId);
  };

  if (!loading && declarations.length === 0) {
    if (loadError) {
      return (
        <EmptyStateContainer>
          <EmptyStateSVG src={emptySVG} alt="Failed to load declarations" />
          <EmptyStateTitle>{t("ImporterDeclarations_LoadError")}</EmptyStateTitle>
          <EmptyActions>
            <SecondaryButton type="button" onClick={loadDeclarations}>
              {t("Retry")}
            </SecondaryButton>
            <Button onClick={handleRegisterDevices}>
              {t("Import New Devices")}
            </Button>
          </EmptyActions>
        </EmptyStateContainer>
      );
    }

    return (
      <EmptyStateContainer>
        <EmptyStateSVG src={emptySVG} alt="No declarations" />
        <EmptyStateTitle>
          {t("ImporterDeclarations_EmptyTitle")}
          <br />
          <span>{t("ImporterDeclarations_EmptySubtitle")}</span>
        </EmptyStateTitle>
        <Button onClick={handleRegisterDevices}>
          {t("Import New Devices")}
        </Button>
      </EmptyStateContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <TextContainer>
          <Title>{t("ImporterDeclarations_TableTitle")}</Title>
          <Subtext>{t("ImporterDeclarations_TableSubtitle")}</Subtext>
        </TextContainer>
        <HeaderActions>
          {clearableUpload?.uploadId && (
            <SecondaryButton type="button" onClick={handleClearData}>
              {t("Clear Data")}
            </SecondaryButton>
          )}
          <Button onClick={handleRegisterDevices}>
            <img src={plusSVG} alt="Plus" />
            {t("Import New Devices")}
          </Button>
        </HeaderActions>
      </Header>

      <TableCard>
        <Toolbar>
          <SearchBar>
            <SearchIcon src={searchSVG} alt="Search" />
            <SearchInput
              type="text"
              placeholder={t("ImporterDeclarations_SearchPlaceholder")}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </SearchBar>

          <ResultsText>
            {filteredDeclarations.length} {t("Out of")} {declarations.length}
          </ResultsText>
        </Toolbar>

        <TableWrapper>
          {loading ? (
            <LoadingState>{t("Loading")}</LoadingState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t("Dec ID")}</Th>
                  <Th>{t("Declaration Number")}</Th>
                  <Th>{t("Nbr of declared devices")}</Th>
                  <Th>{t("Declaration Date")}</Th>
                  <Th>{t("Status")}</Th>
                  <Th>{t("Customs Duty (USD)")}</Th>
                  <Th>{t("Actions")}</Th>
                </tr>
              </thead>
              <tbody>
                {filteredDeclarations.length === 0 ? (
                  <tr>
                    <EmptyTableCell colSpan="7">
                      {t("ImporterDeclarations_NoSearchResults")}
                    </EmptyTableCell>
                  </tr>
                ) : (
                  filteredDeclarations.map((declaration, index) => {
                    const currentStatus =
                      declaration.importerStatus ||
                      declaration.customsStatus ||
                      "SUBMITTED";

                    return (
                      <Row
                        key={declaration.id}
                        tabIndex={0}
                        onClick={() => handleOpenDeclaration(declaration.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleOpenDeclaration(declaration.id);
                          }
                        }}
                      >
                        <Td>{index + 1}</Td>
                        <DeclarationNumberCell>
                          {formatDeclarationNumber(declaration.id)}
                        </DeclarationNumberCell>
                        <Td>{declaration.devicesCount ?? 0}</Td>
                        <Td>{formatDate(declaration.createdAt)}</Td>
                        <Td>
                          <StatusBadge $status={currentStatus}>
                            <StatusIcon status={currentStatus} />
                            <span>{formatStatusLabel(t, currentStatus)}</span>
                          </StatusBadge>
                        </Td>
                        <Td>{formatMoney(declaration.totalCustomsDuty)}</Td>
                        <Td>
                          <ViewButton
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenDeclaration(declaration.id);
                            }}
                          >
                            <img src={eyeSVG} alt="" aria-hidden="true" />
                            <span>{t("View Details")}</span>
                          </ViewButton>
                          <CsvLink
                            type="button"
                            onClick={(event) => handleViewCsv(event, declaration.id)}
                          >
                            {t("View CSV")}
                          </CsvLink>
                        </Td>
                      </Row>
                    );
                  })
                )}
              </tbody>
            </Table>
          )}
        </TableWrapper>
      </TableCard>
    </PageContainer>
  );
};

const StatusIcon = ({ status }) => {
  const iconColor = STATUS_STYLES[status]?.iconColor || "#2671d9";
  const icon = STATUS_STYLES[status]?.icon || "dot";

  if (icon === "check") {
    return (
      <StatusSvg viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M3.5 8.2L6.5 11.2L12.3 5.4"
          stroke={iconColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </StatusSvg>
    );
  }

  if (icon === "cross") {
    return (
      <StatusSvg viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M4.3 4.3L11.7 11.7M11.7 4.3L4.3 11.7"
          stroke={iconColor}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </StatusSvg>
    );
  }

  if (icon === "clock") {
    return (
      <StatusSvg viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="5.2" stroke={iconColor} strokeWidth="1.6" fill="none" />
        <path
          d="M8 5.2V8.3L10.1 9.4"
          stroke={iconColor}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </StatusSvg>
    );
  }

  if (icon === "flag") {
    return (
      <StatusSvg viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M4 3.5V12.5"
          stroke={iconColor}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M4.8 4.2H11.5L9.8 6.3L11.5 8.4H4.8V4.2Z"
          fill={iconColor}
        />
      </StatusSvg>
    );
  }

  return <StatusDot $color={iconColor} />;
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

const formatMoney = (value) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

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
  min-height: calc(100vh - 75px);
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

const TableCard = styled.div`
  width: 100%;
  border-radius: 12px;
  border: 1px solid #d4d6df;
  background: #fff;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
`;

const SearchBar = styled.div`
  width: 100%;
  max-width: 320px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 999px;
  border: 1px solid #d4d6df;
  background: #fff;
  padding: 0 16px;
`;

const SearchIcon = styled.img`
  width: 18px;
  height: 18px;
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  padding: 12px 0;
  font-size: 14px;
  background: transparent;
`;

const ResultsText = styled.div`
  color: #6f7897;
  font-size: 13px;
  white-space: nowrap;
`;

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  thead tr {
    background: #f7f8fc;
  }
`;

const Th = styled.th`
  text-align: left;
  color: #6f7897;
  font-size: 12px;
  font-weight: 500;
  padding: 12px 14px;
`;

const Row = styled.tr`
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: #fafbff;
  }

  &:focus-visible {
    outline: 2px solid #2671d9;
    outline-offset: -2px;
  }
`;

const Td = styled.td`
  padding: 14px;
  border-top: 1px solid #edf0f7;
  color: #1d2025;
  font-size: 13px;
  vertical-align: middle;
`;

const DeclarationNumberCell = styled(Td)`
  color: #1d2d64;
  font-weight: 700;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 999px;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 500;
  background: ${({ $status }) => STATUS_STYLES[$status]?.background || "#e8f1ff"};
  color: ${({ $status }) => STATUS_STYLES[$status]?.color || "#2671d9"};
`;

const StatusDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const StatusSvg = styled.svg`
  width: 14px;
  height: 14px;
  flex-shrink: 0;
`;

const ViewButton = styled.button`
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #1d2025;
  font-size: 13px;
  cursor: pointer;
  margin-right: 12px;

  img {
    width: 16px;
    height: 16px;
  }
`;

const CsvLink = styled.button`
  border: none;
  background: transparent;
  color: #2671d9;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
`;

const LoadingState = styled.div`
  width: 100%;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #797f94;
`;

const EmptyTableCell = styled.td`
  padding: 28px 16px;
  text-align: center;
  color: #797f94;
  border-top: 1px solid #edf0f7;
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

const EmptyActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;
