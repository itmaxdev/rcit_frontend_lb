import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import emptySVG from "../../assets/noRegistered.svg";
import plusSVG from "../../assets/plus.svg";
import searchSVG from "../../assets/search3.svg";
import eyeSVG from "../../assets/eye.svg";
import filtersSVG from "../../assets/filters.svg";
import {
  downloadFullFile,
  fetchImporterDeclarationById,
  fetchImporterDeclarations,
} from "../../functions/impDeclare";
import {
  clearImporterUploadData,
  fetchClearableImporterUpload,
} from "../../functions/registered";
import { StatusBadge, StatusIcon } from "../statusBadge";

const EMPTY_FILTERS = {
  status: "All",
  declDateFrom: "",
  declDateTo: "",
  dutyMin: "",
  dutyMax: "",
};

const MENU_GAP = 6;
const MENU_VIEWPORT_MARGIN = 8;

// Client-side filtering over the loaded declarations.
const filterDeclarations = (list, filters) =>
  (list || []).filter((declaration) => {
    if (
      filters.status !== "All" &&
      getDisplayStatus(declaration) !== filters.status
    ) {
      return false;
    }

    if (filters.declDateFrom || filters.declDateTo) {
      const date = declaration.createdAt
        ? new Date(declaration.createdAt)
        : null;
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

    const duty = Number(declaration.totalCustomsDuty || 0);
    if (filters.dutyMin !== "" && duty < Number(filters.dutyMin)) return false;
    if (filters.dutyMax !== "" && duty > Number(filters.dutyMax)) return false;

    return true;
  });

const ImporterDeclarations = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [declarations, setDeclarations] = useState([]);
  const [totalDeclarations, setTotalDeclarations] = useState(0);
  const [clearableUpload, setClearableUpload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [menuAnchorRect, setMenuAnchorRect] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [expandedDetail, setExpandedDetail] = useState(null);
  const [expandedDetailLoading, setExpandedDetailLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);

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

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setAppliedSearch(searchQuery.trim());
    }, 250);

    return () => window.clearTimeout(timerId);
  }, [searchQuery]);

  const loadDeclarations = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    const response = await fetchImporterDeclarations(1, 1000, appliedSearch);
    if (!response) {
      setDeclarations([]);
      setTotalDeclarations(0);
      setLoadError(true);
      setLoading(false);
      return;
    }
    setDeclarations(response.data || []);
    setTotalDeclarations(response.totalElements || 0);
    setLoading(false);
  }, [appliedSearch]);

  const loadClearableUpload = useCallback(async () => {
    const response = await fetchClearableImporterUpload();
    setClearableUpload(response);
  }, []);

  useEffect(() => {
    loadDeclarations();
    loadClearableUpload();
  }, [loadDeclarations, loadClearableUpload]);

  const isSearching = appliedSearch.length > 0;

  // Filtered declarations + filter UI state.
  const visibleDeclarations = useMemo(
    () => filterDeclarations(declarations, appliedFilters),
    [declarations, appliedFilters]
  );

  const statusOptions = useMemo(() => {
    const set = new Set();
    declarations.forEach((d) => set.add(getDisplayStatus(d)));
    return Array.from(set);
  }, [declarations]);

  const activeFilters = useMemo(() => {
    const list = [];
    if (appliedFilters.status !== "All")
      list.push({ key: "status", label: t("Status") });
    if (appliedFilters.declDateFrom || appliedFilters.declDateTo)
      list.push({ key: "declDate", label: t("Declaration Date") });
    if (appliedFilters.dutyMin !== "" || appliedFilters.dutyMax !== "")
      list.push({ key: "duty", label: t("Customs Duty (USD)") });
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
    setFilterOpen(false);
  };

  const hasFilterChanges =
    JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters);

  const resetFilterKey = (filters, key) => {
    if (key === "declDate")
      return { ...filters, declDateFrom: "", declDateTo: "" };
    if (key === "duty") return { ...filters, dutyMin: "", dutyMax: "" };
    return { ...filters, [key]: "All" };
  };

  const removeFilter = (key) => {
    setAppliedFilters((previous) => resetFilterKey(previous, key));
    setDraftFilters((previous) => resetFilterKey(previous, key));
  };

  const clearAllFilters = () => {
    setAppliedFilters(EMPTY_FILTERS);
    setDraftFilters(EMPTY_FILTERS);
  };

  const allSelected =
    visibleDeclarations.length > 0 &&
    visibleDeclarations.every((d) => selectedRows.has(d.id));
  const someSelected = visibleDeclarations.some((d) => selectedRows.has(d.id));

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(new Set(visibleDeclarations.map((d) => d.id)));
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

  const handleOpenInvoice = (uploadId) => {
    navigate(`/profile/role_importer/DeclareDevices/${uploadId}`, {
      state: { openInvoice: true },
    });
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

  const toggleRowExpansion = useCallback(async (declaration) => {
    if (expandedRowId === declaration.id) {
      setExpandedRowId(null);
      setExpandedDetail(null);
      return;
    }

    setExpandedRowId(declaration.id);
    setExpandedDetail(null);
    setExpandedDetailLoading(true);
    const detail = await fetchImporterDeclarationById(declaration.id);
    setExpandedDetail(detail);
    setExpandedDetailLoading(false);
  }, [expandedRowId]);

  if (!loading && declarations.length === 0 && !isSearching) {
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
          <ToolbarLeft>
            <SearchBar>
              <SearchIcon src={searchSVG} alt="Search" />
              <SearchInput
                type="text"
                placeholder={t("ImporterDeclarations_SearchPlaceholder")}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </SearchBar>

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
          </ToolbarLeft>

          <ResultsText>
            {visibleDeclarations.length} {t("Out of")} {totalDeclarations}
          </ResultsText>
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

        <TableWrapper>
          {loading ? (
            <LoadingState>{t("Loading")}</LoadingState>
          ) : (
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
                  <Th>{t("Declaration Number")}</Th>
                  <Th>{t("Declaration Date")}</Th>
                  <Th>{t("Nbr of declared devices")}</Th>
                  <Th>{t("Status")}</Th>
                  <Th>{t("Customs Duty (USD)")}</Th>
                  <Th>{t("Actions")}</Th>
                </tr>
              </thead>
              <tbody>
                {visibleDeclarations.length === 0 ? (
                  <tr>
                    <EmptyTableCell colSpan="8">
                      {t("ImporterDeclarations_NoSearchResults")}
                    </EmptyTableCell>
                  </tr>
                ) : (
                  visibleDeclarations.map((declaration) => {
                    const currentStatus = getDisplayStatus(declaration);
                    const isExpanded = expandedRowId === declaration.id;

                    return (
                      <React.Fragment key={declaration.id}>
                      <TableRow
                        $selected={isExpanded}
                        tabIndex={0}
                        onClick={() => toggleRowExpansion(declaration)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            toggleRowExpansion(declaration);
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
                        <Td onClick={(event) => event.stopPropagation()}>
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
                                setMenuAnchorRect(rect);
                                setMenuPosition({
                                  top: rect.bottom + MENU_GAP,
                                  left: Math.max(MENU_VIEWPORT_MARGIN, rect.right - 220),
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
                                $left={menuPosition.left}
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
                                {(currentStatus === "AWAITING_PAYMENT" ||
                                  currentStatus === "PAID" ||
                                  currentStatus === "CLOSED") && (
                                  <ActionMenuButton
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      handleOpenInvoice(declaration.id);
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
                      {isExpanded && (
                        <tr>
                          <ExpandedTd colSpan="8">
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
                                    {expandedDetail.items.map((item, index) => (
                                      <tr key={`${item.brand}-${item.model}-${index}`}>
                                        <ExpandedBodyTd>{item.brand || "-"}</ExpandedBodyTd>
                                        <ExpandedBodyTd>{item.model || "-"}</ExpandedBodyTd>
                                        <ExpandedBodyTd $preserveLines>{item.imeis || "-"}</ExpandedBodyTd>
                                        <ExpandedBodyTd>{item.imeiCount ?? 0}</ExpandedBodyTd>
                                        <ExpandedBodyTd>{item.deviceStatus || "-"}</ExpandedBodyTd>
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
          )}
        </TableWrapper>
      </TableCard>

      {filterOpen && (
        <FilterOverlay onClick={closeFilters}>
          <FilterPanel onClick={(e) => e.stopPropagation()}>
            <FilterPanelHeader>
              <FilterPanelTitle>{t("Filters")}</FilterPanelTitle>
              <CloseButton type="button" onClick={closeFilters}>
                ✕
              </CloseButton>
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
                      {formatStatusLabel(t, option)}
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
                <FilterLabel>{t("Customs Duty (USD)")}</FilterLabel>
                <RangeRow>
                  <AmountInput
                    type="number"
                    min="0"
                    placeholder={t("Min")}
                    value={draftFilters.dutyMin}
                    onChange={(e) =>
                      handleFilterChange("dutyMin", e.target.value)
                    }
                  />
                  <RangeSeparator>-</RangeSeparator>
                  <AmountInput
                    type="number"
                    min="0"
                    placeholder={t("Max")}
                    value={draftFilters.dutyMax}
                    onChange={(e) =>
                      handleFilterChange("dutyMax", e.target.value)
                    }
                  />
                </RangeRow>
              </FilterField>
            </FilterBody>

            <FilterFooter>
              <ClearFiltersButton type="button" onClick={clearDraftFilters}>
                {t("Clear all filters")}
              </ClearFiltersButton>
              <ApplyButton
                type="button"
                onClick={applyFilters}
                disabled={!hasFilterChanges}
              >
                {t("Apply")}
              </ApplyButton>
            </FilterFooter>
          </FilterPanel>
        </FilterOverlay>
      )}
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
    PENDING_APPROVAL: t("Pending Approval"),
    APPROVED: t("Approved"),
    DECLINED: t("Rejected"),
    AWAITING_PAYMENT: t("Awaiting Payment"),
    PAID: t("Paid"),
    CLOSED: t("Closed"),
  };

  return labels[status] || status;
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
  flex: 1;
  min-height: 360px;
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  overflow-y: visible;
`;

const Table = styled.table`
  width: 100%;
  min-height: 100%;
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
  cursor: pointer;
  background: ${({ $selected }) => ($selected ? "#f5f6fa" : "#fff")};

  &:hover {
    background: ${({ $selected }) => ($selected ? "#f5f6fa" : "#fafbff")};
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

const ExpandChevron = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ $expanded }) => ($expanded ? "#2671d9" : "#7a84a0")};
  transform: rotate(${({ $expanded }) => ($expanded ? "180deg" : "0deg")});
  transition: transform 0.2s ease, color 0.2s ease;
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
  min-height: 360px;
  text-align: center;
  color: #797f94;
  border-top: 1px solid #edf0f7;
  vertical-align: middle;
`;

const ExpandedTd = styled.td`
  padding: 0;
  border-top: 1px solid #cfd7f3;
  background: #f5f6fa;
`;

const ExpandedContent = styled.div`
  padding: 18px 20px 20px;
`;

const ExpandedLoading = styled.div`
  padding: 24px 20px;
  color: #797f94;
  font-size: 14px;
`;

const ExpandedSectionLabel = styled.h3`
  margin: 0 0 14px;
  color: #263765;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const ExpandedItemsTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: #fff;
  border-radius: 14px;
  overflow: hidden;

  thead th {
    padding: 16px 14px;
    background: #eef2fb;
    color: #6c799c;
    font-size: 14px;
    font-weight: 500;
    text-align: left;
  }

  thead th:first-child {
    border-top-left-radius: 14px;
  }

  thead th:last-child {
    border-top-right-radius: 14px;
  }
`;

const ExpandedTh = styled.th``;

const ExpandedBodyTd = styled.td`
  padding: 16px 14px;
  border-bottom: 1px solid #edf0f7;
  color: #30384f;
  font-size: 14px;
  vertical-align: top;
  white-space: ${({ $preserveLines }) => ($preserveLines ? "pre-line" : "normal")};
  line-height: ${({ $preserveLines }) => ($preserveLines ? 1.45 : "normal")};

  ${ExpandedItemsTable} tbody tr:last-child & {
    border-bottom: none;
  }
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

const ToolbarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  font-size: 14px;
  cursor: pointer;
  border-radius: 38px;
  border: 1px solid ${(props) => (props.$active ? "#436C4D" : "#d4d6df")};
  background: #fff;
  color: ${(props) => (props.$active ? "#436C4D" : "#20294c")};
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
  background: #436c4d;
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
  color: #436c4d;
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

const CloseButton = styled.button`
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

const ApplyButton = styled.button`
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
