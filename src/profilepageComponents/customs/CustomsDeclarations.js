import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import chevronSVG from "../../assets/chevron-down.svg";
import noDeclarations from "../../assets/noDeclarations.png";
import searchSVG from "../../assets/search3.svg";
import eyeSVG from "../../assets/eye.svg";
import ministryLogo from "../../assets/ministry_logo.jpeg";
import Popup from "../Popup";
import {
  adjustDeclarationValue,
  approveDeclaration,
  closeDeclaration,
  fetchCustomsDeclarationDetail,
  fetchCustomsDeclarationInvoice,
  fetchCustomsDeclarations,
  generateInvoice,
  releaseInvoice,
  rejectDeclaration,
  startCustomsDeclarationReview,
} from "../../functions/customs";
import { StatusBadge, StatusIcon } from "../statusBadge";

const DECLARATION_TYPES = {
  IMPORTER: "IMPORTER",
  INDIVIDUAL: "INDIVIDUAL",
};

const rowKey = (row) => `${row.declarationType}-${row.id}`;

const CustomsDeclarations = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(DECLARATION_TYPES.IMPORTER);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [declarations, setDeclarations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDeclaration, setSelectedDeclaration] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);
  const [pendingInvoiceReleaseRow, setPendingInvoiceReleaseRow] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [selectedRows, setSelectedRows] = useState(new Set());

  // Details drawer state
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [detailsDrawerRow, setDetailsDrawerRow] = useState(null);

  // Inline row expansion state
  const [expandedRowKey, setExpandedRowKey] = useState(null);
  const [expandedDetail, setExpandedDetail] = useState(null);
  const [expandedDetailLoading, setExpandedDetailLoading] = useState(false);

  // Adjust panel state
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustRow, setAdjustRow] = useState(null);
  const [adjustedValue, setAdjustedValue] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustSaved, setAdjustSaved] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isActioning, setIsActioning] = useState(false);
  const [showAdjustToast, setShowAdjustToast] = useState(false);
  const [adjustError, setAdjustError] = useState(null);
  const [tableActionError, setTableActionError] = useState(null);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectRow, setRejectRow] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);

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
    setIsLoading(true);
    const response = await fetchCustomsDeclarations(
      activeTab,
      currentPage + 1,
      pageSize,
      appliedSearch
    );
    if (response) {
      setDeclarations(response.data || []);
      setTotalElements(response.totalElements || 0);
    } else {
      setDeclarations([]);
      setTotalElements(0);
    }
    setIsLoading(false);
  }, [activeTab, appliedSearch, currentPage, pageSize]);

  useEffect(() => {
    loadDeclarations();
  }, [loadDeclarations]);

  const rangeStart = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const rangeEnd = Math.min((currentPage + 1) * pageSize, totalElements);

  const emptyStateTitle = useMemo(
    () =>
      activeTab === DECLARATION_TYPES.IMPORTER
        ? t("Customs_NoImporterDeclarations")
        : t("Customs_NoIndividualDeclarations"),
    [activeTab, t]
  );

  const handleTabChange = (tab) => {
    setTableActionError(null);
    setActiveTab(tab);
    setCurrentPage(0);
    setOpenMenuId(null);
    setSelectedDeclaration(null);
    setDetailsDrawerRow(null);
    setIsDetailsDrawerOpen(false);
    setExpandedRowKey(null);
    setExpandedDetail(null);
    setSelectedInvoice(null);
    setSelectedRows(new Set());
  };

  const handleSearchSubmit = () => {
    setCurrentPage(0);
    setAppliedSearch(searchInput.trim());
  };

  const handlePageSizeChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    if (!Number.isNaN(newSize) && newSize > 0) {
      setPageSize(newSize);
      setCurrentPage(0);
    }
  };

  // Checkbox helpers
  const allSelected =
    declarations.length > 0 &&
    declarations.every((row) => selectedRows.has(rowKey(row)));
  const someSelected = declarations.some((row) => selectedRows.has(rowKey(row)));

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(new Set(declarations.map(rowKey)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (row) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowKey(row))) {
        next.delete(rowKey(row));
      } else {
        next.add(rowKey(row));
      }
      return next;
    });
  };

  const openDetails = async (row) => {
    setOpenMenuId(null);
    setDetailsDrawerRow(row);
    setIsDetailLoading(true);
    setIsDetailsDrawerOpen(true);
    const detail = await fetchCustomsDeclarationDetail(
      row.declarationType,
      row.id
    );
    setSelectedDeclaration(detail);
    setIsDetailLoading(false);
  };

  const closeDetails = () => {
    setSelectedDeclaration(null);
    setDetailsDrawerRow(null);
    setIsDetailLoading(false);
    setIsDetailsDrawerOpen(false);
  };

  const toggleRowExpansion = async (row) => {
    const key = rowKey(row);
    if (expandedRowKey === key) {
      setExpandedRowKey(null);
      setExpandedDetail(null);
      return;
    }
    setExpandedRowKey(key);
    setExpandedDetail(null);
    setExpandedDetailLoading(true);
    const detail = await fetchCustomsDeclarationDetail(
      row.declarationType,
      row.id
    );
    setExpandedDetail(detail);
    setExpandedDetailLoading(false);
  };

  const openInvoice = async (row) => {
    if (!row) return;
    setOpenMenuId(null);
    setIsInvoiceLoading(true);
    setSelectedInvoice(null);
    const invoice = await fetchCustomsDeclarationInvoice(
      row.declarationType,
      row.id
    );
    setSelectedInvoice(invoice);
    setIsInvoiceLoading(false);
    return invoice;
  };

  const closeInvoice = async () => {
    if (pendingInvoiceReleaseRow) {
      const releasedRow = await releaseInvoice(
        pendingInvoiceReleaseRow.declarationType,
        pendingInvoiceReleaseRow.id
      );

      if (releasedRow) {
        setDeclarations((prev) =>
          prev.map((item) =>
            item.id === pendingInvoiceReleaseRow.id &&
            item.declarationType === pendingInvoiceReleaseRow.declarationType
              ? releasedRow
              : item
          )
        );
      } else {
        setTableActionError(t("Failed to move declaration to awaiting payment. Please try again."));
      }

      setPendingInvoiceReleaseRow(null);
    }
    setSelectedInvoice(null);
    setIsInvoiceLoading(false);
  };

  const handleActionClick = async (e, row) => {
    if (openMenuId === row.id) {
      setOpenMenuId(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();

    if (
      row.declarationType === DECLARATION_TYPES.IMPORTER &&
      row.status === "SUBMITTED"
    ) {
      const updatedRow = await startCustomsDeclarationReview(
        row.declarationType,
        row.id
      );

      if (updatedRow) {
        setDeclarations((previousRows) =>
          previousRows.map((item) =>
            item.id === row.id && item.declarationType === row.declarationType
              ? updatedRow
              : item
          )
        );
        row = updatedRow;
      } else {
        setTableActionError(t("Failed to start declaration review. Please try again."));
        return;
      }
    }

    setMenuPosition({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    });
    setOpenMenuId(row.id);
  };

  const openAdjustPanel = (row) => {
    setOpenMenuId(null);
    setAdjustRow(row);
    setAdjustedValue(
      row.approvedPriceUsd != null ? String(Math.trunc(Number(row.approvedPriceUsd))) : ""
    );
    setAdjustReason(row.adjustmentReason || "");
    setAdjustSaved(row.approvedPriceUsd != null && Boolean(row.adjustmentReason));
    setShowAdjustToast(false);
    setAdjustError(null);
    setIsAdjustOpen(true);
  };

  const closeAdjustPanel = () => {
    setIsAdjustOpen(false);
    setAdjustRow(null);
    setAdjustSaved(false);
    setShowAdjustToast(false);
    setAdjustError(null);
  };

  const openRejectModal = (row) => {
    if (!row) return;
    setOpenMenuId(null);
    setRejectRow(row);
    setRejectReason(row.rejectionReason || "");
    setRejectError(null);
    setIsRejectOpen(true);
  };

  const closeRejectModal = () => {
    setIsRejectOpen(false);
    setRejectRow(null);
    setRejectReason("");
    setRejectError(null);
    setIsRejecting(false);
  };

  const handleSaveAdjustment = async () => {
    if (!adjustRow || !adjustReason.trim() || !adjustedValue) return;
    if (!/^\d+$/.test(adjustedValue)) {
      setAdjustError(t("Adjusted value must be a whole number."));
      return;
    }
    setIsAdjusting(true);
    setAdjustError(null);
    const result = await adjustDeclarationValue(
      adjustRow.declarationType,
      adjustRow.id,
      parseInt(adjustedValue, 10),
      adjustReason.trim()
    );
    setIsAdjusting(false);
    if (!result) {
      setAdjustError(t("Failed to save adjustment. Please try again."));
      return;
    }
    setDeclarations((prev) =>
      prev.map((item) =>
        item.id === adjustRow.id &&
        item.declarationType === adjustRow.declarationType
          ? result
          : item
      )
    );
    setAdjustRow(result);
    setAdjustedValue(
      result?.approvedPriceUsd != null ? String(Math.trunc(Number(result.approvedPriceUsd))) : adjustedValue
    );
    setAdjustReason(result?.adjustmentReason || adjustReason.trim());
    setAdjustSaved(true);
    setShowAdjustToast(true);
    setTimeout(() => setShowAdjustToast(false), 4000);
  };

  const handleApprove = async () => {
    if (!adjustRow) return;
    setIsActioning(true);
    setAdjustError(null);
    const result = await approveDeclaration(
      adjustRow.declarationType,
      adjustRow.id
    );
    setIsActioning(false);
    if (!result) {
      setAdjustError(t("Failed to approve declaration. Please try again."));
      return;
    }
    setDeclarations((prev) =>
      prev.map((item) =>
        item.id === adjustRow.id &&
        item.declarationType === adjustRow.declarationType
          ? result
          : item
      )
    );
    closeAdjustPanel();
  };

  const handleReject = async () => {
    if (!adjustRow) return;
    openRejectModal(adjustRow);
  };

  const handleConfirmReject = async () => {
    if (!rejectRow) return;
    if (!rejectReason.trim()) {
      setRejectError(t("Rejection reason is required."));
      return;
    }
    setIsRejecting(true);
    setRejectError(null);
    const result = await rejectDeclaration(
      rejectRow.declarationType,
      rejectRow.id,
      rejectReason.trim()
    );
    setIsRejecting(false);
    if (!result) {
      setRejectError(t("Failed to reject declaration. Please try again."));
      return;
    }
    setDeclarations((prev) =>
      prev.map((item) =>
        item.id === rejectRow.id &&
        item.declarationType === rejectRow.declarationType
          ? result
          : item
      )
    );
    if (
      selectedDeclaration &&
      selectedDeclaration.id === rejectRow.id &&
      selectedDeclaration.declarationType === rejectRow.declarationType
    ) {
      setSelectedDeclaration((previous) =>
        previous
          ? {
              ...previous,
              status: result.status,
              rejectionReason: result.rejectionReason || rejectReason.trim(),
            }
          : previous
      );
    }
    closeRejectModal();
    if (adjustRow && adjustRow.id === rejectRow.id) {
      closeAdjustPanel();
    }
  };

  return (
    <PageContainer>
      <PageHeader>
        <TextBlock>
          <Title>{t("Customs_DeclarationTitle")}</Title>
          <Subtitle>{t("Customs_DeclarationSubtitle")}</Subtitle>
        </TextBlock>
      </PageHeader>

      <ContentCard>
        <Toolbar>
          <Tabs>
            <TabButton
              type="button"
              $active={activeTab === DECLARATION_TYPES.IMPORTER}
              onClick={() => handleTabChange(DECLARATION_TYPES.IMPORTER)}
            >
              {t("Importers")}
            </TabButton>
            <TabButton
              type="button"
              $active={activeTab === DECLARATION_TYPES.INDIVIDUAL}
              onClick={() => handleTabChange(DECLARATION_TYPES.INDIVIDUAL)}
            >
              {t("Individuals")}
            </TabButton>
          </Tabs>

          <SearchContainer>
            <SearchButton type="button" onClick={handleSearchSubmit}>
              <img src={searchSVG} alt="Search" />
            </SearchButton>
            <SearchInput
              type="text"
              placeholder={t("Search")}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearchSubmit();
                }
              }}
            />
          </SearchContainer>
        </Toolbar>

        {tableActionError && (
          <ErrorBanner>
            {tableActionError}
            <ErrorBannerClose
              type="button"
              onClick={() => setTableActionError(null)}
            >
              &#x2715;
            </ErrorBannerClose>
          </ErrorBanner>
        )}

        {totalElements === 0 && !isLoading ? (
          <EmptyState>
            <EmptyImage src={noDeclarations} alt="No declarations" />
            <EmptyTitle>{emptyStateTitle}</EmptyTitle>
            <EmptyText>{t("Customs_NoDeclarationsSubtitle")}</EmptyText>
          </EmptyState>
        ) : (
          <>
            <TableWrapper>
              <PaginationBar>
                <PaginationText>
                  <span>{rangeStart}</span>
                  {" - "}
                  <span>{rangeEnd}</span> {t("Out of")}{" "}
                  <span>{totalElements}</span>
                </PaginationText>
                <PaginationControls>
                  <img
                    src={chevronSVG}
                    alt="Previous"
                    style={{
                      transform: "rotate(90deg)",
                      height: "20px",
                      cursor: currentPage > 0 ? "pointer" : "not-allowed",
                      opacity: currentPage > 0 ? 1 : 0.5,
                    }}
                    onClick={() =>
                      currentPage > 0 && setCurrentPage(currentPage - 1)
                    }
                  />
                  <img
                    src={chevronSVG}
                    alt="Next"
                    style={{
                      transform: "rotate(-90deg)",
                      height: "20px",
                      cursor:
                        (currentPage + 1) * pageSize < totalElements
                          ? "pointer"
                          : "not-allowed",
                      opacity:
                        (currentPage + 1) * pageSize < totalElements ? 1 : 0.5,
                    }}
                    onClick={() =>
                      (currentPage + 1) * pageSize < totalElements &&
                      setCurrentPage(currentPage + 1)
                    }
                  />
                  <PageSizeInput
                    type="number"
                    value={pageSize}
                    min="1"
                    onChange={handlePageSizeChange}
                  />
                </PaginationControls>
              </PaginationBar>

              <Table>
                <thead>
                  <tr>
                    <Th style={{ width: "32px", padding: "0" }} />
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
                    <Th>{t(activeTab === DECLARATION_TYPES.IMPORTER ? "Importer" : "Individual")}</Th>
                    <Th>{t("Declaration Nbr.")}</Th>
                    <Th>{t("Declaration Date")}</Th>
                    <Th>{t("Devices Count")}</Th>
                    <Th>{t("Declared Total (USD)")}</Th>
                    <Th>{t("Estimated Value (USD)")}</Th>
                    <Th>{t("Variance")}</Th>
                    <Th>{t("Price Source")}</Th>
                    <Th>{t("Status")}</Th>
                    <Th>{t("Actions")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <LoadingCell colSpan="12">{t("Loading")}</LoadingCell>
                    </tr>
                  ) : (
                    declarations.map((row) => {
                      const key = rowKey(row);
                      const isExpanded = expandedRowKey === key;
                      return (
                      <React.Fragment key={key}>
                      <TableRow
                        $selected={isExpanded}
                        tabIndex={0}
                        onClick={() => toggleRowExpansion(row)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            toggleRowExpansion(row);
                          }
                        }}
                      >
                        <Td style={{ width: "32px", padding: "14px 8px 14px 14px" }}>
                          <ExpandChevron $expanded={isExpanded}>
                            <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
                              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </ExpandChevron>
                        </Td>
                        <Td onClick={(event) => event.stopPropagation()}>
                          <StyledCheckbox
                            type="checkbox"
                            aria-label={`select ${row.declarationNumber}`}
                            checked={selectedRows.has(rowKey(row))}
                            onChange={() => handleSelectRow(row)}
                          />
                        </Td>
                        <NameCell>{row.submitterName}</NameCell>
                        <Td>{row.declarationNumber}</Td>
                        <Td>{formatDate(row.declarationDate)}</Td>
                        <Td>{row.devicesCount}</Td>
                        <Td>{formatMoney(row.declaredTotalUsd)}</Td>
                        <Td>{formatMoney(row.estimatedValueUsd)}</Td>
                        <Td>
                          <VarianceValue value={Number(row.variancePercent || 0)} />
                        </Td>
                        <Td>{row.priceSource}</Td>
                        <Td>
                          <StatusBadge $status={row.status}>
                            <StatusIcon status={row.status} />
                            {formatStatusLabel(row.status)}
                          </StatusBadge>
                        </Td>
                        <Td onClick={(event) => event.stopPropagation()}>
                          <ActionCell>
                            <ActionButton
                              type="button"
                              onClick={(e) => handleActionClick(e, row)}
                            >
                              &#8942;
                            </ActionButton>
                            {openMenuId === row.id && (
                              <ActionMenu
                                ref={menuRef}
                                $top={menuPosition.top}
                                $right={menuPosition.right}
                              >
                                <ActionMenuButton
                                  type="button"
                                  onClick={() => openDetails(row)}
                                >
                                  <ActionLabel>
                                    <ActionIcon src={eyeSVG} alt="" aria-hidden="true" />
                                    <span>{t("View Details")}</span>
                                  </ActionLabel>
                                </ActionMenuButton>
                                {canAdjustDeclaration(row) && (
                                  <ActionMenuButton
                                    type="button"
                                    onClick={() => openAdjustPanel(row)}
                                  >
                                    <ActionLabel>
                                      <ActionSvg
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        aria-hidden="true"
                                      >
                                        <path
                                          d="M13.333 2.5L17.5 6.667L7.5 16.667H3.333V12.5L13.333 2.5Z"
                                          stroke="#1D2025"
                                          strokeWidth="1.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                        <path
                                          d="M11.667 4.167L15.833 8.333"
                                          stroke="#1D2025"
                                          strokeWidth="1.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </ActionSvg>
                                      <span>{t("Adjust")}</span>
                                    </ActionLabel>
                                  </ActionMenuButton>
                                )}
                                {canApproveDeclaration(row) && (
                                  <ActionMenuButton
                                    type="button"
                                    onClick={async () => {
                                      setOpenMenuId(null);
                                      setTableActionError(null);
                                      const result = await approveDeclaration(
                                        row.declarationType,
                                        row.id
                                      );
                                      if (result) {
                                        setDeclarations((prev) =>
                                          prev.map((item) =>
                                            item.id === row.id &&
                                            item.declarationType === row.declarationType
                                              ? result
                                              : item
                                          )
                                        );
                                      } else {
                                        setTableActionError(t("Failed to approve declaration. Please try again."));
                                      }
                                    }}
                                  >
                                    <ActionLabel>
                                      <ActionSvg
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        aria-hidden="true"
                                      >
                                        <path
                                          d="M4.167 10L8.333 14.167L15.833 5.833"
                                          stroke="#1D2025"
                                          strokeWidth="1.7"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </ActionSvg>
                                      <span>{t("Approve")}</span>
                                    </ActionLabel>
                                  </ActionMenuButton>
                                )}
                                {canGenerateInvoice(row) && (
                                  <ActionMenuButton
                                    type="button"
                                    onClick={async () => {
                                      setOpenMenuId(null);
                                      setTableActionError(null);
                                      setPendingInvoiceReleaseRow(null);
                                      const result = await generateInvoice(
                                        row.declarationType,
                                        row.id
                                      );
                                      if (result) {
                                        setDeclarations((prev) =>
                                          prev.map((item) =>
                                            item.id === row.id &&
                                            item.declarationType === row.declarationType
                                              ? result
                                              : item
                                          )
                                        );
                                        setPendingInvoiceReleaseRow(result);
                                        const invoice = await openInvoice(result);
                                        if (!invoice) {
                                          setPendingInvoiceReleaseRow(null);
                                        }
                                      } else {
                                        setTableActionError(t("Failed to generate invoice. Please try again."));
                                      }
                                    }}
                                  >
                                    <ActionLabel>
                                      <ActionSvg
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        aria-hidden="true"
                                      >
                                        <rect
                                          x="3.5"
                                          y="2.5"
                                          width="13"
                                          height="15"
                                          rx="2"
                                          stroke="#1D2025"
                                          strokeWidth="1.5"
                                        />
                                        <path
                                          d="M6.5 7H13.5"
                                          stroke="#1D2025"
                                          strokeWidth="1.5"
                                          strokeLinecap="round"
                                        />
                                        <path
                                          d="M6.5 10.5H13.5"
                                          stroke="#1D2025"
                                          strokeWidth="1.5"
                                          strokeLinecap="round"
                                        />
                                        <path
                                          d="M6.5 14H10.5"
                                          stroke="#1D2025"
                                          strokeWidth="1.5"
                                          strokeLinecap="round"
                                        />
                                      </ActionSvg>
                                      <span>{t("Generate Invoice")}</span>
                                    </ActionLabel>
                                  </ActionMenuButton>
                                )}
                                {canViewInvoice(row) && (
                                  <ActionMenuButton
                                    type="button"
                                    onClick={() => openInvoice(row)}
                                  >
                                    <ActionLabel>
                                      <ActionSvg
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        aria-hidden="true"
                                      >
                                        <path
                                          d="M2.5 10C4.3 6.8 6.9 5.1 10 5.1C13.1 5.1 15.7 6.8 17.5 10C15.7 13.2 13.1 14.9 10 14.9C6.9 14.9 4.3 13.2 2.5 10Z"
                                          stroke="#1D2025"
                                          strokeWidth="1.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                        <circle
                                          cx="10"
                                          cy="10"
                                          r="2.2"
                                          stroke="#1D2025"
                                          strokeWidth="1.5"
                                        />
                                      </ActionSvg>
                                      <span>{t("View Invoice")}</span>
                                    </ActionLabel>
                                  </ActionMenuButton>
                                )}
                                {canCloseDeclaration(row) && (
                                  <ActionMenuButton
                                    type="button"
                                    onClick={async () => {
                                      setOpenMenuId(null);
                                      const result = await closeDeclaration(
                                        row.declarationType,
                                        row.id
                                      );
                                      if (result) {
                                        setDeclarations((previousRows) =>
                                          previousRows.map((item) =>
                                            item.id === row.id && item.declarationType === row.declarationType
                                              ? result
                                              : item
                                          )
                                        );
                                      } else {
                                        setTableActionError(t("Failed to close declaration. Please try again."));
                                      }
                                    }}
                                  >
                                    <ActionLabel>
                                      <ActionSvg
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        aria-hidden="true"
                                      >
                                        <rect
                                          x="4.5"
                                          y="8.5"
                                          width="11"
                                          height="8"
                                          rx="2"
                                          stroke="#1D2025"
                                          strokeWidth="1.5"
                                        />
                                        <path
                                          d="M7 8.5V6.8C7 5.14 8.34 3.8 10 3.8C11.66 3.8 13 5.14 13 6.8V8.5"
                                          stroke="#1D2025"
                                          strokeWidth="1.5"
                                          strokeLinecap="round"
                                        />
                                      </ActionSvg>
                                      <span>{t("Set as Closed")}</span>
                                    </ActionLabel>
                                  </ActionMenuButton>
                                )}
                                {canRejectDeclaration(row) && (
                                  <ActionMenuButton
                                    type="button"
                                    onClick={() => openRejectModal(row)}
                                  >
                                    <ActionLabel>
                                      <ActionSvg
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        aria-hidden="true"
                                      >
                                        <path
                                          d="M5 5L15 15"
                                          stroke="#1D2025"
                                          strokeWidth="1.7"
                                          strokeLinecap="round"
                                        />
                                        <path
                                          d="M15 5L5 15"
                                          stroke="#1D2025"
                                          strokeWidth="1.7"
                                          strokeLinecap="round"
                                        />
                                      </ActionSvg>
                                      <span>{t("Reject")}</span>
                                    </ActionLabel>
                                  </ActionMenuButton>
                                )}
                              </ActionMenu>
                            )}
                          </ActionCell>
                        </Td>
                      </TableRow>
                      {isExpanded && (
                        <tr>
                          <ExpandedTd colSpan="12">
                            {expandedDetailLoading ? (
                              <ExpandedLoading>{t("Loading")}</ExpandedLoading>
                            ) : expandedDetail?.items?.length > 0 ? (
                              <ExpandedContent>
                                <ExpandedSectionLabel>{t("Declaration Items")}</ExpandedSectionLabel>
                                <ExpandedItemsTable>
                                  <thead>
                                    <tr>
                                      <ExpandedTh>{t("Brand")}</ExpandedTh>
                                      <ExpandedTh>{t("Model")}</ExpandedTh>
                                      <ExpandedTh>{t("IMEIs")}</ExpandedTh>
                                      <ExpandedTh>{t("Nbr of IMEIs")}</ExpandedTh>
                                      <ExpandedTh>{t("Device Status")}</ExpandedTh>
                                      <ExpandedTh>{t("Declared Value (USD)")}</ExpandedTh>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {expandedDetail.items.map((item) => (
                                      <tr key={item.id}>
                                        <ExpandedBodyTd>{item.brand || "-"}</ExpandedBodyTd>
                                        <ExpandedBodyTd>{item.model || "-"}</ExpandedBodyTd>
                                        <ExpandedBodyTd $preserveLines>{formatImeis(item.imeis)}</ExpandedBodyTd>
                                        <ExpandedBodyTd>{item.imeiCount}</ExpandedBodyTd>
                                        <ExpandedBodyTd>{formatStatusLabel(item.status)}</ExpandedBodyTd>
                                        <ExpandedBodyTd>{formatMoney(item.declaredValueUsd)}</ExpandedBodyTd>
                                      </tr>
                                    ))}
                                  </tbody>
                                </ExpandedItemsTable>
                              </ExpandedContent>
                            ) : (
                              <ExpandedLoading>{t("No items available")}</ExpandedLoading>
                            )}
                          </ExpandedTd>
                        </tr>
                      )}
                      </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </TableWrapper>

          </>
      )}
    </ContentCard>

      {(isInvoiceLoading || selectedInvoice) && (
        <InvoiceOverlay onClick={closeInvoice}>
          <InvoicePanel onClick={(e) => e.stopPropagation()}>
            {isInvoiceLoading ? (
              <DrawerLoading>{t("Loading")}</DrawerLoading>
            ) : !selectedInvoice ? (
              <DrawerLoading>{t("No data available")}</DrawerLoading>
            ) : (
              <>
                <InvoiceCloseButton type="button" onClick={closeInvoice}>
                  &#x2715;
                </InvoiceCloseButton>

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
                    <InvoiceNumber>{selectedInvoice.invoiceNumber}</InvoiceNumber>
                  </InvoiceRightHeader>
                </InvoiceHeaderBlock>

                <InvoiceMetaGrid>
                  <InvoiceMetaItem>
                    <InvoiceMetaLabel>{t("Declaration No.")}</InvoiceMetaLabel>
                    <InvoiceMetaValue>{selectedInvoice.declarationNumber}</InvoiceMetaValue>
                  </InvoiceMetaItem>
                  <InvoiceMetaItem>
                    <InvoiceMetaLabel>{t("Devices Count")}</InvoiceMetaLabel>
                    <InvoiceMetaValue>{selectedInvoice.devicesCount}</InvoiceMetaValue>
                  </InvoiceMetaItem>
                  <InvoiceMetaItem>
                    <InvoiceMetaLabel>{t("Importer")}</InvoiceMetaLabel>
                    <InvoiceMetaValue>{selectedInvoice.importerName}</InvoiceMetaValue>
                  </InvoiceMetaItem>
                  <InvoiceMetaItem>
                    <InvoiceMetaLabel>{t("Issue Date")}</InvoiceMetaLabel>
                    <InvoiceMetaValue>{formatDate(selectedInvoice.issueDate)}</InvoiceMetaValue>
                  </InvoiceMetaItem>
                  <InvoiceMetaItem>
                    <InvoiceMetaLabel>{t("Currency")}</InvoiceMetaLabel>
                    <InvoiceMetaValue>{selectedInvoice.currency}</InvoiceMetaValue>
                  </InvoiceMetaItem>
                  <InvoiceMetaItem>
                    <InvoiceMetaLabel>{t("Declaration Date")}</InvoiceMetaLabel>
                    <InvoiceMetaValue>{formatDate(selectedInvoice.declarationDate)}</InvoiceMetaValue>
                  </InvoiceMetaItem>
                  <InvoiceMetaItem>
                    <InvoiceMetaLabel>{t("Payment Status")}</InvoiceMetaLabel>
                    <InvoiceMetaValue>
                      <StatusBadge $status={selectedInvoice.invoiceStatus === "PAID" ? "PAID" : "AWAITING_PAYMENT"}>
                        {formatInvoiceStatusLabel(t, selectedInvoice.invoiceStatus)}
                      </StatusBadge>
                    </InvoiceMetaValue>
                  </InvoiceMetaItem>
                </InvoiceMetaGrid>

                <InvoiceSummaryCard>
                  <InvoiceSummaryRow>
                    <span>{t("Total Approved Value")}</span>
                    <span>{formatInvoiceMoney(selectedInvoice.approvedValueUsd)}</span>
                  </InvoiceSummaryRow>
                  <InvoiceSummaryRow>
                    <span>
                      {t("Total Customs Duty")} ({Number(selectedInvoice.dutyPercentage || 0).toFixed(0)}%)
                    </span>
                    <strong>{formatInvoiceMoney(selectedInvoice.customsDutyUsd)}</strong>
                  </InvoiceSummaryRow>
                  <InvoiceSummaryRow>
                    <span>{t("Total (Approved Value + Customs Duty)")}</span>
                    <span>{formatInvoiceMoney(selectedInvoice.totalWithDutyUsd)}</span>
                  </InvoiceSummaryRow>
                  <InvoiceSummaryRow $last>
                    <span>{t("VAT")} ({Number(selectedInvoice.vatPercentage || 0).toFixed(0)}%)</span>
                    <strong>+{formatInvoiceMoney(selectedInvoice.vatAmountUsd)}</strong>
                  </InvoiceSummaryRow>
                </InvoiceSummaryCard>

                <InvoiceTotalBox>
                  <InvoiceTotalLeft>
                    <strong>{t("TOTAL PAYABLE")}</strong>{" "}
                    <InvoiceTotalSub>({t("TOTAL CUSTOMS DUTY + VAT")})</InvoiceTotalSub>
                  </InvoiceTotalLeft>
                  <InvoiceTotalRight>
                    <InvoiceTotalAmount>{formatInvoiceMoney(selectedInvoice.totalPayableUsd)}</InvoiceTotalAmount>
                    <InvoiceTotalApprox>
                      ≈ {(Number(selectedInvoice.totalPayableUsd || 0) * Number(selectedInvoice.usdToLbpRate || 0)).toLocaleString()} LBP
                    </InvoiceTotalApprox>
                    <InvoiceTotalRate>
                      {t("Exchange Rate")}: {Number(selectedInvoice.usdToLbpRate || 0).toLocaleString()} USD/LBP
                    </InvoiceTotalRate>
                  </InvoiceTotalRight>
                </InvoiceTotalBox>

                <InvoiceFooterNote>
                  {selectedInvoice.invoiceStatus === "PAID"
                    ? t("Thank you. Payment received")
                    : t("Invoice generated. Awaiting payment.")}
                </InvoiceFooterNote>
              </>
            )}
          </InvoicePanel>
        </InvoiceOverlay>
      )}

      {/* Adjust consignment values panel */}
      {isAdjustOpen && adjustRow && (
        <DrawerOverlay onClick={closeAdjustPanel}>
          <DrawerPanel onClick={(e) => e.stopPropagation()}>
            <DrawerHeader>
              <DrawerTitle style={{ color: "#2671d9" }}>
                {t("Adjust Consignment Values")}
              </DrawerTitle>
              <CloseDrawerButton type="button" onClick={closeAdjustPanel}>
                &#x2715;
              </CloseDrawerButton>
            </DrawerHeader>

            {/* Declaration Details */}
            <AdjustSection>
              <AdjustSectionTitle>{t("Declaration Details")}</AdjustSectionTitle>
              <AdjustDetailGrid>
                <AdjustDetailLabel>{t("Declaration No.")}</AdjustDetailLabel>
                <AdjustDetailValue>{adjustRow.declarationNumber}</AdjustDetailValue>

                <AdjustDetailLabel>{t("Importer")}</AdjustDetailLabel>
                <AdjustDetailValue>{adjustRow.submitterName}</AdjustDetailValue>

                <AdjustDetailLabel>{t("Declaration Date")}</AdjustDetailLabel>
                <AdjustDetailValue>{formatDate(adjustRow.declarationDate)}</AdjustDetailValue>

                <AdjustDetailLabel>{t("Devices Count")}</AdjustDetailLabel>
                <AdjustDetailValue>{adjustRow.devicesCount}</AdjustDetailValue>

                <AdjustDetailLabel>{t("Status")}</AdjustDetailLabel>
                <AdjustDetailValue>
                  <StatusBadge $status={adjustRow.status}>
                    <StatusIcon status={adjustRow.status} />
                    {formatStatusLabel(adjustRow.status)}
                  </StatusBadge>
                </AdjustDetailValue>
              </AdjustDetailGrid>
            </AdjustSection>

            {/* Value Summary */}
            <AdjustSection>
              <AdjustSectionTitle>{t("Value Summary (USD)")}</AdjustSectionTitle>
              <AdjustDetailGrid>
                <AdjustDetailLabel>{t("Declared Value")}</AdjustDetailLabel>
                <AdjustDetailValue>{formatMoney(adjustRow.declaredTotalUsd)}</AdjustDetailValue>

                <AdjustDetailLabel>{t("Estimated Value")}</AdjustDetailLabel>
                <AdjustDetailValue>{formatMoney(adjustRow.estimatedValueUsd)}</AdjustDetailValue>

                <AdjustDetailLabel>{t("Adjusted Value")}</AdjustDetailLabel>
                <AdjustDetailValue>
                  {adjustSaved ? (
                    <strong>{formatMoney(parseInt(adjustedValue || "0", 10))}</strong>
                  ) : (
                    <AdjustInput
                      type="text"
                      inputMode="numeric"
                      placeholder={t("Input goes here")}
                      value={adjustedValue}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        if (/^\d*$/.test(nextValue)) {
                          setAdjustedValue(nextValue);
                        }
                      }}
                    />
                  )}
                </AdjustDetailValue>
              </AdjustDetailGrid>
            </AdjustSection>

            {/* Adjustment Reason */}
            <AdjustSection>
              <AdjustSectionTitle>
                {t("Adjustment Reason")}
                {!adjustSaved && <AdjustRequired>*</AdjustRequired>}
              </AdjustSectionTitle>
              {adjustSaved ? (
                <AdjustReasonText>{adjustReason}</AdjustReasonText>
              ) : (
                <AdjustTextarea
                  placeholder={t("Reason goes here")}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  rows={4}
                />
              )}
            </AdjustSection>

            {/* Success toast */}
            {showAdjustToast && (
              <AdjustToast>
                <AdjustToastIcon>&#10003;</AdjustToastIcon>
                {t("Adjustment saved successfully!")}
                <AdjustToastClose
                  type="button"
                  onClick={() => setShowAdjustToast(false)}
                >
                  &#x2715;
                </AdjustToastClose>
              </AdjustToast>
            )}

            {/* Error toast */}
            {adjustError && (
              <AdjustErrorToast>
                <AdjustErrorIcon>&#x2715;</AdjustErrorIcon>
                {adjustError}
                <AdjustToastClose
                  type="button"
                  onClick={() => setAdjustError(null)}
                >
                  &#x2715;
                </AdjustToastClose>
              </AdjustErrorToast>
            )}

            {/* Footer buttons */}
            <AdjustFooter>
              {adjustSaved ? (
                <>
                  <AdjustSecondaryButton
                    type="button"
                    onClick={handleReject}
                    disabled={isActioning}
                  >
                    {t("Reject Declaration")}
                  </AdjustSecondaryButton>
                  <AdjustPrimaryButton
                    type="button"
                    onClick={handleApprove}
                    disabled={isActioning}
                  >
                    {t("Approve Declaration")}
                  </AdjustPrimaryButton>
                </>
              ) : (
                <>
                  <AdjustSecondaryButton type="button" onClick={closeAdjustPanel}>
                    {t("Cancel")}
                  </AdjustSecondaryButton>
                  <AdjustPrimaryButton
                    type="button"
                    onClick={handleSaveAdjustment}
                    disabled={isAdjusting || !/^\d+$/.test(adjustedValue) || !adjustReason.trim()}
                  >
                    {isAdjusting ? t("Saving...") : t("Save Adjustment")}
                  </AdjustPrimaryButton>
                </>
              )}
            </AdjustFooter>
          </DrawerPanel>
        </DrawerOverlay>
      )}

      {isDetailsDrawerOpen && (
        <DrawerOverlay onClick={closeDetails}>
          <DrawerPanel onClick={(e) => e.stopPropagation()}>
            <DrawerHeader>
              <DrawerTitle style={{ color: "#2671d9" }}>
                {t("Declaration Details")}
              </DrawerTitle>
              <CloseDrawerButton type="button" onClick={closeDetails}>
                &#x2715;
              </CloseDrawerButton>
            </DrawerHeader>

            {isDetailLoading ? (
              <DrawerLoading>{t("Loading")}</DrawerLoading>
            ) : !detailsDrawerRow ? (
              <DrawerLoading>{t("No data available")}</DrawerLoading>
            ) : (
              <>
                <AdjustSection>
                  <AdjustSectionTitle>{t("Declaration Info")}</AdjustSectionTitle>
                  <AdjustDetailGrid>
                    <AdjustDetailLabel>{t("Declaration No.")}</AdjustDetailLabel>
                    <AdjustDetailValue>{detailsDrawerRow.declarationNumber}</AdjustDetailValue>

                    <AdjustDetailLabel>{t("Importer")}</AdjustDetailLabel>
                    <AdjustDetailValue>{detailsDrawerRow.submitterName}</AdjustDetailValue>

                    <AdjustDetailLabel>{t("Declaration Date")}</AdjustDetailLabel>
                    <AdjustDetailValue>{formatDate(detailsDrawerRow.declarationDate)}</AdjustDetailValue>

                    <AdjustDetailLabel>{t("Devices Count")}</AdjustDetailLabel>
                    <AdjustDetailValue>{detailsDrawerRow.devicesCount}</AdjustDetailValue>

                    <AdjustDetailLabel>{t("Status")}</AdjustDetailLabel>
                    <AdjustDetailValue>
                      <StatusBadge $status={detailsDrawerRow.status}>
                        <StatusIcon status={detailsDrawerRow.status} />
                        {formatStatusLabel(detailsDrawerRow.status)}
                      </StatusBadge>
                    </AdjustDetailValue>
                  </AdjustDetailGrid>
                </AdjustSection>

                <AdjustSection>
                  <AdjustSectionTitle>{t("Value Summary (USD)")}</AdjustSectionTitle>
                  <AdjustDetailGrid>
                    <AdjustDetailLabel>{t("Declared Value")}</AdjustDetailLabel>
                    <AdjustDetailValue>{formatMoney(detailsDrawerRow.declaredTotalUsd)}</AdjustDetailValue>

                    <AdjustDetailLabel>{t("Estimated Value")}</AdjustDetailLabel>
                    <AdjustDetailValue>{formatMoney(detailsDrawerRow.estimatedValueUsd)}</AdjustDetailValue>

                    {detailsDrawerRow.approvedPriceUsd != null && (
                      <>
                        <AdjustDetailLabel>{t("Adjusted Value")}</AdjustDetailLabel>
                        <AdjustDetailValue>
                          <strong>{formatMoney(detailsDrawerRow.approvedPriceUsd)}</strong>
                        </AdjustDetailValue>
                      </>
                    )}
                  </AdjustDetailGrid>
                </AdjustSection>

                {detailsDrawerRow.rejectionReason && (
                  <AdjustSection>
                    <AdjustSectionTitle>{t("Rejection Reason")}</AdjustSectionTitle>
                    <AdjustReasonText>{detailsDrawerRow.rejectionReason}</AdjustReasonText>
                  </AdjustSection>
                )}

                
              </>
            )}
          </DrawerPanel>
        </DrawerOverlay>
      )}

      {isRejectOpen && rejectRow && (
        <Popup
          purpose="rejectDeclaration"
          onClose={closeRejectModal}
          onAction={handleConfirmReject}
          reason={rejectReason}
          onReasonChange={(e) => setRejectReason(e.target.value)}
          reasonError={rejectError}
          busy={isRejecting}
        />
      )}
    </PageContainer>
  );
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatMoney = (value) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatInvoiceMoney = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatStatusLabel = (status) => {
  if (!status) {
    return "-";
  }

  if (status === "DECLINED") {
    return "Rejected";
  }

  if (status === "CLOSED") {
    return "Closed";
  }

  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
};

const formatInvoiceStatusLabel = (t, status) => {
  if (status === "PAID") {
    return t("Paid");
  }
  return t("Awaiting Payment");
};

const formatImeis = (imeis) => (imeis ? imeis.split("|").join("\n") : "-");

const canAdjustDeclaration = (row) =>
  row.declarationType === DECLARATION_TYPES.IMPORTER &&
  row.status === "UNDER_REVIEW";

const canApproveDeclaration = (row) =>
  row.declarationType === DECLARATION_TYPES.IMPORTER &&
  row.status === "UNDER_REVIEW";

const canGenerateInvoice = (row) =>
  row.declarationType === DECLARATION_TYPES.IMPORTER &&
  row.status === "APPROVED" &&
  !row.invoiceGenerated;

const canViewInvoice = (row) =>
  row.declarationType === DECLARATION_TYPES.IMPORTER &&
  (
    row.status === "AWAITING_PAYMENT" ||
    row.status === "PAID" ||
    row.status === "CLOSED" ||
    (row.status === "APPROVED" && row.invoiceGenerated)
  );

const canCloseDeclaration = (row) =>
  row.declarationType === DECLARATION_TYPES.IMPORTER &&
  row.status === "PAID";

const canRejectDeclaration = (row) =>
  row.declarationType === DECLARATION_TYPES.IMPORTER &&
  (row.status === "SUBMITTED" || row.status === "UNDER_REVIEW");

const VarianceValue = ({ value }) => {
  const isPositive = value >= 0;
  return (
    <VarianceContainer $positive={isPositive}>
      {Math.abs(value).toFixed(2)}%
      <Triangle $positive={isPositive} />
    </VarianceContainer>
  );
};


const PageContainer = styled.div`
  display: flex;
  width: 90%;
  min-height: calc(100vh - 75px);
  flex-direction: column;
  padding: 40px 0;
  align-items: flex-start;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  width: 100%;
`;

const TextBlock = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: #1d2d64;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  font-size: 16px;
`;

const ContentCard = styled.div`
  width: 100%;
  flex: 1;
  min-height: 0;
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
  flex-wrap: wrap;
`;

const Tabs = styled.div`
  display: flex;
  gap: 12px;
`;

const TabButton = styled.button`
  border-radius: 12px;
  border: 1px solid
    ${({ $active }) => ($active ? "#2671d9" : "rgba(212, 214, 223, 1)")};
  background: ${({ $active }) => ($active ? "#f5f9ff" : "#f8f8fb")};
  color: ${({ $active }) => ($active ? "#2671d9" : "#1d2025")};
  padding: 14px 38px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
`;

const SearchContainer = styled.div`
  width: 100%;
  max-width: 320px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #d4d6df;
  border-radius: 999px;
  padding: 0 16px;
  background: #fff;
`;

const SearchButton = styled.button`
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  line-height: 1;

  img {
    width: 18px;
    height: 18px;
  }
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  flex: 1;
  font-size: 14px;
  padding: 12px 0;
  background: transparent;
`;

const EmptyState = styled.div`
  display: flex;
  min-height: 320px;
  width: 100%;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 14px;
`;

const EmptyImage = styled.img`
  width: 180px;
  opacity: 0.85;
`;

const EmptyTitle = styled.h2`
  font-size: 20px;
  color: #1d2025;
`;

const EmptyText = styled.p`
  color: #6f7897;
`;

const TableWrapper = styled.div`
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  overflow-y: visible;
`;

const PaginationBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const PaginationText = styled.p`
  color: #6f7897;
  font-size: 13px;
  white-space: nowrap;
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PageSizeInput = styled.input`
  width: 56px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #d4d6df;
  text-align: center;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  thead tr {
    background: #f7f8fc;
  }
`;

const ExpandChevron = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #9098a9;
  transition: transform 0.2s ease, color 0.15s ease;
  transform: ${({ $expanded }) => ($expanded ? "rotate(180deg)" : "rotate(0deg)")};
  ${({ $expanded }) => $expanded && "color: #2671d9;"}
`;

const ExpandedTd = styled.td`
  padding: 0;
  background: #f8faff;
  border-top: 2px solid #d6e4ff;
  border-bottom: 2px solid #d6e4ff;
`;

const ExpandedContent = styled.div`
  padding: 20px 24px 20px 40px;
`;

const ExpandedSectionLabel = styled.h4`
  font-size: 13px;
  font-weight: 700;
  color: #1d2d64;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin: 0 0 14px;
`;

const ExpandedItemsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e8eaf0;
`;

const ExpandedTh = styled.th`
  text-align: left;
  color: #6f7897;
  font-size: 12px;
  font-weight: 600;
  padding: 10px 14px;
  background: #f4f6fb;
  border-bottom: 1px solid #e8eaf0;
`;

const ExpandedBodyTd = styled.td`
  padding: 11px 14px;
  font-size: 13px;
  color: #1d2025;
  border-bottom: 1px solid #edf0f7;
  vertical-align: middle;
  white-space: ${({ $preserveLines }) => ($preserveLines ? "pre-line" : "normal")};

  tr:last-child & {
    border-bottom: none;
  }
`;

const ExpandedLoading = styled.div`
  padding: 20px 24px;
  color: #9098a9;
  font-size: 13px;
`;

const Th = styled.th`
  color: #6f7897;
  font-size: 12px;
  font-weight: 500;
  text-align: left;
  padding: 12px 14px;
  vertical-align: middle;
`;

const Td = styled.td`
  padding: 14px;
  border-top: 1px solid #edf0f7;
  color: #1d2025;
  font-size: 13px;
  vertical-align: middle;
  white-space: ${({ $preserveLines }) => ($preserveLines ? "pre-line" : "normal")};
`;

const NameCell = styled(Td)`
  color: #2671d9;
  font-weight: 600;
  max-width: 180px;
`;

const TableRow = styled.tr`
  transition: background 0.15s ease;
  cursor: pointer;

  background: ${({ $selected }) => ($selected ? "#f0f5ff" : "transparent")};

  &:hover {
    background: ${({ $selected }) => ($selected ? "#f0f5ff" : "#fafbff")};
  }

  &:focus-visible {
    outline: 2px solid #2671d9;
    outline-offset: -2px;
  }
`;

const LoadingCell = styled.td`
  padding: 28px 16px;
  text-align: center;
  color: #797f94;
`;

const StyledCheckbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #2671d9;
  flex-shrink: 0;
`;


const VarianceContainer = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: ${({ $positive }) => ($positive ? "#1c9d4b" : "#e03d3d")};
  font-weight: 600;
`;

const Triangle = styled.span`
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: ${({ $positive }) => ($positive ? "none" : "8px solid #e03d3d")};
  border-bottom: ${({ $positive }) =>
    $positive ? "8px solid #1c9d4b" : "none"};
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

const DrawerOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(13, 18, 28, 0.28);
  display: flex;
  justify-content: flex-end;
  z-index: 20;
`;

const DrawerPanel = styled.div`
  width: min(520px, 100vw);
  height: 100%;
  background: #fff;
  padding: 28px;
  overflow-y: auto;
  box-shadow: -16px 0 48px rgba(17, 24, 39, 0.14);
  display: flex;
  flex-direction: column;
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const DrawerTitle = styled.h2`
  font-size: 22px;
  color: #1d2025;
`;

const CloseDrawerButton = styled.button`
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
  color: #6f7897;
  line-height: 1;
`;

const DrawerLoading = styled.div`
  color: #6f7897;
  padding: 24px 0;
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
  padding: 22px 24px 18px;
  border: 1px solid #edf0f7;
  overflow-y: auto;
  box-shadow: 0 24px 60px rgba(17, 24, 39, 0.12);
  margin: 24px;
`;

const InvoiceCloseButton = styled.button`
  position: absolute;
  top: 18px;
  right: 18px;
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

/* Adjust panel specific styles */

const AdjustSection = styled.div`
  margin-bottom: 24px;
`;

const AdjustSectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #1d2025;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const AdjustRequired = styled.span`
  color: #e03d3d;
  font-size: 16px;
`;

const AdjustDetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 12px;
  column-gap: 8px;
`;

const AdjustDetailLabel = styled.span`
  font-size: 14px;
  color: #6f7897;
  align-self: center;
`;

const AdjustDetailValue = styled.div`
  font-size: 14px;
  color: #1d2025;
  font-weight: 500;
`;

const AdjustInput = styled.input`
  width: 100%;
  border: none;
  border-bottom: 1.5px solid #d4d6df;
  padding: 6px 0;
  font-size: 14px;
  color: #1d2025;
  outline: none;
  background: transparent;

  &:focus {
    border-bottom-color: #2671d9;
  }

  &::placeholder {
    color: #b0b5c9;
  }
`;

const AdjustTextarea = styled.textarea`
  width: 100%;
  border: 1px solid #d4d6df;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  color: #1d2025;
  outline: none;
  resize: vertical;
  font-family: inherit;

  &:focus {
    border-color: #2671d9;
  }

  &::placeholder {
    color: #b0b5c9;
  }
`;

const AdjustReasonText = styled.p`
  font-size: 14px;
  color: #1d2025;
  line-height: 1.6;
`;

const AdjustToast = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1px solid #d4d6df;
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #1d2025;
  box-shadow: 0 4px 16px rgba(17, 24, 39, 0.08);
`;

const AdjustToastIcon = styled.span`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #1c9d4b;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
`;

const AdjustToastClose = styled.button`
  border: none;
  background: transparent;
  cursor: pointer;
  color: #6f7897;
  font-size: 14px;
  margin-left: auto;
  line-height: 1;
`;

const AdjustErrorToast = styled(AdjustToast)`
  border-color: #f5c0c0;
  background: #fff8f8;
`;

const AdjustErrorIcon = styled.span`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #e03d3d;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  flex-shrink: 0;
`;

const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff8f8;
  border: 1px solid #f5c0c0;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #c0392b;
`;

const ErrorBannerClose = styled.button`
  border: none;
  background: transparent;
  cursor: pointer;
  color: #c0392b;
  font-size: 14px;
  margin-left: auto;
  line-height: 1;
`;

const AdjustFooter = styled.div`
  display: flex;
  gap: 12px;
  margin-top: auto;
  padding-top: 24px;
`;

const AdjustSecondaryButton = styled.button`
  flex: 1;
  padding: 14px;
  border-radius: 10px;
  border: 1.5px solid #d4d6df;
  background: #fff;
  color: #1d2025;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #f5f7fb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AdjustPrimaryButton = styled.button`
  flex: 1;
  padding: 14px;
  border-radius: 10px;
  border: none;
  background: #2671d9;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #1d5cb5;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;


export default CustomsDeclarations;
