import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  fetchCustomsDeclarations,
  fetchCustomsDeclarationDetail,
  startCustomsDeclarationReview,
  approveDeclaration,
  rejectDeclaration,
  closeDeclaration,
} from "../../functions/customs";

const VARIANCE_WARN_AT = 10;
const VARIANCE_HIGH_AT = 20;
const PAGE_SIZE = 10;

const STATUS_PALETTE = {
  SUBMITTED: "#85B7EB",
  UNDER_REVIEW: "#EF9F27",
  PENDING_APPROVAL: "#AFA9EC",
  AWAITING_PAYMENT: "#5DCAA5",
  APPROVED: "#1D9E75",
  PAID: "#97C459",
  DECLINED: "#F09595",
  CLOSED: "#B4B2A9",
};

const STATUS_FILTERS = [
  "All",
  "SUBMITTED",
  "UNDER_REVIEW",
  "PENDING_APPROVAL",
  "AWAITING_PAYMENT",
  "PAID",
  "APPROVED",
  "DECLINED",
  "CLOSED",
];

const TABS = [
  { key: "ALL", label: "All" },
  { key: "IMPORTER", label: "Importers" },
  { key: "INDIVIDUAL", label: "Individuals" },
];

const RISK_OPTIONS = [
  { value: "Any", label: "Any" },
  { value: "flagged", label: "Under-valued (≥10%)" },
  { value: "high", label: "High risk (≥20%)" },
  { value: "within", label: "Within tolerance" },
];
const RISK_LABEL = {
  flagged: "Under-valued",
  high: "High risk",
  within: "Within tolerance",
};

const EMPTY_FILTERS = {
  status: "All",
  risk: "Any",
  dateFrom: "",
  dateTo: "",
  amountMin: "",
  amountMax: "",
  devicesMin: "",
  devicesMax: "",
};

const Svg = (props) => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  />
);
const FilesIcon = () => (
  <Svg>
    <path d="M9 3h7l4 4v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    <path d="M4 7v13a2 2 0 0 0 2 2h9" />
  </Svg>
);
const EyeIcon = () => (
  <Svg>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);
const ShieldIcon = () => (
  <Svg>
    <path d="M12 3l8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
    <path d="M12 8v4M12 15.5v.5" />
  </Svg>
);
const WalletIcon = () => (
  <Svg>
    <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v0H5a2 2 0 0 0-2 2z" />
    <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6" />
    <path d="M16 13h.01" />
  </Svg>
);

const CustomsDeclarationsUplift = () => {
  const [rows, setRows] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRow, setDrawerRow] = useState(null);
  const [drawerDetail, setDrawerDetail] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      setLoadError("");
      const [importer, individual] = await Promise.all([
        fetchCustomsDeclarations("IMPORTER", 1, 1000, appliedSearch, false),
        fetchCustomsDeclarations("INDIVIDUAL", 1, 1000, appliedSearch, false),
      ]);
      if (!active) return;
      if (!importer && !individual) {
        setLoadError("We couldn't load the declarations. Please try again.");
        setRows([]);
      } else {
        const merged = [
          ...((importer && importer.data) || []),
          ...((individual && individual.data) || []),
        ];
        setRows(merged);
      }
      setSelected(new Set());
      setPage(0);
      setIsLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [appliedSearch, reloadKey]);

  const counts = useMemo(() => {
    const importer = rows.filter((r) => r.declarationType === "IMPORTER").length;
    const individual = rows.length - importer;
    return { ALL: rows.length, IMPORTER: importer, INDIVIDUAL: individual };
  }, [rows]);

  const kpis = useMemo(() => {
    const underReview = rows.filter(
      (r) => displayStatus(r) === "UNDER_REVIEW"
    ).length;
    const underValued = rows.filter(
      (r) => Number(r.variancePercent) >= VARIANCE_WARN_AT
    ).length;
    const awaitingPayment = rows.filter(
      (r) => r.status === "AWAITING_PAYMENT"
    ).length;
    return { total: rows.length, underReview, underValued, awaitingPayment };
  }, [rows]);

  const visibleRows = useMemo(() => {
    const f = appliedFilters;
    let list = rows;
    if (tab !== "ALL") list = list.filter((r) => r.declarationType === tab);
    if (f.status !== "All")
      list = list.filter((r) => displayStatus(r) === f.status);
    if (f.risk !== "Any")
      list = list.filter((r) => {
        const v = Number(r.variancePercent || 0);
        if (f.risk === "flagged") return v >= VARIANCE_WARN_AT;
        if (f.risk === "high") return v >= VARIANCE_HIGH_AT;
        if (f.risk === "within") return v < VARIANCE_WARN_AT;
        return true;
      });
    if (f.dateFrom)
      list = list.filter(
        (r) => r.declarationDate && new Date(r.declarationDate) >= new Date(f.dateFrom)
      );
    if (f.dateTo)
      list = list.filter(
        (r) => r.declarationDate && new Date(r.declarationDate) <= new Date(f.dateTo)
      );
    if (f.amountMin !== "")
      list = list.filter(
        (r) => Number(r.declaredTotalUsd || 0) >= Number(f.amountMin)
      );
    if (f.amountMax !== "")
      list = list.filter(
        (r) => Number(r.declaredTotalUsd || 0) <= Number(f.amountMax)
      );
    if (f.devicesMin !== "")
      list = list.filter(
        (r) => Number(r.devicesCount || 0) >= Number(f.devicesMin)
      );
    if (f.devicesMax !== "")
      list = list.filter(
        (r) => Number(r.devicesCount || 0) <= Number(f.devicesMax)
      );
    return list;
  }, [rows, tab, appliedFilters]);

  const activeFilters = useMemo(() => {
    const f = appliedFilters;
    const out = [];
    if (f.status !== "All")
      out.push({ key: "status", label: `Status: ${formatStatusLabel(f.status)}` });
    if (f.risk !== "Any")
      out.push({ key: "risk", label: `Risk: ${RISK_LABEL[f.risk]}` });
    if (f.dateFrom || f.dateTo)
      out.push({
        key: "date",
        label: `Date: ${f.dateFrom || "…"} → ${f.dateTo || "…"}`,
      });
    if (f.amountMin !== "" || f.amountMax !== "")
      out.push({
        key: "amount",
        label: `Declared: ${f.amountMin || "0"}–${f.amountMax || "∞"}`,
      });
    if (f.devicesMin !== "" || f.devicesMax !== "")
      out.push({
        key: "devices",
        label: `Devices: ${f.devicesMin || "0"}–${f.devicesMax || "∞"}`,
      });
    return out;
  }, [appliedFilters]);

  const activeFilterCount = activeFilters.length;

  const openFilters = () => {
    setDraftFilters(appliedFilters);
    setFilterOpen(true);
  };
  const setDraft = (key, value) =>
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setFilterOpen(false);
    setPage(0);
  };
  const clearDraft = () => setDraftFilters(EMPTY_FILTERS);
  const removeFilter = (key) => {
    const reset =
      key === "date"
        ? { dateFrom: "", dateTo: "" }
        : key === "amount"
        ? { amountMin: "", amountMax: "" }
        : key === "devices"
        ? { devicesMin: "", devicesMax: "" }
        : key === "risk"
        ? { risk: "Any" }
        : { status: "All" };
    setAppliedFilters((prev) => ({ ...prev, ...reset }));
    setDraftFilters((prev) => ({ ...prev, ...reset }));
    setPage(0);
  };
  const clearAllFilters = () => {
    setAppliedFilters(EMPTY_FILTERS);
    setDraftFilters(EMPTY_FILTERS);
    setPage(0);
  };

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = visibleRows.slice(
    safePage * PAGE_SIZE,
    (safePage + 1) * PAGE_SIZE
  );
  const rangeStart = visibleRows.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const rangeEnd = Math.min((safePage + 1) * PAGE_SIZE, visibleRows.length);

  const allOnPageSelected =
    pageRows.length > 0 && pageRows.every((r) => selected.has(rowKey(r)));

  const submitSearch = () => {
    setAppliedSearch(searchInput.trim());
  };

  const toggleRow = (r) => {
    const key = rowKey(r);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        pageRows.forEach((r) => next.delete(rowKey(r)));
      } else {
        pageRows.forEach((r) => next.add(rowKey(r)));
      }
      return next;
    });
  };

  const openDrawer = async (r) => {
    setDrawerRow(r);
    setDrawerOpen(true);
    setDrawerDetail(null);
    setDrawerLoading(true);
    setRejectMode(false);
    setRejectReason("");
    setActionError("");
    const detail = await fetchCustomsDeclarationDetail(r.declarationType, r.id);
    setDrawerDetail(detail);
    setDrawerLoading(false);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerRow(null);
    setDrawerDetail(null);
    setRejectMode(false);
    setRejectReason("");
    setActionError("");
  };

  const runAction = async (thunk) => {
    setActionBusy(true);
    setActionError("");
    const res = await thunk();
    setActionBusy(false);
    if (!res) {
      setActionError("Action failed. Please try again.");
      return;
    }
    setReloadKey((k) => k + 1);
    closeDrawer();
  };

  const confirmReject = () => {
    if (!rejectReason.trim()) {
      setActionError("Rejection reason is required.");
      return;
    }
    runAction(() =>
      rejectDeclaration(drawerRow.declarationType, drawerRow.id, rejectReason.trim())
    );
  };

  return (
    <Page>
      <Title>Declarations</Title>
      <Subtitle>Manage and review submitted declarations</Subtitle>

      <KpiGrid>
        <Kpi $accent="#2480f2">
          <KpiTop>
            <KpiLabel>Total</KpiLabel>
            <KpiIcon $bg="#e8f1fe" $fg="#1d4ed8">
              <FilesIcon />
            </KpiIcon>
          </KpiTop>
          <KpiValue>{kpis.total}</KpiValue>
        </Kpi>
        <Kpi $accent="#f0a500">
          <KpiTop>
            <KpiLabel>Under review</KpiLabel>
            <KpiIcon $bg="#fef3e0" $fg="#b07400">
              <EyeIcon />
            </KpiIcon>
          </KpiTop>
          <KpiValue>{kpis.underReview}</KpiValue>
        </Kpi>
        <Kpi $accent="#e24b4a">
          <KpiTop>
            <KpiLabel>Under-valued</KpiLabel>
            <KpiIcon $bg="#fdecec" $fg="#e24b4a">
              <ShieldIcon />
            </KpiIcon>
          </KpiTop>
          <KpiValue>{kpis.underValued}</KpiValue>
        </Kpi>
        <Kpi $accent="#1a7f44">
          <KpiTop>
            <KpiLabel>Awaiting payment</KpiLabel>
            <KpiIcon $bg="#e9f7ef" $fg="#1a7f44">
              <WalletIcon />
            </KpiIcon>
          </KpiTop>
          <KpiValue>{kpis.awaitingPayment}</KpiValue>
        </Kpi>
      </KpiGrid>

      <Card>
        <Toolbar>
          <Seg>
            {TABS.map((it) => (
              <SegBtn
                key={it.key}
                $active={tab === it.key}
                onClick={() => {
                  setTab(it.key);
                  setPage(0);
                }}
              >
                {it.label} <SegCount>{counts[it.key] || 0}</SegCount>
              </SegBtn>
            ))}
          </Seg>
          <ToolbarRight>
            <Search>
              <SearchBtn type="button" onClick={submitSearch} aria-label="Search">
                <Svg width="15" height="15">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </Svg>
              </SearchBtn>
              <SearchInput
                placeholder="Search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitSearch()}
              />
            </Search>
            <FilterButton
              type="button"
              onClick={openFilters}
              $active={activeFilterCount > 0}
            >
              <Svg width="15" height="15">
                <path d="M3 5h18M6 12h12M10 19h4" />
              </Svg>
              Filters
              {activeFilterCount > 0 && (
                <FilterBadge>{activeFilterCount}</FilterBadge>
              )}
            </FilterButton>
          </ToolbarRight>
        </Toolbar>

        {filterOpen && (
          <FilterPanel>
            <FilterGrid>
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select
                  value={draftFilters.status}
                  onChange={(e) => setDraft("status", e.target.value)}
                >
                  {STATUS_FILTERS.map((s) => (
                    <option key={s} value={s}>
                      {s === "All" ? "All statuses" : formatStatusLabel(s)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field>
                <FieldLabel>Risk (variance)</FieldLabel>
                <Select
                  value={draftFilters.risk}
                  onChange={(e) => setDraft("risk", e.target.value)}
                >
                  {RISK_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field>
                <FieldLabel>Declaration date</FieldLabel>
                <RangeRow>
                  <Input
                    type="date"
                    value={draftFilters.dateFrom}
                    onChange={(e) => setDraft("dateFrom", e.target.value)}
                  />
                  <Dash>–</Dash>
                  <Input
                    type="date"
                    value={draftFilters.dateTo}
                    onChange={(e) => setDraft("dateTo", e.target.value)}
                  />
                </RangeRow>
              </Field>
              <Field>
                <FieldLabel>Declared total (USD)</FieldLabel>
                <RangeRow>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={draftFilters.amountMin}
                    onChange={(e) => setDraft("amountMin", e.target.value)}
                  />
                  <Dash>–</Dash>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={draftFilters.amountMax}
                    onChange={(e) => setDraft("amountMax", e.target.value)}
                  />
                </RangeRow>
              </Field>
              <Field>
                <FieldLabel>Devices count</FieldLabel>
                <RangeRow>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={draftFilters.devicesMin}
                    onChange={(e) => setDraft("devicesMin", e.target.value)}
                  />
                  <Dash>–</Dash>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={draftFilters.devicesMax}
                    onChange={(e) => setDraft("devicesMax", e.target.value)}
                  />
                </RangeRow>
              </Field>
            </FilterGrid>
            <FilterActions>
              <GhostBtn type="button" onClick={clearDraft}>
                Clear
              </GhostBtn>
              <PrimaryBtn type="button" onClick={applyFilters}>
                Apply filters
              </PrimaryBtn>
            </FilterActions>
          </FilterPanel>
        )}

        {activeFilterCount > 0 && (
          <ChipsRow>
            <ChipsLabel>Applied:</ChipsLabel>
            {activeFilters.map((f) => (
              <Chip key={f.key}>
                {f.label}
                <ChipX
                  type="button"
                  onClick={() => removeFilter(f.key)}
                  aria-label={`Remove ${f.label}`}
                >
                  ✕
                </ChipX>
              </Chip>
            ))}
            <ClearAll type="button" onClick={clearAllFilters}>
              Clear all
            </ClearAll>
          </ChipsRow>
        )}

        {selected.size > 0 && (
          <BulkBar>
            <b>{selected.size} selected</b>
            <Spacer />
            <BulkBtn type="button">Start review</BulkBtn>
            <BulkBtn type="button">Export</BulkBtn>
            <BulkBtn type="button" onClick={() => setSelected(new Set())}>
              Clear
            </BulkBtn>
          </BulkBar>
        )}

        {isLoading ? (
          <Centered>Loading declarations…</Centered>
        ) : loadError ? (
          <Centered>{loadError}</Centered>
        ) : visibleRows.length === 0 ? (
          <Centered>No declarations match this view.</Centered>
        ) : (
          <TableWrap>
            <Table>
              <colgroup>
                <col style={{ width: "4%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "23%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>
                    <Box $on={allOnPageSelected} onClick={toggleAll} />
                  </th>
                  <th>Submitter</th>
                  <th>Role</th>
                  <th>Date</th>
                  <th>Devices</th>
                  <th>Declared value</th>
                  <th>Status</th>
                  <th aria-label="action" />
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => {
                  const dStatus = displayStatus(r);
                  const isIndividual = r.declarationType === "INDIVIDUAL";
                  const variance =
                    r.variancePercent == null ? null : Number(r.variancePercent);
                  const flagged = variance != null && variance >= VARIANCE_WARN_AT;
                  const isSel = selected.has(rowKey(r));
                  return (
                    <tr key={rowKey(r)} className={flagged ? "flag" : ""}>
                      <td>
                        <Box $on={isSel} onClick={() => toggleRow(r)} />
                      </td>
                      <td>
                        <Submitter>{r.submitterName || "—"}</Submitter>
                        <SubMeta>{r.declarationNumber}</SubMeta>
                      </td>
                      <td>
                        <RoleBadge $individual={isIndividual}>
                          {isIndividual ? "Individual" : "Importer"}
                        </RoleBadge>
                      </td>
                      <td>{formatShortDate(r.declarationDate)}</td>
                      <td>{formatInteger(r.devicesCount)}</td>
                      <td>
                        <ValRow>
                          <Val>{formatMoney(r.declaredTotalUsd)}</Val>
                          {variance != null && (
                            <VarPill $tone={varianceTone(variance)}>
                              {formatVariance(variance)}
                            </VarPill>
                          )}
                        </ValRow>
                        {r.estimatedValueUsd != null && (
                          <ValRef>ref {formatMoney(r.estimatedValueUsd)}</ValRef>
                        )}
                      </td>
                      <td>
                        <StatusPill>
                          <StatusDot
                            style={{
                              background: STATUS_PALETTE[dStatus] || "#B4B2A9",
                            }}
                          />
                          {formatStatusLabel(dStatus)}
                        </StatusPill>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <RowAction
                          $primary={
                            dStatus === "UNDER_REVIEW" ||
                            dStatus === "PENDING_APPROVAL"
                          }
                          onClick={() => openDrawer(r)}
                        >
                          {nextAction(dStatus)}
                        </RowAction>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        )}

        {!isLoading && !loadError && visibleRows.length > 0 && (
          <Pagination>
            <span>
              {rangeStart}–{rangeEnd} of {visibleRows.length}
            </span>
            <PageNav>
              <PageBtn
                disabled={safePage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Prev
              </PageBtn>
              <PageInfo>
                Page {safePage + 1} of {totalPages}
              </PageInfo>
              <PageBtn
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                Next
              </PageBtn>
            </PageNav>
          </Pagination>
        )}
      </Card>

      {drawerOpen && drawerRow && (
        <DrawerOverlay onClick={closeDrawer}>
          <Drawer onClick={(e) => e.stopPropagation()}>
            {(() => {
              const d = drawerDetail || drawerRow;
              const ds = displayStatus(drawerRow);
              const variance =
                d.variancePercent == null ? null : Number(d.variancePercent);
              const canStart = ds === "SUBMITTED";
              const canApprove =
                ds === "UNDER_REVIEW" || ds === "PENDING_APPROVAL";
              const canReject =
                ds === "SUBMITTED" ||
                ds === "UNDER_REVIEW" ||
                ds === "PENDING_APPROVAL";
              const canClose = ds === "PAID";
              return (
                <>
                  <DrawerHead>
                    <div>
                      <DrawerTitle>{d.submitterName || "—"}</DrawerTitle>
                      <DrawerMeta>
                        {d.declarationNumber} ·{" "}
                        {drawerRow.declarationType === "INDIVIDUAL"
                          ? "Individual"
                          : "Importer"}
                      </DrawerMeta>
                    </div>
                    <CloseX type="button" onClick={closeDrawer} aria-label="Close">
                      ✕
                    </CloseX>
                  </DrawerHead>

                  <DrawerStatus>
                    <StatusPill>
                      <StatusDot
                        style={{ background: STATUS_PALETTE[ds] || "#B4B2A9" }}
                      />
                      {formatStatusLabel(ds)}
                    </StatusPill>
                    {variance != null && (
                      <VarPill $tone={varianceTone(variance)}>
                        {formatVariance(variance)} vs reference
                      </VarPill>
                    )}
                  </DrawerStatus>

                  <DrawerBody>
                    <Facts>
                      <Fact>
                        <FactLabel>Declared total</FactLabel>
                        <FactValue>{formatMoney(d.declaredTotalUsd)}</FactValue>
                      </Fact>
                      <Fact>
                        <FactLabel>Estimated (reference)</FactLabel>
                        <FactValue>
                          {d.estimatedValueUsd != null
                            ? formatMoney(d.estimatedValueUsd)
                            : "—"}
                        </FactValue>
                      </Fact>
                      <Fact>
                        <FactLabel>Devices</FactLabel>
                        <FactValue>{formatInteger(d.devicesCount)}</FactValue>
                      </Fact>
                      <Fact>
                        <FactLabel>Declaration date</FactLabel>
                        <FactValue>{formatShortDate(d.declarationDate)}</FactValue>
                      </Fact>
                      {d.submitterEmail && (
                        <Fact>
                          <FactLabel>Submitter email</FactLabel>
                          <FactValue>{d.submitterEmail}</FactValue>
                        </Fact>
                      )}
                      {d.priceSource && (
                        <Fact>
                          <FactLabel>Price source</FactLabel>
                          <FactValue>{d.priceSource}</FactValue>
                        </Fact>
                      )}
                    </Facts>

                    {d.rejectionReason && (
                      <ReasonNote>
                        <FactLabel>Rejection reason</FactLabel>
                        <div>{d.rejectionReason}</div>
                      </ReasonNote>
                    )}

                    <SectionLabel>
                      Devices{" "}
                      {drawerDetail?.items
                        ? `(${drawerDetail.items.length})`
                        : ""}
                    </SectionLabel>
                    {drawerLoading ? (
                      <DrawerHint>Loading devices…</DrawerHint>
                    ) : drawerDetail?.items?.length ? (
                      <DeviceTable>
                        <thead>
                          <tr>
                            <th>Brand</th>
                            <th>Model</th>
                            <th>IMEIs</th>
                            <th>Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {drawerDetail.items.map((it) => (
                            <tr key={it.id}>
                              <td>{it.brand || "—"}</td>
                              <td>{it.model || "—"}</td>
                              <td>{it.imeiCount}</td>
                              <td>{formatMoney(it.declaredValueUsd)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </DeviceTable>
                    ) : (
                      <DrawerHint>No device lines available.</DrawerHint>
                    )}
                  </DrawerBody>

                  {actionError && <DrawerError>{actionError}</DrawerError>}

                  <DrawerFoot>
                    {rejectMode ? (
                      <RejectBox>
                        <FieldLabel>Rejection reason</FieldLabel>
                        <Textarea
                          rows={3}
                          value={rejectReason}
                          placeholder="Explain why this declaration is rejected…"
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <FootRow>
                          <GhostBtn
                            type="button"
                            onClick={() => {
                              setRejectMode(false);
                              setActionError("");
                            }}
                          >
                            Cancel
                          </GhostBtn>
                          <DangerBtn
                            type="button"
                            disabled={actionBusy}
                            onClick={confirmReject}
                          >
                            {actionBusy ? "Rejecting…" : "Confirm reject"}
                          </DangerBtn>
                        </FootRow>
                      </RejectBox>
                    ) : (
                      <FootRow>
                        <GhostBtn type="button" onClick={closeDrawer}>
                          Cancel
                        </GhostBtn>
                        {canReject && (
                          <DangerBtn
                            type="button"
                            disabled={actionBusy}
                            onClick={() => {
                              setRejectMode(true);
                              setActionError("");
                            }}
                          >
                            Reject
                          </DangerBtn>
                        )}
                        {canStart && (
                          <PrimaryBtn
                            type="button"
                            disabled={actionBusy}
                            onClick={() =>
                              runAction(() =>
                                startCustomsDeclarationReview(
                                  drawerRow.declarationType,
                                  drawerRow.id
                                )
                              )
                            }
                          >
                            {actionBusy ? "Working…" : "Start review"}
                          </PrimaryBtn>
                        )}
                        {canApprove && (
                          <PrimaryBtn
                            type="button"
                            disabled={actionBusy}
                            onClick={() =>
                              runAction(() =>
                                approveDeclaration(
                                  drawerRow.declarationType,
                                  drawerRow.id
                                )
                              )
                            }
                          >
                            {actionBusy ? "Working…" : "Approve"}
                          </PrimaryBtn>
                        )}
                        {canClose && (
                          <PrimaryBtn
                            type="button"
                            disabled={actionBusy}
                            onClick={() =>
                              runAction(() =>
                                closeDeclaration(
                                  drawerRow.declarationType,
                                  drawerRow.id
                                )
                              )
                            }
                          >
                            {actionBusy ? "Working…" : "Close declaration"}
                          </PrimaryBtn>
                        )}
                      </FootRow>
                    )}
                  </DrawerFoot>
                </>
              );
            })()}
          </Drawer>
        </DrawerOverlay>
      )}
    </Page>
  );
};

const rowKey = (r) => `${r.declarationType}-${r.id}`;

const displayStatus = (r) => {
  if (
    r?.status === "UNDER_REVIEW" &&
    r?.approvedPriceUsd != null &&
    r?.adjustmentReason?.trim()
  ) {
    return "PENDING_APPROVAL";
  }
  return r?.status;
};

const formatStatusLabel = (status) => {
  if (!status) return "-";
  if (status === "PENDING_APPROVAL") return "Pending Approval";
  if (status === "DECLINED") return "Rejected";
  if (status === "CLOSED") return "Closed";
  return String(status)
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
};

const nextAction = (status) => {
  switch (status) {
    case "SUBMITTED":
      return "Start";
    case "UNDER_REVIEW":
      return "Review";
    case "PENDING_APPROVAL":
      return "Approve";
    case "AWAITING_PAYMENT":
      return "Monitor";
    case "PAID":
      return "Close";
    default:
      return "View";
  }
};

const varianceTone = (value) => {
  if (value >= VARIANCE_HIGH_AT) return "danger";
  if (value >= VARIANCE_WARN_AT) return "warning";
  return "ok";
};

const formatInteger = (value) =>
  Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

const formatMoney = (value) =>
  `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatVariance = (value) => {
  const numeric = Number(value || 0);
  const sign = numeric > 0 ? "+" : "";
  return `${sign}${numeric.toFixed(0)}%`;
};

const formatShortDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
};

const TONES = {
  danger: { bg: "#fdecec", fg: "#b42318" },
  warning: { bg: "#fef3e0", fg: "#92590b" },
  ok: { bg: "#e9f7ef", fg: "#1a7f44" },
};

const Page = styled.div`
  width: 100%;
  box-sizing: border-box;
  padding: 18px 24px 28px;
  color: #1f2430;
`;

const Title = styled.h1`
  font-size: 19px;
  font-weight: 600;
  margin: 0;
  letter-spacing: -0.01em;
`;

const Subtitle = styled.p`
  font-size: 12px;
  color: #9aa1ad;
  margin: 3px 0 14px;
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(165px, 1fr));
  gap: 12px;
  margin-bottom: 14px;
`;

const Kpi = styled.div`
  position: relative;
  background: #fff;
  border: 1px solid #ececf1;
  border-radius: 12px;
  padding: 13px 15px;
  overflow: hidden;
  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: ${(p) => p.$accent || "#d1d5db"};
  }
`;

const KpiTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
`;

const KpiIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: ${(p) => p.$bg || "#f1f2f5"};
  color: ${(p) => p.$fg || "#5f5e5a"};
`;

const KpiLabel = styled.p`
  font-size: 12px;
  color: #6b7280;
  margin: 0;
`;

const KpiValue = styled.p`
  font-size: 23px;
  font-weight: 600;
  margin: 0;
  line-height: 1.1;
  letter-spacing: -0.01em;
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #ececf1;
  border-radius: 12px;
  padding: 14px 16px;
`;

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
`;

const Seg = styled.div`
  display: inline-flex;
  background: #f1f2f5;
  border-radius: 10px;
  padding: 3px;
`;

const SegBtn = styled.button`
  border: none;
  background: ${(p) => (p.$active ? "#fff" : "transparent")};
  color: ${(p) => (p.$active ? "#1f2430" : "#6b7280")};
  font-weight: ${(p) => (p.$active ? 500 : 400)};
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: ${(p) => (p.$active ? "0 1px 2px rgba(0,0,0,.06)" : "none")};
`;

const SegCount = styled.span`
  opacity: 0.6;
  margin-left: 2px;
`;

const ToolbarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Search = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid #e3e6ec;
  border-radius: 8px;
  padding: 4px 8px;
  color: #9aa1ad;
`;

const SearchBtn = styled.button`
  border: none;
  background: transparent;
  color: #9aa1ad;
  display: flex;
  cursor: pointer;
  padding: 0;
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  background: transparent;
  font-size: 12px;
  color: #1f2430;
  width: 130px;
`;

const FilterButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid ${(p) => (p.$active ? "#1f2430" : "#e3e6ec")};
  background: ${(p) => (p.$active ? "#f1f2f5" : "transparent")};
  color: #1f2430;
  font-size: 12px;
  padding: 7px 11px;
  border-radius: 8px;
  cursor: pointer;
  &:hover {
    background: #f7f8fa;
  }
`;

const FilterBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: #1f2430;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
`;

const FilterPanel = styled.div`
  background: #f9fafb;
  border: 1px solid #ececf1;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 12px;
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const FieldLabel = styled.label`
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
`;

const Select = styled.select`
  border: 1px solid #e3e6ec;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 12px;
  color: #1f2430;
  background: #fff;
  cursor: pointer;
  width: 100%;
`;

const RangeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Input = styled.input`
  border: 1px solid #e3e6ec;
  border-radius: 8px;
  padding: 7px 9px;
  font-size: 12px;
  color: #1f2430;
  background: #fff;
  width: 100%;
  min-width: 0;
  outline: none;
  &:focus {
    border-color: #c7ccd6;
  }
`;

const Dash = styled.span`
  color: #9aa1ad;
  flex: none;
`;

const FilterActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
`;

const GhostBtn = styled.button`
  border: 1px solid #e3e6ec;
  background: transparent;
  color: #1f2430;
  font-size: 12px;
  padding: 7px 14px;
  border-radius: 8px;
  cursor: pointer;
  &:hover {
    background: #f1f2f5;
  }
`;

const PrimaryBtn = styled.button`
  border: none;
  background: #1f2430;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  &:hover {
    background: #000;
  }
`;

const ChipsRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
`;

const ChipsLabel = styled.span`
  font-size: 12px;
  color: #9aa1ad;
`;

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #1f2430;
  background: #f1f2f5;
  border-radius: 999px;
  padding: 4px 10px;
`;

const ChipX = styled.button`
  border: none;
  background: transparent;
  color: #9aa1ad;
  font-size: 11px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  &:hover {
    color: #1f2430;
  }
`;

const ClearAll = styled.button`
  border: none;
  background: transparent;
  color: #1d4ed8;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
`;

const BulkBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: #eef4ff;
  border: 1px solid #d6e4fb;
  border-radius: 10px;
  padding: 8px 12px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #1d4ed8;
`;

const Spacer = styled.span`
  flex: 1;
`;

const BulkBtn = styled.button`
  border: 1px solid #c3d8f8;
  background: #fff;
  color: #1d4ed8;
  border-radius: 7px;
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
`;

const Centered = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #9aa1ad;
  font-size: 13px;
`;

const TableWrap = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  th {
    text-align: left;
    font-size: 10.5px;
    font-weight: 500;
    color: #9aa1ad;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 0 6px 8px;
    border-bottom: 1px solid #ececf1;
  }
  td {
    padding: 9px 6px;
    border-bottom: 1px solid #f3f4f7;
    font-size: 12.5px;
    vertical-align: middle;
  }
  tr.flag td {
    background: #fffaf9;
  }
  tbody tr:hover td {
    background: #fafbfc;
  }
  tbody tr.flag:hover td {
    background: #fff5f3;
  }
`;

const Box = styled.span`
  width: 15px;
  height: 15px;
  border: 1.5px solid ${(p) => (p.$on ? "#1f2430" : "#c7ccd6")};
  background: ${(p) => (p.$on ? "#1f2430" : "transparent")};
  border-radius: 4px;
  display: inline-block;
  position: relative;
  cursor: pointer;
  &::after {
    content: "";
    display: ${(p) => (p.$on ? "block" : "none")};
    position: absolute;
    left: 4px;
    top: 1px;
    width: 4px;
    height: 8px;
    border: solid #fff;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
`;

const Submitter = styled.div`
  font-weight: 500;
  font-size: 12.5px;
`;

const SubMeta = styled.div`
  font-size: 11px;
  color: #9aa1ad;
  margin-top: 2px;
`;

const RoleBadge = styled.span`
  font-size: 11px;
  padding: 3px 9px;
  border-radius: 999px;
  white-space: nowrap;
  background: ${(p) => (p.$individual ? "#f1f2f5" : "#e8f1fe")};
  color: ${(p) => (p.$individual ? "#5f5e5a" : "#1d4ed8")};
`;

const ValRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Val = styled.span`
  font-weight: 500;
`;

const VarPill = styled.span`
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 999px;
  white-space: nowrap;
  background: ${(p) => (TONES[p.$tone] || TONES.ok).bg};
  color: ${(p) => (TONES[p.$tone] || TONES.ok).fg};
`;

const ValRef = styled.div`
  font-size: 11px;
  color: #9aa1ad;
  margin-top: 1px;
`;

const StatusPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
`;

const StatusDot = styled.i`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: none;
`;

const RowAction = styled.button`
  font-size: 11px;
  padding: 5px 9px;
  min-width: 66px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  border: 1px solid ${(p) => (p.$primary ? "#1f2430" : "#e3e6ec")};
  background: ${(p) => (p.$primary ? "#1f2430" : "transparent")};
  color: ${(p) => (p.$primary ? "#fff" : "#1f2430")};
  &:hover {
    background: ${(p) => (p.$primary ? "#000" : "#fafbfc")};
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  font-size: 12px;
  color: #9aa1ad;
`;

const PageNav = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PageInfo = styled.span`
  color: #6b7280;
`;

const PageBtn = styled.button`
  border: 1px solid #e3e6ec;
  background: transparent;
  color: #1f2430;
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 8px;
  cursor: pointer;
  opacity: ${(p) => (p.disabled ? 0.4 : 1)};
  pointer-events: ${(p) => (p.disabled ? "none" : "auto")};
`;

const DrawerOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(17, 20, 28, 0.4);
  display: flex;
  justify-content: flex-end;
  z-index: 1000;
`;

const Drawer = styled.div`
  width: 440px;
  max-width: 92vw;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 24px rgba(17, 20, 28, 0.12);
`;

const DrawerHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 18px 20px 12px;
  border-bottom: 1px solid #f3f4f7;
`;

const DrawerTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1f2430;
`;

const DrawerMeta = styled.div`
  font-size: 12px;
  color: #9aa1ad;
  margin-top: 3px;
`;

const CloseX = styled.button`
  border: none;
  background: transparent;
  color: #9aa1ad;
  font-size: 14px;
  cursor: pointer;
  padding: 2px 4px;
  &:hover {
    color: #1f2430;
  }
`;

const DrawerStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-bottom: 1px solid #f3f4f7;
  font-size: 13px;
`;

const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
`;

const Facts = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
`;

const Fact = styled.div``;

const FactLabel = styled.div`
  font-size: 11px;
  color: #9aa1ad;
  margin-bottom: 3px;
`;

const FactValue = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #1f2430;
  word-break: break-word;
`;

const ReasonNote = styled.div`
  margin-top: 14px;
  background: #fdecec;
  border: 1px solid #f3d2d2;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12px;
  color: #b42318;
`;

const SectionLabel = styled.div`
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #9aa1ad;
  margin: 18px 0 8px;
`;

const DrawerHint = styled.div`
  font-size: 12px;
  color: #9aa1ad;
  padding: 8px 0;
`;

const DeviceTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  th {
    text-align: left;
    font-size: 10.5px;
    font-weight: 500;
    color: #9aa1ad;
    text-transform: uppercase;
    padding: 0 6px 6px;
    border-bottom: 1px solid #ececf1;
  }
  td {
    padding: 8px 6px;
    border-bottom: 1px solid #f3f4f7;
    font-size: 12.5px;
    color: #1f2430;
  }
`;

const DrawerError = styled.div`
  margin: 0 20px;
  background: #fdecec;
  border: 1px solid #f3d2d2;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: #b42318;
`;

const DrawerFoot = styled.div`
  border-top: 1px solid #f3f4f7;
  padding: 14px 20px;
`;

const FootRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const RejectBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Textarea = styled.textarea`
  border: 1px solid #e3e6ec;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 12px;
  color: #1f2430;
  font-family: inherit;
  resize: vertical;
  outline: none;
  &:focus {
    border-color: #c7ccd6;
  }
`;

const DangerBtn = styled.button`
  border: 1px solid #f3d2d2;
  background: #fdecec;
  color: #b42318;
  font-size: 12px;
  font-weight: 500;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  opacity: ${(p) => (p.disabled ? 0.6 : 1)};
  &:hover {
    background: #fbdcdc;
  }
`;

export default CustomsDeclarationsUplift;
