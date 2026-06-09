import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import chevronSVG from "../../assets/chevron-down.svg";
import noDeclarations from "../../assets/noDeclarations.png";
import searchSVG from "../../assets/search3.svg";
import eyeSVG from "../../assets/eye.svg";
import filtersSVG from "../../assets/filters.svg";
import ministryLogo from "../../assets/ministry_logo.jpeg";
import Popup from "../Popup";
import {
  adjustDeclarationValue,
  approveDeclaration,
  closeDeclaration,
  downloadCustomsDeclarationInvoicePdf,
  fetchCustomsDeclarationDetail,
  fetchCustomsDeclarationInvoice,
  fetchCustomsInvoiceConfiguration,
  fetchCustomsDeclarations,
  rejectDeclaration,
  startCustomsDeclarationReview,
} from "../../functions/customs";
import { StatusBadge, StatusIcon } from "../statusBadge";

const DECLARATION_TYPES = {
  IMPORTER: "IMPORTER",
  INDIVIDUAL: "INDIVIDUAL",
};

const rowKey = (row) => `${row.declarationType}-${row.id}`;

const EMPTY_FILTERS = {
  status: "All",
  declDateFrom: "",
  declDateTo: "",
  amountMin: "",
  amountMax: "",
};

const MENU_GAP = 6;
const MENU_VIEWPORT_MARGIN = 8;

// Client-side filtering over the loaded declarations.
const filterCustomsDeclarations = (list, filters, isPriceAdjustmentEnabled) =>
  (list || []).filter((row) => {
    if (
      filters.status !== "All" &&
      getDisplayStatus(row, isPriceAdjustmentEnabled) !== filters.status
    ) {
      return false;
    }

    if (filters.declDateFrom || filters.declDateTo) {
      const date = row.declarationDate ? new Date(row.declarationDate) : null;
      if (!date || isNaN(date.getTime())) return false;
      if (filters.declDateFrom) {
        const from = new Date(filters.declDateFrom);
        from.setHours(0, 0, 0, 0);
        if (date < from) return false;
      }
      if (filters.declDateTo) {
        const to = new Date(filters.declDateTo);
        to.setHours(23, 59, 59, 999);
        if (date > to) return false;
      }
    }

    const amount = Number(row.declaredTotalUsd || 0);
    if (filters.amountMin !== "" && amount < Number(filters.amountMin))
      return false;
    if (filters.amountMax !== "" && amount > Number(filters.amountMax))
      return false;

    return true;
  });

const CustomsDeclarations = ({ archived = false }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(DECLARATION_TYPES.IMPORTER);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [declarations, setDeclarations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPriceAdjustmentEnabled, setIsPriceAdjustmentEnabled] = useState(false);
  const [selectedDeclaration, setSelectedDeclaration] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);
  const [invoiceDialogTitle, setInvoiceDialogTitle] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [menuAnchorRect, setMenuAnchorRect] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());

  // Details drawer state
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [detailsDrawerRow, setDetailsDrawerRow] = useState(null);

  // Inline row expansion state
  const [expandedRowKey, setExpandedRowKey] = useState(null);
  const [expandedDetail, setExpandedDetail] = useState(null);
  const [expandedDetailLoading, setExpandedDetailLoading] = useState(false);
  const [pendingDashboardSelection, setPendingDashboardSelection] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);

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
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [approveRow, setApproveRow] = useState(null);
  const [approveFromAdjust, setApproveFromAdjust] = useState(false);
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
    const handleResize = () => setOpenMenuId(null);
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [openMenuId]);

  useEffect(() => {
    if (!openMenuId || !menuAnchorRect || !menuRef.current) {
      return;
    }

    const menuRect = menuRef.current.getBoundingClientRect();
    let nextTop = menuAnchorRect.bottom + MENU_GAP;
    if (nextTop + menuRect.height > window.innerHeight - MENU_VIEWPORT_MARGIN) {
      nextTop = Math.max(
        MENU_VIEWPORT_MARGIN,
        menuAnchorRect.top - menuRect.height - MENU_GAP
      );
    }

    let nextLeft = menuAnchorRect.right - menuRect.width;
    if (nextLeft + menuRect.width > window.innerWidth - MENU_VIEWPORT_MARGIN) {
      nextLeft = window.innerWidth - MENU_VIEWPORT_MARGIN - menuRect.width;
    }
    if (nextLeft < MENU_VIEWPORT_MARGIN) {
      nextLeft = MENU_VIEWPORT_MARGIN;
    }

    setMenuPosition((previous) =>
      previous.top === nextTop && previous.left === nextLeft
        ? previous
        : { top: nextTop, left: nextLeft }
    );
  }, [openMenuId, menuAnchorRect]);

  const loadDeclarations = useCallback(async () => {
    setIsLoading(true);
    // Load the full result set so filtering and pagination run client-side.
    const response = await fetchCustomsDeclarations(
      activeTab,
      1,
      1000,
      appliedSearch,
      archived
    );
    if (response) {
      setDeclarations(response.data || []);
    } else {
      setDeclarations([]);
    }
    setIsLoading(false);
  }, [activeTab, appliedSearch, archived]);

  useEffect(() => {
    loadDeclarations();
  }, [loadDeclarations]);

  useEffect(() => {
    const loadCustomsConfiguration = async () => {
      const configuration = await fetchCustomsInvoiceConfiguration();
      setIsPriceAdjustmentEnabled(Boolean(configuration?.priceAdjustmentEnabled));
    };

    loadCustomsConfiguration();
  }, []);

  useEffect(() => {
    const selection = location.state;
    if (!selection?.declarationId) {
      return;
    }

    setActiveTab(selection.declarationType || DECLARATION_TYPES.IMPORTER);
    setCurrentPage(0);
    setPendingDashboardSelection(selection);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  // The backend already scopes the result to active vs archived (CLOSED)
  // declarations, so the remaining filtering here is the user's own filters.
  const filteredDeclarations = useMemo(
    () =>
      filterCustomsDeclarations(
        declarations,
        appliedFilters,
        isPriceAdjustmentEnabled
      ),
    [declarations, appliedFilters, isPriceAdjustmentEnabled]
  );

  const totalElements = filteredDeclarations.length;

  const pagedDeclarations = useMemo(
    () =>
      filteredDeclarations.slice(
        currentPage * pageSize,
        (currentPage + 1) * pageSize
      ),
    [filteredDeclarations, currentPage, pageSize]
  );

  const statusOptions = useMemo(() => {
    const set = new Set();
    declarations.forEach((row) => {
      const status = getDisplayStatus(row, isPriceAdjustmentEnabled);
      if (status) set.add(status);
    });
    return Array.from(set);
  }, [declarations, isPriceAdjustmentEnabled]);

  const activeFilters = useMemo(() => {
    const list = [];
    if (appliedFilters.status !== "All")
      list.push({ key: "status", label: t("Status") });
    if (appliedFilters.declDateFrom || appliedFilters.declDateTo)
      list.push({ key: "declDate", label: t("Declaration Date") });
    if (appliedFilters.amountMin !== "" || appliedFilters.amountMax !== "")
      list.push({ key: "amount", label: t("Declared Total (USD)") });
    return list;
  }, [appliedFilters, t]);

  const activeFilterCount = activeFilters.length;

  const openFilters = () => {
    setDraftFilters(appliedFilters);
    setFilterOpen(true);
  };

  const closeFilters = () => setFilterOpen(false);

  const handleFilterChange = (key, value) => {
    setDraftFilters((previous) => ({ ...previous, [key]: value }));
  };

  const clearDraftFilters = () => setDraftFilters(EMPTY_FILTERS);

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setCurrentPage(0);
    setFilterOpen(false);
  };

  const hasFilterChanges =
    JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters);

  const resetFilterKey = (filters, key) => {
    if (key === "declDate")
      return { ...filters, declDateFrom: "", declDateTo: "" };
    if (key === "amount") return { ...filters, amountMin: "", amountMax: "" };
    return { ...filters, [key]: "All" };
  };

  const removeFilter = (key) => {
    setAppliedFilters((previous) => resetFilterKey(previous, key));
    setDraftFilters((previous) => resetFilterKey(previous, key));
    setCurrentPage(0);
  };

  const clearAllFilters = () => {
    setAppliedFilters(EMPTY_FILTERS);
    setDraftFilters(EMPTY_FILTERS);
    setCurrentPage(0);
  };

  const rangeStart = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const rangeEnd = Math.min((currentPage + 1) * pageSize, totalElements);

  const emptyStateTitle = useMemo(() => {
    if (archived) {
      return t("Customs_NoArchivedDeclarations");
    }
    return activeTab === DECLARATION_TYPES.IMPORTER
      ? t("Customs_NoImporterDeclarations")
      : t("Customs_NoIndividualDeclarations");
  }, [activeTab, archived, t]);

  const handleTabChange = (tab) => {
    setTableActionError(null);
    setActiveTab(tab);
    setCurrentPage(0);
    setAppliedFilters(EMPTY_FILTERS);
    setDraftFilters(EMPTY_FILTERS);
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
    pagedDeclarations.length > 0 &&
    pagedDeclarations.every((row) => selectedRows.has(rowKey(row)));
  const someSelected = pagedDeclarations.some((row) =>
    selectedRows.has(rowKey(row))
  );

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(new Set(pagedDeclarations.map(rowKey)));
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

  const toggleRowExpansion = useCallback(async (row) => {
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
  }, [expandedRowKey]);

  useEffect(() => {
    if (!pendingDashboardSelection?.declarationId) {
      return;
    }
    if (activeTab !== (pendingDashboardSelection.declarationType || DECLARATION_TYPES.IMPORTER)) {
      return;
    }

    const fallbackRow = {
      id: pendingDashboardSelection.declarationId,
      declarationType: pendingDashboardSelection.declarationType || DECLARATION_TYPES.IMPORTER,
    };
    const selectedRow =
      declarations.find((row) => row.id === pendingDashboardSelection.declarationId) ||
      fallbackRow;

    toggleRowExpansion(selectedRow);
    setPendingDashboardSelection(null);
  }, [activeTab, declarations, pendingDashboardSelection, toggleRowExpansion]);

  const openInvoice = async (row, title = "") => {
    if (!row) return;
    setOpenMenuId(null);
    setIsInvoiceLoading(true);
    setSelectedInvoice(null);
    setInvoiceDialogTitle(title);
    const invoice = await fetchCustomsDeclarationInvoice(
      row.declarationType,
      row.id
    );
    setSelectedInvoice(invoice);
    setIsInvoiceLoading(false);
    if (!invoice) {
      setInvoiceDialogTitle("");
    }
    return invoice;
  };

  const closeInvoice = async () => {
    setSelectedInvoice(null);
    setIsInvoiceLoading(false);
    setInvoiceDialogTitle("");
  };

  const handleDownloadInvoice = async () => {
    if (!selectedInvoice) return;

    const downloaded = await downloadCustomsDeclarationInvoicePdf(
      activeTab,
      selectedInvoice.declarationId,
      `${selectedInvoice.invoiceNumber || "invoice"}.pdf`
    );

    if (!downloaded) {
      global.alert2?.(t("Failed to download invoice. Please try again."));
      return;
    }

    setSelectedInvoice(null);
    setIsInvoiceLoading(false);
    setInvoiceDialogTitle("");
  };

  const handleActionClick = async (e, row) => {
    if (openMenuId === row.id) {
      setOpenMenuId(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();

    if (row.status === "SUBMITTED") {
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

    setMenuAnchorRect(rect);
    setMenuPosition({
      top: rect.bottom + MENU_GAP,
      left: Math.max(MENU_VIEWPORT_MARGIN, rect.right - 220),
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

  const openApproveModal = (row, fromAdjust = false) => {
    if (!row) return;
    setOpenMenuId(null);
    setTableActionError(null);
    setAdjustError(null);
    setApproveRow(row);
    setApproveFromAdjust(fromAdjust);
    setIsApproveOpen(true);
  };

  const closeApproveModal = () => {
    setIsApproveOpen(false);
    setApproveRow(null);
    setApproveFromAdjust(false);
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
    openApproveModal(adjustRow, true);
  };

  const handleConfirmApprove = async () => {
    if (!approveRow) return;

    setIsActioning(true);
    setTableActionError(null);
    setAdjustError(null);

    const result = await approveDeclaration(
      approveRow.declarationType,
      approveRow.id
    );

    setIsActioning(false);

    if (!result) {
      if (approveFromAdjust) {
        setAdjustError(t("Failed to approve declaration. Please try again."));
      } else {
        setTableActionError(t("Failed to approve declaration. Please try again."));
      }
      return;
    }

    setDeclarations((prev) =>
      prev.map((item) =>
        item.id === approveRow.id &&
        item.declarationType === approveRow.declarationType
          ? result
          : item
      )
    );

    if (approveFromAdjust) {
      closeAdjustPanel();
    }

    closeApproveModal();

    const invoice = await openInvoice(result, t("Invoice Generated"));
    if (!invoice) {
      setTableActionError(
        t("Invoice was generated, but it could not be opened. You can view it from the actions menu.")
      );
    }
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
          <Title>
            {t(archived ? "Customs_ArchivedTitle" : "Customs_DeclarationTitle")}
          </Title>
          <Subtitle>
            {t(
              archived
                ? "Customs_ArchivedSubtitle"
                : "Customs_DeclarationSubtitle"
            )}
          </Subtitle>
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

          <ToolbarRight>
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

            <FilterButton
              type="button"
              onClick={openFilters}
              $active={activeFilterCount > 0}
            >
              <img src={filtersSVG} alt="Filters" />
              {t("Filters")}
              {activeFilterCount > 0 && (
                <FilterBadge>{activeFilterCount}</FilterBadge>
              )}
            </FilterButton>
          </ToolbarRight>
        </Toolbar>

        {activeFilterCount > 0 && (
          <FiltersAppliedRow>
            <FiltersAppliedLabel>{t("Filters applied")}:</FiltersAppliedLabel>
            {activeFilters.map((filter) => (
              <FilterChip key={filter.key}>
                {filter.label}
                <ChipRemove
                  type="button"
                  onClick={() => removeFilter(filter.key)}
                  aria-label={`Remove ${filter.label} filter`}
                >
                  ✕
                </ChipRemove>
              </FilterChip>
            ))}
            <ClearAllButton type="button" onClick={clearAllFilters}>
              {t("Clear all")}
            </ClearAllButton>
          </FiltersAppliedRow>
        )}

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

        {declarations.length === 0 && !isLoading ? (
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
                  <PageSizeInput value={pageSize} onChange={handlePageSizeChange}>
                    {[10, 20, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size} / page
                      </option>
                    ))}
                  </PageSizeInput>
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
                  ) : pagedDeclarations.length === 0 ? (
                    <tr>
                      <LoadingCell colSpan="12">
                        {t("ImporterDeclarations_NoSearchResults")}
                      </LoadingCell>
                    </tr>
                  ) : (
                    pagedDeclarations.map((row) => {
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
                        <Td>
                          <AdjustedEstimatedValue
                            row={row}
                            isPriceAdjustmentEnabled={isPriceAdjustmentEnabled}
                          />
                        </Td>
                        <Td>
                          <VarianceValue value={Number(row.variancePercent || 0)} />
                        </Td>
                        <Td>{row.priceSource}</Td>
                        <Td>
                          <StatusBadge
                            $status={getDisplayStatus(row, isPriceAdjustmentEnabled)}
                          >
                            <StatusIcon
                              status={getDisplayStatus(row, isPriceAdjustmentEnabled)}
                            />
                            {formatStatusLabel(
                              getDisplayStatus(row, isPriceAdjustmentEnabled)
                            )}
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
                                $left={menuPosition.left}
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
                                {canAdjustDeclaration(row, isPriceAdjustmentEnabled) && (
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
                                    onClick={() => openApproveModal(row)}
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
                                          archived
                                            ? previousRows.map((item) =>
                                                item.id === row.id &&
                                                item.declarationType === row.declarationType
                                                  ? result
                                                  : item
                                              )
                                            : previousRows.filter(
                                                (item) =>
                                                  !(
                                                    item.id === row.id &&
                                                    item.declarationType === row.declarationType
                                                  )
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
            <InvoiceCloseButton type="button" onClick={closeInvoice}>
              &#x2715;
            </InvoiceCloseButton>
            <InvoiceBody>
              {isInvoiceLoading ? (
                <DrawerLoading>{t("Loading")}</DrawerLoading>
              ) : !selectedInvoice ? (
                <DrawerLoading>{t("No data available")}</DrawerLoading>
              ) : (
                <div>
                  {invoiceDialogTitle && (
                    <InvoiceDialogTitle className="invoice-dialog-title">
                      {invoiceDialogTitle}
                    </InvoiceDialogTitle>
                  )}

                  <InvoiceHeaderBlock className="invoice-header">
                    <InvoiceLeftHeader className="invoice-left-header">
                      <InvoiceSeal className="invoice-seal">
                        <img src={ministryLogo} alt="Ministry of Finance" />
                      </InvoiceSeal>
                      <InvoiceIssuerBlock>
                        <InvoiceIssuerCountry className="invoice-issuer-country">
                          {t("Republic of Lebanon")}
                        </InvoiceIssuerCountry>
                        <InvoiceIssuerTitle className="invoice-issuer-title">
                          {t("Ministry of Finance")}
                        </InvoiceIssuerTitle>
                        <InvoiceIssuerSubtitle className="invoice-issuer-subtitle">
                          {t("Customs Directorate")}
                        </InvoiceIssuerSubtitle>
                      </InvoiceIssuerBlock>
                    </InvoiceLeftHeader>

                    <InvoiceRightHeader className="invoice-right-header">
                      <InvoiceHeading className="invoice-heading">{t("Invoice")}</InvoiceHeading>
                      <InvoiceNumber className="invoice-number">{selectedInvoice.invoiceNumber}</InvoiceNumber>
                    </InvoiceRightHeader>
                  </InvoiceHeaderBlock>

                  <InvoiceMetaGrid className="invoice-meta-grid">
                    <InvoiceMetaItem>
                      <InvoiceMetaLabel className="invoice-meta-label">{t("Declaration No.")}</InvoiceMetaLabel>
                      <InvoiceMetaValue className="invoice-meta-value">{selectedInvoice.declarationNumber}</InvoiceMetaValue>
                    </InvoiceMetaItem>
                    <InvoiceMetaItem>
                      <InvoiceMetaLabel className="invoice-meta-label">{t("Devices Count")}</InvoiceMetaLabel>
                      <InvoiceMetaValue className="invoice-meta-value">{selectedInvoice.devicesCount}</InvoiceMetaValue>
                    </InvoiceMetaItem>
                    <InvoiceMetaItem>
                      <InvoiceMetaLabel className="invoice-meta-label">{t("Importer")}</InvoiceMetaLabel>
                      <InvoiceMetaValue className="invoice-meta-value">{selectedInvoice.importerName}</InvoiceMetaValue>
                    </InvoiceMetaItem>
                    <InvoiceMetaItem>
                      <InvoiceMetaLabel className="invoice-meta-label">{t("Issue Date")}</InvoiceMetaLabel>
                      <InvoiceMetaValue className="invoice-meta-value">{formatDate(selectedInvoice.issueDate)}</InvoiceMetaValue>
                    </InvoiceMetaItem>
                    <InvoiceMetaItem>
                      <InvoiceMetaLabel className="invoice-meta-label">{t("Currency")}</InvoiceMetaLabel>
                      <InvoiceMetaValue className="invoice-meta-value">{selectedInvoice.currency}</InvoiceMetaValue>
                    </InvoiceMetaItem>
                    <InvoiceMetaItem>
                      <InvoiceMetaLabel className="invoice-meta-label">{t("Declaration Date")}</InvoiceMetaLabel>
                      <InvoiceMetaValue className="invoice-meta-value">{formatDate(selectedInvoice.declarationDate)}</InvoiceMetaValue>
                    </InvoiceMetaItem>
                <InvoiceMetaItem>
                  <InvoiceMetaLabel className="invoice-meta-label">{t("Payment Status")}</InvoiceMetaLabel>
                  <InvoiceMetaValue className="invoice-meta-value">
                    <StatusBadge
                          className={`invoice-badge ${selectedInvoice.invoiceStatus === "PAID" ? "paid" : "awaiting"}`}
                          $status={selectedInvoice.invoiceStatus === "PAID" ? "PAID" : "AWAITING_PAYMENT"}
                        >
                          {formatInvoiceStatusLabel(t, selectedInvoice.invoiceStatus)}
                        </StatusBadge>
                      </InvoiceMetaValue>
                    </InvoiceMetaItem>
                  </InvoiceMetaGrid>

                  <InvoiceSummaryCard className="invoice-summary-card">
                    <InvoiceSummaryRow className="invoice-summary-row">
                      <span>{t("Total Approved Value")}</span>
                      <span>{formatInvoiceMoney(selectedInvoice.approvedValueUsd)}</span>
                    </InvoiceSummaryRow>
                    <InvoiceSummaryRow className="invoice-summary-row">
                      <span>
                        {t("Total Customs Duty")} ({Number(selectedInvoice.dutyPercentage || 0).toFixed(0)}%)
                      </span>
                      <strong>{formatInvoiceMoney(selectedInvoice.customsDutyUsd)}</strong>
                    </InvoiceSummaryRow>
                    <InvoiceSummaryRow className="invoice-summary-row">
                      <span>{t("Total (Approved Value + Customs Duty)")}</span>
                      <span>{formatInvoiceMoney(selectedInvoice.totalWithDutyUsd)}</span>
                    </InvoiceSummaryRow>
                    <InvoiceSummaryRow className="invoice-summary-row last" $last>
                      <span>{t("VAT")} ({Number(selectedInvoice.vatPercentage || 0).toFixed(0)}%)</span>
                      <strong>+{formatInvoiceMoney(selectedInvoice.vatAmountUsd)}</strong>
                    </InvoiceSummaryRow>
                  </InvoiceSummaryCard>

                  <InvoiceTotalBox className="invoice-total-box">
                    <InvoiceTotalLeft className="invoice-total-left">
                      <strong>{t("TOTAL PAYABLE")}</strong>{" "}
                      <InvoiceTotalSub className="invoice-total-sub">({t("TOTAL CUSTOMS DUTY + VAT")})</InvoiceTotalSub>
                    </InvoiceTotalLeft>
                    <InvoiceTotalRight className="invoice-total-right">
                      <InvoiceTotalAmount className="invoice-total-amount">{formatInvoiceMoney(selectedInvoice.totalPayableUsd)}</InvoiceTotalAmount>
                      <InvoiceTotalApprox className="invoice-total-approx">
                        ≈ {(Number(selectedInvoice.totalPayableUsd || 0) * Number(selectedInvoice.usdToLbpRate || 0)).toLocaleString()} LBP
                      </InvoiceTotalApprox>
                      <InvoiceTotalRate className="invoice-total-rate">
                        {t("Exchange Rate")}: {Number(selectedInvoice.usdToLbpRate || 0).toLocaleString()} USD/LBP
                      </InvoiceTotalRate>
                    </InvoiceTotalRight>
                  </InvoiceTotalBox>

                  <InvoiceFooterNote className="invoice-footer-note">
                    {selectedInvoice.invoiceStatus === "PAID"
                      ? t("Thank you. Payment received")
                      : t("Invoice generated. Awaiting payment.")}
                  </InvoiceFooterNote>
                </div>
              )}
            </InvoiceBody>
            {!isInvoiceLoading && selectedInvoice && (
                <InvoiceActions>
                  <InvoiceSecondaryButton type="button" onClick={closeInvoice}>
                    {t("Back to Declarations")}
                  </InvoiceSecondaryButton>
                  <InvoicePrimaryButton type="button" onClick={handleDownloadInvoice}>
                    {t("Download Invoice")}
                  </InvoicePrimaryButton>
                </InvoiceActions>
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
                    <StatusBadge
                      $status={getDisplayStatus(
                        adjustRow,
                        isPriceAdjustmentEnabled
                      )}
                    >
                      <StatusIcon
                        status={getDisplayStatus(
                          adjustRow,
                          isPriceAdjustmentEnabled
                        )}
                      />
                      {formatStatusLabel(
                        getDisplayStatus(adjustRow, isPriceAdjustmentEnabled)
                      )}
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
                      <StatusBadge
                        $status={getDisplayStatus(
                          detailsDrawerRow,
                          isPriceAdjustmentEnabled
                        )}
                      >
                        <StatusIcon
                          status={getDisplayStatus(
                            detailsDrawerRow,
                            isPriceAdjustmentEnabled
                          )}
                        />
                        {formatStatusLabel(
                          getDisplayStatus(
                            detailsDrawerRow,
                            isPriceAdjustmentEnabled
                          )
                        )}
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

      {isApproveOpen && approveRow && (
        <Popup
          purpose="approveDeclaration"
          onClose={closeApproveModal}
          onAction={handleConfirmApprove}
          busy={isActioning}
        />
      )}

      {filterOpen && (
        <FilterOverlay onClick={closeFilters}>
          <FilterPanel onClick={(e) => e.stopPropagation()}>
            <FilterPanelHeader>
              <FilterPanelTitle>{t("Filters")}</FilterPanelTitle>
              <FilterCloseButton type="button" onClick={closeFilters}>
                ✕
              </FilterCloseButton>
            </FilterPanelHeader>

            <FilterBody>
              <FilterField>
                <FilterLabel>{t("Status")}</FilterLabel>
                <FilterSelect
                  value={draftFilters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  <option value="All">{t("All")}</option>
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {formatStatusLabel(option)}
                    </option>
                  ))}
                </FilterSelect>
              </FilterField>

              <FilterField>
                <FilterLabel>{t("Declaration Date")}</FilterLabel>
                <RangeRow>
                  <DateInput
                    type="date"
                    value={draftFilters.declDateFrom}
                    max={draftFilters.declDateTo || undefined}
                    onChange={(e) =>
                      handleFilterChange("declDateFrom", e.target.value)
                    }
                  />
                  <RangeSeparator>-</RangeSeparator>
                  <DateInput
                    type="date"
                    value={draftFilters.declDateTo}
                    min={draftFilters.declDateFrom || undefined}
                    onChange={(e) =>
                      handleFilterChange("declDateTo", e.target.value)
                    }
                  />
                </RangeRow>
              </FilterField>

              <FilterField>
                <FilterLabel>{t("Declared Total (USD)")}</FilterLabel>
                <RangeRow>
                  <AmountInput
                    type="number"
                    min="0"
                    placeholder={t("Min")}
                    value={draftFilters.amountMin}
                    onChange={(e) =>
                      handleFilterChange("amountMin", e.target.value)
                    }
                  />
                  <RangeSeparator>-</RangeSeparator>
                  <AmountInput
                    type="number"
                    min="0"
                    placeholder={t("Max")}
                    value={draftFilters.amountMax}
                    onChange={(e) =>
                      handleFilterChange("amountMax", e.target.value)
                    }
                  />
                </RangeRow>
              </FilterField>
            </FilterBody>

            <FilterFooter>
              <ClearFiltersButton type="button" onClick={clearDraftFilters}>
                {t("Clear all filters")}
              </ClearFiltersButton>
              <ApplyFilterButton
                type="button"
                onClick={applyFilters}
                disabled={!hasFilterChanges}
              >
                {t("Apply")}
              </ApplyFilterButton>
            </FilterFooter>
          </FilterPanel>
        </FilterOverlay>
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

  if (status === "PENDING_APPROVAL") {
    return "Pending Approval";
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

const hasPendingApprovalAdjustment = (row, isPriceAdjustmentEnabled = true) =>
  isPriceAdjustmentEnabled &&
  (row?.declarationType === DECLARATION_TYPES.IMPORTER ||
    row?.declarationType === DECLARATION_TYPES.INDIVIDUAL) &&
  row?.status === "UNDER_REVIEW" &&
  row?.approvedPriceUsd != null &&
  Boolean(row?.adjustmentReason?.trim());

const hasAdjustedApprovedValue = (row, isPriceAdjustmentEnabled = true) =>
  (row?.declarationType === DECLARATION_TYPES.IMPORTER ||
    row?.declarationType === DECLARATION_TYPES.INDIVIDUAL) &&
  (row?.status !== "UNDER_REVIEW" || isPriceAdjustmentEnabled) &&
  row?.approvedPriceUsd != null &&
  Boolean(row?.adjustmentReason?.trim());

const getDisplayStatus = (row, isPriceAdjustmentEnabled = true) =>
  hasPendingApprovalAdjustment(row, isPriceAdjustmentEnabled)
    ? "PENDING_APPROVAL"
    : row?.status;

const canAdjustDeclaration = (row, isPriceAdjustmentEnabled) =>
  isPriceAdjustmentEnabled &&
  (row.declarationType === DECLARATION_TYPES.IMPORTER ||
    row.declarationType === DECLARATION_TYPES.INDIVIDUAL) &&
  row.status === "UNDER_REVIEW";

const canApproveDeclaration = (row) =>
  (row.declarationType === DECLARATION_TYPES.IMPORTER ||
    row.declarationType === DECLARATION_TYPES.INDIVIDUAL) &&
  row.status === "UNDER_REVIEW";

const canViewInvoice = (row) =>
  (
    row.status === "AWAITING_PAYMENT" ||
    row.status === "PAID" ||
    row.status === "CLOSED" ||
    (row.status === "APPROVED" && row.invoiceGenerated)
  ) &&
  (
    row.declarationType === DECLARATION_TYPES.IMPORTER ||
    row.declarationType === DECLARATION_TYPES.INDIVIDUAL
  );

const canCloseDeclaration = (row) =>
  (row.declarationType === DECLARATION_TYPES.IMPORTER ||
    row.declarationType === DECLARATION_TYPES.INDIVIDUAL) &&
  row.status === "PAID";

const canRejectDeclaration = (row) =>
  (row.declarationType === DECLARATION_TYPES.IMPORTER ||
    row.declarationType === DECLARATION_TYPES.INDIVIDUAL) &&
  (row.status === "SUBMITTED" || row.status === "UNDER_REVIEW");

const AdjustedEstimatedValue = ({ row, isPriceAdjustmentEnabled }) => {
  if (!hasAdjustedApprovedValue(row, isPriceAdjustmentEnabled)) {
    return formatMoney(row?.estimatedValueUsd);
  }

  return (
    <AdjustedValueStack>
      <OriginalValueText>{formatMoney(row?.estimatedValueUsd)}</OriginalValueText>
      <AdjustedValueText>{formatMoney(row?.approvedPriceUsd)}</AdjustedValueText>
    </AdjustedValueStack>
  );
};

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
  min-height: 520px;
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
  min-height: 360px;
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
  min-height: 360px;
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

const PageSizeInput = styled.select`
  height: 36px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid #d4d6df;
  background: #fff;
  color: #20294c;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  outline: none;

  &:focus {
    border-color: #436c4d;
  }
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
  min-height: 360px;
  text-align: center;
  color: #797f94;
  vertical-align: middle;
`;

const StyledCheckbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #2671d9;
  flex-shrink: 0;
`;

const AdjustedValueStack = styled.div`
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  line-height: 1.15;
`;

const OriginalValueText = styled.span`
  color: #98a0b7;
  font-size: 12px;
  text-decoration: line-through;
`;

const AdjustedValueText = styled.span`
  color: #1c9d4b;
  font-size: 14px;
  font-weight: 700;
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
  left: ${({ $left }) => $left}px;
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

const InvoiceDialogTitle = styled.h2`
  margin: 6px 0 20px;
  font-size: 30px;
  font-weight: 700;
  color: #233260;
  line-height: 1.2;
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


const ToolbarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  font-size: 14px;
  cursor: pointer;
  border-radius: 38px;
  border: 1px solid ${(props) => (props.$active ? "#2671d9" : "#d4d6df")};
  background: #fff;
  color: ${(props) => (props.$active ? "#2671d9" : "#20294c")};
  white-space: nowrap;
  transition: all 0.3s ease;

  img {
    height: 18px;
  }

  &:hover {
    opacity: 0.7;
  }
`;

const FilterBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: #2671d9;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
`;

const FiltersAppliedRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
`;

const FiltersAppliedLabel = styled.span`
  color: #797f94;
  font-size: 14px;
`;

const FilterChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 38px;
  border: 1px solid #d4d6df;
  background: #fff;
  color: #20294c;
  font-size: 14px;
`;

const ChipRemove = styled.button`
  border: none;
  background: transparent;
  padding: 0;
  font-size: 12px;
  line-height: 1;
  color: #797f94;
  cursor: pointer;

  &:hover {
    color: #20294c;
  }
`;

const ClearAllButton = styled.button`
  border: none;
  background: transparent;
  padding: 0;
  font-size: 14px;
  color: #2671d9;
  text-decoration: underline;
  cursor: pointer;

  &:hover {
    opacity: 0.7;
  }
`;

const FilterOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(13, 18, 28, 0.28);
  display: flex;
  justify-content: flex-end;
  z-index: 30;
`;

const FilterPanel = styled.div`
  width: min(440px, 100vw);
  height: 100%;
  background: #fff;
  padding: 28px 32px;
  display: flex;
  flex-direction: column;
  box-shadow: -16px 0 48px rgba(17, 24, 39, 0.14);
`;

const FilterPanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
`;

const FilterPanelTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: #2671d9;
`;

const FilterCloseButton = styled.button`
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  color: #6f7897;
  line-height: 1;

  &:hover {
    opacity: 0.7;
  }
`;

const FilterBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  flex: 1;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const FilterField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FilterLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #797f94;
`;

const FilterSelect = styled.select`
  width: 100%;
  border: none;
  border-bottom: 1.5px solid #d4d6df;
  outline: none;
  font-size: 16px;
  font-weight: 500;
  padding: 6px 0;
  background: none;
  color: #20294c;
  cursor: pointer;
  font-family: inherit;

  &:focus {
    border-bottom-color: #2671d9;
  }
`;

const RangeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1.5px solid #d4d6df;
  padding: 6px 0;
`;

const DateInput = styled.input`
  border: none;
  outline: none;
  font-size: 16px;
  font-weight: 500;
  background: none;
  color: #20294c;
  font-family: inherit;
  flex: 1;
`;

const AmountInput = styled.input`
  border: none;
  outline: none;
  font-size: 16px;
  font-weight: 500;
  background: none;
  color: #20294c;
  font-family: inherit;
  width: 100%;
  flex: 1;
`;

const RangeSeparator = styled.span`
  color: #797f94;
`;

const FilterFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 24px;
  margin-top: 16px;
  border-top: 1px solid #edf0f7;
`;

const ClearFiltersButton = styled.button`
  flex: 1;
  padding: 16px 24px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 38px;
  border: 1px solid #d4d6df;
  background: #fff;
  color: #20294c;
  transition: all 0.3s ease;

  &:hover {
    opacity: 0.7;
  }
`;

const ApplyFilterButton = styled.button`
  flex: 1;
  padding: 16px 24px;
  font-size: 15px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  border-radius: 38px;
  border: 1px solid #2671d9;
  background: #2671d9;
  transition: all 0.3s ease;

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
  &:hover:not(:disabled) {
    opacity: 0.8;
  }
`;

export default CustomsDeclarations;
