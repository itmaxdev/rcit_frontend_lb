import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { StatusBadge, StatusIcon } from "../statusBadge";

const ImporterDeclarations = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [declarations, setDeclarations] = useState([]);
  const [clearableUpload, setClearableUpload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [selectedRows, setSelectedRows] = useState(new Set());

  const menuRef = useRef(null);

  useEffect(() => {
    if (!openMenuId) return;
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    const handleScroll = () => setOpenMenuId(null);
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [openMenuId]);

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

  const allSelected =
    filteredDeclarations.length > 0 &&
    filteredDeclarations.every((d) => selectedRows.has(d.id));
  const someSelected = filteredDeclarations.some((d) => selectedRows.has(d.id));

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(new Set(filteredDeclarations.map((d) => d.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
                  <Th>
                    <StyledCheckbox
                      type="checkbox"
                      aria-label="select all"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected && !allSelected;
                      }}
                      onChange={handleSelectAll}
                    />
                  </Th>
                  <Th>{t("Declaration Number")}</Th>
                  <Th>{t("Declaration Date")}</Th>
                  <Th>{t("Nbr of declared devices")}</Th>
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
                      <TableRow key={declaration.id}>
                        <Td>
                          <StyledCheckbox
                            type="checkbox"
                            aria-label={`select ${formatDeclarationNumber(declaration.id)}`}
                            checked={selectedRows.has(declaration.id)}
                            onChange={() => handleSelectRow(declaration.id)}
                          />
                        </Td>
                        <DeclarationNumberCell>
                          {formatDeclarationNumber(declaration.id)}
                        </DeclarationNumberCell>
                        <Td>{formatDate(declaration.createdAt)}</Td>
                        <Td>{declaration.devicesCount ?? 0}</Td>
                        <Td>
                          <StatusBadge $status={currentStatus}>
                            <StatusIcon status={currentStatus} />
                            <span>{formatStatusLabel(t, currentStatus)}</span>
                          </StatusBadge>
                        </Td>
                        <Td>{formatMoney(declaration.totalCustomsDuty)}</Td>
                        <Td>
                          <ActionCell>
                            <ActionButton
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (openMenuId === declaration.id) {
                                  setOpenMenuId(null);
                                  return;
                                }
                                const rect = e.currentTarget.getBoundingClientRect();
                                setMenuPosition({
                                  top: rect.bottom + 6,
                                  right: window.innerWidth - rect.right,
                                });
                                setOpenMenuId(declaration.id);
                              }}
                            >
                              &#8942;
                            </ActionButton>
                            {openMenuId === declaration.id && (
                              <ActionMenu
                                ref={menuRef}
                                $top={menuPosition.top}
                                $right={menuPosition.right}
                              >
                                <ActionMenuButton
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleOpenDeclaration(declaration.id);
                                  }}
                                >
                                  <ActionLabel>
                                    <ActionIcon
                                      src={eyeSVG}
                                      alt=""
                                      aria-hidden="true"
                                    />
                                    <span>{t("View Details")}</span>
                                  </ActionLabel>
                                </ActionMenuButton>
                                {(currentStatus === "AWAITING_PAYMENT" || currentStatus === "PAID") && (
                                  <ActionMenuButton
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      handleOpenDeclaration(declaration.id);
                                    }}
                                  >
                                    <ActionLabel>
                                      <ActionSvg
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        aria-hidden="true"
                                      >
                                        <rect
                                          x="2.5"
                                          y="5"
                                          width="15"
                                          height="11"
                                          rx="2"
                                          stroke="#1D2025"
                                          strokeWidth="1.5"
                                        />
                                        <path
                                          d="M2.5 8.5H17.5"
                                          stroke="#1D2025"
                                          strokeWidth="1.5"
                                          strokeLinecap="round"
                                        />
                                        <rect
                                          x="5"
                                          y="11.5"
                                          width="3"
                                          height="1.5"
                                          rx="0.5"
                                          fill="#1D2025"
                                        />
                                      </ActionSvg>
                                      <span>{t("View Invoice")}</span>
                                    </ActionLabel>
                                  </ActionMenuButton>
                                )}
                                <ActionMenuButton
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleViewCsv(declaration.id);
                                  }}
                                >
                                  <ActionLabel>
                                    <ActionSvg
                                      viewBox="0 0 20 20"
                                      fill="none"
                                      aria-hidden="true"
                                    >
                                      <path
                                        d="M10 3.333V13.333M10 13.333L6.667 10M10 13.333L13.333 10"
                                        stroke="#1D2025"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                      <path
                                        d="M3.333 15.833H16.667"
                                        stroke="#1D2025"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                      />
                                    </ActionSvg>
                                    <span>{t("View CSV")}</span>
                                  </ActionLabel>
                                </ActionMenuButton>
                              </ActionMenu>
                            )}
                          </ActionCell>
                        </Td>
                      </TableRow>
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
  overflow: visible;
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
  overflow-y: visible;
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
  vertical-align: middle;
`;

const TableRow = styled.tr`
  transition: background 0.15s ease;

  &:hover {
    background: #fafbff;
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

const StyledCheckbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #2671d9;
  flex-shrink: 0;
`;


const ActionCell = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const ActionButton = styled.button`
  border-radius: 12px;
  border: 1px solid #e6e8f0;
  background: #fff;
  width: 40px;
  height: 40px;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  color: #1d2025;
`;

const ActionMenu = styled.div`
  position: fixed;
  top: ${({ $top }) => $top}px;
  right: ${({ $right }) => $right}px;
  width: max-content;
  border-radius: 12px;
  border: 1px solid #e6e8f0;
  background: #fff;
  box-shadow: 0 12px 32px rgba(17, 24, 39, 0.12);
  padding: 8px;
  z-index: 100;
`;

const ActionMenuButton = styled.button`
  display: block;
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  padding: 10px 14px;
  border-radius: 0;
  cursor: pointer;
  border-bottom: 1px solid #edf0f7;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f5f7fb;
  }
`;

const ActionLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #1d2025;
  font-size: 14px;
  font-weight: 500;
`;

const ActionIcon = styled.img`
  width: 18px;
  height: 18px;
  object-fit: contain;
`;

const ActionSvg = styled.svg`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
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
