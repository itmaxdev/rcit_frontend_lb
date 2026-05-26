import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import chevronSVG from "../../assets/chevron-down.svg";
import emptySVG from "../../assets/noRegistered.svg";
import searchSVG from "../../assets/search3.svg";
import eyeSVG from "../../assets/eye.svg";
import {
  adjustDeclarationValue,
  approveDeclaration,
  fetchCustomsDeclarationDetail,
  fetchCustomsDeclarations,
  rejectDeclaration,
  startCustomsDeclarationReview,
} from "../../functions/customs";

const DECLARATION_TYPES = {
  IMPORTER: "IMPORTER",
  INDIVIDUAL: "INDIVIDUAL",
};

const STATUS_STYLES = {
  SUBMITTED: { background: "#e8f1ff", color: "#2671d9" },
  UNDER_REVIEW: { background: "#fff3df", color: "#f19a15" },
  APPROVED: { background: "#e5f6e7", color: "#1c9d4b" },
  DECLINED: { background: "#ffe8e8", color: "#e03d3d" },
  AWAITING_PAYMENT: { background: "#fff0e6", color: "#d55d00" },
  PAID: { background: "#e5f6e7", color: "#1c9d4b" },
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());

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

  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
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
    setTableActionError(null)
    setActiveTab(tab);
    setCurrentPage(0);
    setOpenMenuId(null);
    setSelectedDeclaration(null);
    setIsDrawerOpen(false);
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
    setIsDrawerOpen(true);
    setIsDetailLoading(true);
    const detail = await fetchCustomsDeclarationDetail(
      row.declarationType,
      row.id
    );
    setSelectedDeclaration(detail);
    setIsDetailLoading(false);
  };

  const handleActionClick = async (row) => {
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

    setOpenMenuId(openMenuId === row.id ? null : row.id);
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
    setIsActioning(true);
    setAdjustError(null);
    const result = await rejectDeclaration(
      adjustRow.declarationType,
      adjustRow.id
    );
    setIsActioning(false);
    if (!result) {
      setAdjustError(t("Failed to reject declaration. Please try again."));
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
            <EmptyImage src={emptySVG} alt="No declarations" />
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
                      <LoadingCell colSpan="11">{t("Loading")}</LoadingCell>
                    </tr>
                  ) : (
                    declarations.map((row, index) => (
                      <tr key={rowKey(row)}>
                        <Td>
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
                            {formatStatusLabel(row.status)}
                          </StatusBadge>
                        </Td>
                        <Td>
                          <ActionCell
                            ref={openMenuId === row.id ? menuRef : null}
                          >
                            <ActionButton
                              type="button"
                              onClick={() => handleActionClick(row)}
                            >
                              &#8942;
                            </ActionButton>
                            {openMenuId === row.id && (
                              <ActionMenu
                                $openUpwards={index >= declarations.length - 2}
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
                                {canRejectDeclaration(row) && (
                                  <ActionMenuButton
                                    type="button"
                                    onClick={async () => {
                                      setOpenMenuId(null);
                                      setTableActionError(null);
                                      const result = await rejectDeclaration(
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
                                        setTableActionError(t("Failed to reject declaration. Please try again."));
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
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </TableWrapper>
          </>
        )}
      </ContentCard>

      {/* Detail drawer */}
      {isDrawerOpen && (
        <DrawerOverlay onClick={() => setIsDrawerOpen(false)}>
          <DrawerPanel onClick={(event) => event.stopPropagation()}>
            <DrawerHeader>
              <DrawerTitle>{t("Declaration Details")}</DrawerTitle>
              <CloseDrawerButton
                type="button"
                onClick={() => setIsDrawerOpen(false)}
              >
                &#x2715;
              </CloseDrawerButton>
            </DrawerHeader>

            {isDetailLoading ? (
              <DrawerLoading>{t("Loading")}</DrawerLoading>
            ) : !selectedDeclaration ? (
              <DrawerLoading>{t("No data available")}</DrawerLoading>
            ) : (
              <>
                <SummaryGrid>
                  <SummaryItem>
                    <SummaryLabel>{t("Submitter")}</SummaryLabel>
                    <SummaryValue>{selectedDeclaration.submitterName}</SummaryValue>
                  </SummaryItem>
                  <SummaryItem>
                    <SummaryLabel>{t("Email")}</SummaryLabel>
                    <SummaryValue>{selectedDeclaration.submitterEmail || "-"}</SummaryValue>
                  </SummaryItem>
                  <SummaryItem>
                    <SummaryLabel>{t("Declaration Nbr.")}</SummaryLabel>
                    <SummaryValue>{selectedDeclaration.declarationNumber}</SummaryValue>
                  </SummaryItem>
                  <SummaryItem>
                    <SummaryLabel>{t("Declaration Date")}</SummaryLabel>
                    <SummaryValue>{formatDate(selectedDeclaration.declarationDate)}</SummaryValue>
                  </SummaryItem>
                  <SummaryItem>
                    <SummaryLabel>{t("Devices Count")}</SummaryLabel>
                    <SummaryValue>{selectedDeclaration.devicesCount}</SummaryValue>
                  </SummaryItem>
                  <SummaryItem>
                    <SummaryLabel>{t("Price Source")}</SummaryLabel>
                    <SummaryValue>{selectedDeclaration.priceSource}</SummaryValue>
                  </SummaryItem>
                  <SummaryItem>
                    <SummaryLabel>{t("Declared Total (USD)")}</SummaryLabel>
                    <SummaryValue>{formatMoney(selectedDeclaration.declaredTotalUsd)}</SummaryValue>
                  </SummaryItem>
                  <SummaryItem>
                    <SummaryLabel>{t("Estimated Value (USD)")}</SummaryLabel>
                    <SummaryValue>{formatMoney(selectedDeclaration.estimatedValueUsd)}</SummaryValue>
                  </SummaryItem>
                  <SummaryItem>
                    <SummaryLabel>{t("Variance")}</SummaryLabel>
                    <SummaryValue>
                      <VarianceValue value={Number(selectedDeclaration.variancePercent || 0)} />
                    </SummaryValue>
                  </SummaryItem>
                  <SummaryItem>
                    <SummaryLabel>{t("Status")}</SummaryLabel>
                    <SummaryValue>
                      <StatusBadge $status={selectedDeclaration.status}>
                        {formatStatusLabel(selectedDeclaration.status)}
                      </StatusBadge>
                    </SummaryValue>
                  </SummaryItem>
                  <SummaryItem $fullWidth>
                    <SummaryLabel>{t("Source Reference")}</SummaryLabel>
                    <SummaryValue>{selectedDeclaration.sourceReference || "-"}</SummaryValue>
                  </SummaryItem>
                </SummaryGrid>

                <ItemsTitle>{t("Declaration Items")}</ItemsTitle>
                <ItemsTable>
                  <thead>
                    <tr>
                      <Th>{t("IMEIs")}</Th>
                      <Th>{t("Brand")}</Th>
                      <Th>{t("Model")}</Th>
                      <Th>{t("Nbr of IMEIs")}</Th>
                      <Th>{t("Device Status")}</Th>
                      <Th>{t("Declared Value (USD)")}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDeclaration.items.map((item) => (
                      <tr key={item.id}>
                        <Td $preserveLines>{formatImeis(item.imeis)}</Td>
                        <Td>{item.brand || "-"}</Td>
                        <Td>{item.model || "-"}</Td>
                        <Td>{item.imeiCount}</Td>
                        <Td>{formatStatusLabel(item.status)}</Td>
                        <Td>{formatMoney(item.declaredValueUsd)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </ItemsTable>
              </>
            )}
          </DrawerPanel>
        </DrawerOverlay>
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

const formatStatusLabel = (status) =>
  status
    ? status
        .split("_")
        .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
        .join(" ")
    : "-";

const formatImeis = (imeis) => (imeis ? imeis.split("|").join("\n") : "-");

const canAdjustDeclaration = (row) =>
  row.declarationType === DECLARATION_TYPES.IMPORTER &&
  row.status === "UNDER_REVIEW";

const canApproveDeclaration = (row) =>
  row.declarationType === DECLARATION_TYPES.IMPORTER &&
  row.status === "UNDER_REVIEW";

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
  height: calc(100vh - 75px);
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
  color: #436c4d;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  font-size: 16px;
`;

const ContentCard = styled.div`
  border-radius: 12px;
  border: 1px solid #d4d6df;
  background: #fff;
  padding: 20px;
  width: 100%;
  height: 100%;
  overflow: visible;
  display: flex;
  flex-direction: column;
`;

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
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
  display: flex;
  align-items: center;
  border: 1px solid #d4d6df;
  border-radius: 38px;
  padding: 0 18px;
  min-width: 280px;
  background: #fff;
`;

const SearchButton = styled.button`
  border: none;
  background: transparent;
  padding: 0;
  margin-right: 10px;
  cursor: pointer;

  img {
    height: 18px;
  }
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  width: 100%;
  font-size: 14px;
  padding: 14px 0;
`;

const EmptyState = styled.div`
  display: flex;
  height: 100%;
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
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: visible;
`;

const PaginationBar = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 12px;
  gap: 16px;
`;

const PaginationText = styled.p`
  color: #6f7897;
  font-size: 14px;
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
  overflow: visible;

  thead tr {
    background: #f7f8fc;
  }
`;

const ItemsTable = styled(Table)`
  margin-top: 12px;
`;

const Th = styled.th`
  color: #6f7897;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  padding: 14px 10px;
  vertical-align: top;
`;

const Td = styled.td`
  padding: 16px 10px;
  border-top: 1px solid #edf0f7;
  vertical-align: top;
  white-space: ${({ $preserveLines }) => ($preserveLines ? "pre-line" : "normal")};
`;

const NameCell = styled(Td)`
  color: #2671d9;
  font-weight: 600;
  max-width: 180px;
`;

const LoadingCell = styled.td`
  padding: 32px 16px;
  text-align: center;
  color: #6f7897;
`;

const StyledCheckbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #2671d9;
  flex-shrink: 0;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 14px;
  white-space: nowrap;
  background: ${({ $status }) => STATUS_STYLES[$status]?.background || "#eef1f8"};
  color: ${({ $status }) => STATUS_STYLES[$status]?.color || "#1d2025"};
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
  position: absolute;
  right: 0;
  top: ${({ $openUpwards }) =>
    $openUpwards ? "auto" : "calc(100% + 6px)"};
  bottom: ${({ $openUpwards }) =>
    $openUpwards ? "calc(100% + 6px)" : "auto"};
  min-width: 160px;
  border-radius: 12px;
  border: 1px solid #e6e8f0;
  background: #fff;
  box-shadow: 0 12px 32px rgba(17, 24, 39, 0.12);
  padding: 8px;
  z-index: 5;
`;

const ActionMenuButton = styled.button`
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  padding: 12px 14px;
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

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 16px;
  margin-bottom: 28px;
`;

const SummaryItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  grid-column: ${({ $fullWidth }) => ($fullWidth ? "1 / -1" : "auto")};
`;

const SummaryLabel = styled.span`
  font-size: 13px;
  color: #6f7897;
`;

const SummaryValue = styled.div`
  font-size: 15px;
  color: #1d2025;
  font-weight: 500;
`;

const ItemsTitle = styled.h3`
  font-size: 18px;
  color: #1d2025;
  margin-bottom: 8px;
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
