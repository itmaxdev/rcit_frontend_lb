import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { fetchCustomsDashboard } from "../../functions/customs";
import { VARIANCE_WARN_AT, VARIANCE_HIGH_AT } from "./riskThresholds";

// Severity thresholds (in days) used purely for the at-a-glance SLA pill in the
// queue. The authoritative "overdue" set still comes from the backend
// (dashboard.overdueDeclarations); these only tint rows that are getting old.
const DUE_SOON_AT_DAYS = 2;

// variancePercent = (estimatedValue - declaredValue) / declaredValue * 100.
// A POSITIVE variance means the declared value sits below the system's
// estimated/reference value — i.e. potential under-valuation, which is the
// customs revenue risk. Negative variance (over-declaration) is not a risk.
// Thresholds live in one shared module to avoid drift across customs screens.

const STATUS_PALETTE = {
  SUBMITTED: "#85B7EB",
  UNDER_REVIEW: "#EF9F27",
  PENDING_APPROVAL: "#AFA9EC",
  AWAITING_PAYMENT: "#5DCAA5",
  PAID_AWAITING_CLOSURE: "#97C459",
  PAID: "#97C459",
  APPROVED: "#1D9E75",
  DECLINED: "#E24B4A",
  CLOSED: "#B4B2A9",
};

const QUEUE_FILTERS = [
  { key: "ALL", label: "All" },
  { key: "SUBMITTED", label: "New" },
  { key: "UNDER_REVIEW", label: "Under review" },
  { key: "PENDING_APPROVAL", label: "Price adjusted" },
  { key: "AWAITING_PAYMENT", label: "Awaiting payment" },
  { key: "PAID_AWAITING_CLOSURE", label: "Ready to close" },
];

const MIX_RADIUS = 34;

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
const InboxIcon = () => (
  <Svg>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.5 5.5 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.5A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.5z" />
  </Svg>
);
const AlarmIcon = () => (
  <Svg>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2 2M5 3 2 6m20 0-3-3" />
  </Svg>
);
const HourglassIcon = () => (
  <Svg>
    <path d="M6 3h12M6 21h12M6 3c0 4 3 5 3 9s-3 5-3 9M18 3c0 4-3 5-3 9s3 5 3 9" />
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
const CheckIcon = () => (
  <Svg>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.5 2.5 4.5-5" />
  </Svg>
);

const CustomsWorkspace = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [queueFilter, setQueueFilter] = useState("ALL");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      setLoadError("");
      const response = await fetchCustomsDashboard();
      if (!active) return;
      if (response) {
        setDashboard(response);
      } else {
        setDashboard(null);
        setLoadError("We couldn't load the workspace. Please try again.");
      }
      setIsLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const rows = useMemo(() => dashboard?.priorityDeclarations || [], [dashboard]);

  const overdueIds = useMemo(
    () => new Set((dashboard?.overdueDeclarations || []).map((row) => row.id)),
    [dashboard]
  );

  const gapById = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      map.set(row.id, computeGap(row));
    });
    return map;
  }, [rows]);

  const filterCounts = useMemo(() => {
    const counts = { ALL: rows.length };
    rows.forEach((row) => {
      const key = workflowKey(row);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [rows]);

  const visibleRows = useMemo(() => {
    const filtered =
      queueFilter === "ALL"
        ? rows
        : rows.filter((row) => workflowKey(row) === queueFilter);
    // Most recent declaration date first; undated rows go last.
    const byMostRecent = (a, b) => {
      const da = a.declarationDate ? new Date(a.declarationDate).getTime() : -Infinity;
      const db = b.declarationDate ? new Date(b.declarationDate).getTime() : -Infinity;
      return db - da;
    };
    return [...filtered].sort(byMostRecent);
  }, [rows, queueFilter]);

  const riskRows = useMemo(
    () => rows.filter((row) => Number(row.variancePercent) >= VARIANCE_WARN_AT),
    [rows]
  );
  const revenueAtRisk = useMemo(
    () => riskRows.reduce((sum, row) => sum + Math.max(0, computeGap(row)), 0),
    [riskRows]
  );

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  if (isLoading) {
    return (
      <Page>
        <Centered>Loading workspace…</Centered>
      </Page>
    );
  }
  if (loadError) {
    return (
      <Page>
        <Centered>{loadError}</Centered>
      </Page>
    );
  }
  if (!dashboard) {
    return (
      <Page>
        <Centered>No declarations are in scope yet.</Centered>
      </Page>
    );
  }

  const statusBreakdown = (dashboard.declarationStatusBreakdown || []).filter(
    (slice) => Number(slice.count) > 0
  );
  const breakdownTotal =
    statusBreakdown.reduce((sum, slice) => sum + Number(slice.count || 0), 0) ||
    1;
  const importerCount = Number(dashboard.importerDeclarationsCount || 0);
  const individualCount = Number(dashboard.individualDeclarationsCount || 0);
  const mixTotal = importerCount + individualCount || 1;
  const importerPct = Math.round((importerCount / mixTotal) * 100);
  const individualPct = 100 - importerPct;
  const mixCircum = 2 * Math.PI * MIX_RADIUS;
  const importerArc = (importerCount / mixTotal) * mixCircum;
  const highVariance = dashboard.highVarianceDeclarations || [];

  return (
    <Page>
      <TopBar>
        <div>
          <Subtitle>
            {today} · {formatInteger(dashboard.totalDeclarations)} declarations in
            scope
          </Subtitle>
        </div>
        {visibleRows.length > 0 && (
          <PrimaryButton onClick={() => openDeclaration(navigate, visibleRows[0])}>
            Review next in queue
          </PrimaryButton>
        )}
      </TopBar>

      <KpiGrid>
        <Kpi $accent="#2480f2">
          <KpiTop>
            <KpiLabel>Needs your review</KpiLabel>
            <KpiIcon $accent="#2480f2" $bg="#e8f1fe">
              <InboxIcon />
            </KpiIcon>
          </KpiTop>
          <KpiValue>
            {formatInteger(
              Number(dashboard.submittedCount || 0) +
                Number(dashboard.underReviewCount || 0)
            )}
          </KpiValue>
          <KpiHint>new + under review</KpiHint>
        </Kpi>
        <Kpi $accent="#e24b4a">
          <KpiTop>
            <KpiLabel>Overdue</KpiLabel>
            <KpiIcon $accent="#e24b4a" $bg="#fdecec">
              <AlarmIcon />
            </KpiIcon>
          </KpiTop>
          <KpiValue>{formatInteger(dashboard.overdueCount)}</KpiValue>
          <KpiHint>SLA breached</KpiHint>
        </Kpi>
        <Kpi $accent="#f0a500">
          <KpiTop>
            <KpiLabel>Oldest pending</KpiLabel>
            <KpiIcon $accent="#b07400" $bg="#fef3e0">
              <HourglassIcon />
            </KpiIcon>
          </KpiTop>
          <KpiValue>{formatDays(dashboard.oldestPendingAgeDays)}</KpiValue>
          <KpiHint>awaiting a decision</KpiHint>
        </Kpi>
        <Kpi $accent="#e24b4a">
          <KpiTop>
            <KpiLabel>Revenue at risk</KpiLabel>
            <KpiIcon $accent="#e24b4a" $bg="#fdecec">
              <ShieldIcon />
            </KpiIcon>
          </KpiTop>
          <KpiValue>{formatMoneyCompact(revenueAtRisk)}</KpiValue>
          <KpiHint>across {riskRows.length} flagged declarations</KpiHint>
        </Kpi>
      </KpiGrid>

      <MainGrid>
        <div>
          <Card>
            <CardHead>
              <div>
                <CardTitle>Review queue</CardTitle>
                <CardDesc>Sorted by most recent</CardDesc>
              </div>
              <GhostButton
                onClick={() => navigate("/profile/role_customs/Declaration")}
              >
                All declarations
              </GhostButton>
            </CardHead>

            <Chips>
              {QUEUE_FILTERS.map((filter) => (
                <Chip
                  key={filter.key}
                  $active={queueFilter === filter.key}
                  onClick={() => setQueueFilter(filter.key)}
                >
                  {filter.label}{" "}
                  <ChipCount>{filterCounts[filter.key] || 0}</ChipCount>
                </Chip>
              ))}
            </Chips>

            {visibleRows.length === 0 ? (
              <EmptyBlock>Nothing in this view right now.</EmptyBlock>
            ) : (
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <th>Submitter</th>
                      <th>Role</th>
                      <th>Declaration date</th>
                      <th>Devices</th>
                      <th>Declared total (USD)</th>
                      <th>Fixed total (USD)</th>
                      <th>Variance</th>
                      <th>Status</th>
                      <th aria-label="action" />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => {
                      const key = workflowKey(row);
                      const dStatus = declarationDisplayStatus(row);
                      const isIndividual = row.declarationType === "INDIVIDUAL";
                      const variance =
                        row.variancePercent == null
                          ? null
                          : Number(row.variancePercent);
                      return (
                        <tr key={`${row.declarationType}-${row.id}`}>
                          <td>
                            <Submitter>{row.submitterName || "—"}</Submitter>
                            <SubMeta>{row.declarationNumber}</SubMeta>
                          </td>
                          <td>
                            <RoleBadge $individual={isIndividual}>
                              {isIndividual ? "Individual" : "Importer"}
                            </RoleBadge>
                          </td>
                          <td>{formatShortDate(row.declarationDate)}</td>
                          <td>{formatInteger(row.devicesCount)}</td>
                          <td>{formatAmount(row.declaredTotalUsd)}</td>
                          <td>
                            {row.estimatedValueUsd != null
                              ? formatAmount(row.estimatedValueUsd)
                              : "—"}
                          </td>
                          <td>
                            {variance == null ? (
                              <Pill $tone="neutral">—</Pill>
                            ) : (
                              <Pill $tone={varianceTone(variance)}>
                                {formatVariance(variance)}
                              </Pill>
                            )}
                          </td>
                          <td>
                            <StatusPill>
                              <StatusDot
                                style={{
                                  background:
                                    STATUS_PALETTE[dStatus] || "#B4B2A9",
                                }}
                              />
                              {formatDeclarationStatus(dStatus)}
                            </StatusPill>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <RowAction
                              $primary={
                                key === "PENDING_APPROVAL" ||
                                key === "UNDER_REVIEW"
                              }
                              onClick={() => openDeclaration(navigate, row)}
                            >
                              {nextActionLabel(key)}
                            </RowAction>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </Card>

          <Card>
            <CardTitle>Workload distribution</CardTitle>
            <CardDesc>
              Where the {formatInteger(dashboard.totalDeclarations)} in-scope
              declarations sit today
            </CardDesc>
            {statusBreakdown.length === 0 ? (
              <EmptyBlock>No declarations to chart.</EmptyBlock>
            ) : (
              <>
                <SegBar>
                  {statusBreakdown.map((slice) => (
                    <span
                      key={slice.status}
                      title={`${formatStatus(slice.status)} · ${slice.count}`}
                      style={{
                        width: `${(Number(slice.count) / breakdownTotal) * 100}%`,
                        background: STATUS_PALETTE[slice.status] || "#B4B2A9",
                      }}
                    />
                  ))}
                </SegBar>
                <Legend>
                  {statusBreakdown.map((slice) => (
                    <LegendItem key={slice.status}>
                      <Dot
                        style={{
                          background: STATUS_PALETTE[slice.status] || "#B4B2A9",
                        }}
                      />
                      {formatStatus(slice.status)} · {formatInteger(slice.count)}
                    </LegendItem>
                  ))}
                </Legend>
              </>
            )}
          </Card>
        </div>

        <div>
          <Card $accent="#2480f2">
            <CardTitle>Financial exposure</CardTitle>
            <CardDesc>Money in the pipeline</CardDesc>
            <ExpGrid>
              <ExpTile $bg="#eef4ff" $border="#d6e4fb">
                <ExpTileIcon $bg="#dbe8fd" $fg="#1d4ed8">
                  <WalletIcon />
                </ExpTileIcon>
                <ExpTileLabel>Awaiting payment</ExpTileLabel>
                <ExpTileValue $fg="#1d4ed8">
                  {formatMoney(dashboard.awaitingPaymentTotalPayableUsd)}
                </ExpTileValue>
              </ExpTile>
              <ExpTile $bg="#ecf8f1" $border="#cfeedd">
                <ExpTileIcon $bg="#d6f1e2" $fg="#1a7f44">
                  <CheckIcon />
                </ExpTileIcon>
                <ExpTileLabel>Paid · ready to close</ExpTileLabel>
                <ExpTileValue $fg="#1a7f44">
                  {formatMoney(dashboard.paidAwaitingClosureTotalPayableUsd)}
                </ExpTileValue>
              </ExpTile>
            </ExpGrid>
          </Card>

          <Card>
            <CardTitle>Declaration mix</CardTitle>
            <CardDesc>In scope today</CardDesc>
            <MixWrap>
              <MixChart>
                <svg width="92" height="92" viewBox="0 0 92 92">
                  <circle
                    cx="46"
                    cy="46"
                    r={MIX_RADIUS}
                    fill="none"
                    stroke="#f1f2f5"
                    strokeWidth="12"
                  />
                  <circle
                    cx="46"
                    cy="46"
                    r={MIX_RADIUS}
                    fill="none"
                    stroke="#378ADD"
                    strokeWidth="12"
                    strokeDasharray={`${importerArc} ${mixCircum}`}
                    transform="rotate(-90 46 46)"
                  />
                  <circle
                    cx="46"
                    cy="46"
                    r={MIX_RADIUS}
                    fill="none"
                    stroke="#B4B2A9"
                    strokeWidth="12"
                    strokeDasharray={`${mixCircum - importerArc} ${mixCircum}`}
                    strokeDashoffset={`-${importerArc}`}
                    transform="rotate(-90 46 46)"
                  />
                </svg>
                <MixCenter>
                  <MixTotalNum>{formatInteger(mixTotal)}</MixTotalNum>
                  <MixTotalLbl>total</MixTotalLbl>
                </MixCenter>
              </MixChart>
              <MixLegend>
                <MixRow>
                  <Dot style={{ background: "#378ADD" }} />
                  <MixName>Importer</MixName>
                  <MixVal>
                    {formatInteger(importerCount)} · {importerPct}%
                  </MixVal>
                </MixRow>
                <MixRow>
                  <Dot style={{ background: "#B4B2A9" }} />
                  <MixName>Individual</MixName>
                  <MixVal>
                    {formatInteger(individualCount)} · {individualPct}%
                  </MixVal>
                </MixRow>
              </MixLegend>
            </MixWrap>
          </Card>

          <Card $danger>
            <CardTitle>Revenue at risk</CardTitle>
            <CardDesc>Largest gaps between declared and fixed total</CardDesc>
            {highVariance.length === 0 ? (
              <EmptyBlock>No flagged declarations.</EmptyBlock>
            ) : (
              <RiskList>
                {highVariance.map((item) => {
                  const gap = gapById.get(item.declarationId);
                  const variance = Number(item.variancePercent || 0);
                  return (
                    <RiskRow
                      key={`${item.declarationType}-${item.declarationId}`}
                      onClick={() =>
                        openDeclaration(navigate, {
                          id: item.declarationId,
                          declarationType: item.declarationType,
                        })
                      }
                    >
                      <div>
                        <Submitter>{item.submitterName || "—"}</Submitter>
                        <SubMeta>
                          {item.declarationType === "INDIVIDUAL"
                            ? "Individual"
                            : "Importer"}{" "}
                          · {item.declarationNumber}
                        </SubMeta>
                      </div>
                      <RiskRight>
                        <Pill $tone={varianceTone(variance)}>
                          {formatVariance(variance)}
                        </Pill>
                        {gap != null && gap > 0 && (
                          <GapNote>+{formatMoney(gap)} duty base</GapNote>
                        )}
                      </RiskRight>
                    </RiskRow>
                  );
                })}
              </RiskList>
            )}
          </Card>
        </div>
      </MainGrid>
    </Page>
  );
};

const computeGap = (row) => {
  const estimated = Number(row?.estimatedValueUsd || 0);
  const declared = Number(row?.declaredTotalUsd || 0);
  return estimated - declared;
};

const workflowKey = (row) => {
  if (
    row?.status === "UNDER_REVIEW" &&
    row?.approvedPriceUsd != null &&
    row?.adjustmentReason?.trim()
  ) {
    return "PENDING_APPROVAL";
  }
  if (row?.status === "PAID") return "PAID_AWAITING_CLOSURE";
  return row?.status;
};

const nextActionLabel = (key) => {
  switch (key) {
    case "SUBMITTED":
      return "Start";
    case "UNDER_REVIEW":
      return "Review";
    case "PENDING_APPROVAL":
      return "Approve";
    case "AWAITING_PAYMENT":
      return "Monitor";
    case "PAID_AWAITING_CLOSURE":
      return "Close";
    default:
      return "View";
  }
};

const formatStatus = (status) => {
  if (status === "PENDING_APPROVAL") return "Price adjusted";
  if (status === "PAID_AWAITING_CLOSURE") return "Ready to close";
  if (status === "DECLINED") return "Declined";
  if (status === "CLOSED") return "Closed";
  return String(status || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/, (letter) => letter.toUpperCase());
};

// Status shown in the queue's Status column, kept identical to the Declarations
// table (getDisplayStatus + formatStatusLabel in CustomsDeclarations.js).
const declarationDisplayStatus = (row) => {
  if (
    row?.status === "UNDER_REVIEW" &&
    row?.approvedPriceUsd != null &&
    row?.adjustmentReason?.trim()
  ) {
    return "PENDING_APPROVAL";
  }
  return row?.status;
};

const formatDeclarationStatus = (status) => {
  if (!status) return "-";
  if (status === "PENDING_APPROVAL") return "Pending Approval";
  if (status === "DECLINED") return "Rejected";
  if (status === "CLOSED") return "Closed";
  return String(status)
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
};

const ageTone = (days, isOverdue) => {
  if (isOverdue) return "danger";
  if (days >= DUE_SOON_AT_DAYS) return "warning";
  return "ok";
};

const varianceTone = (value) => {
  if (value >= VARIANCE_HIGH_AT) return "danger";
  if (value >= VARIANCE_WARN_AT) return "warning";
  return "ok";
};

const openDeclaration = (navigate, row) => {
  navigate("/profile/role_customs/Declaration", {
    state: {
      declarationType: row.declarationType || "IMPORTER",
      declarationId: row.id || row.declarationId,
    },
  });
};

const formatInteger = (value) =>
  Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

const formatMoney = (value) =>
  `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatAmount = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatMoneyCompact = (value) => {
  const numeric = Number(value || 0);
  if (Math.abs(numeric) >= 1000) {
    return `$${(numeric / 1000).toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}k`;
  }
  return `$${numeric.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

const formatDays = (days) => {
  const numeric = Number(days || 0);
  if (numeric <= 0) return "Today";
  return `${formatInteger(numeric)} ${numeric === 1 ? "day" : "days"}`;
};

const formatAge = (days) => {
  if (days <= 0) return "Today";
  return `${days}d`;
};

const formatShortDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatVariance = (value) => {
  const numeric = Number(value || 0);
  const sign = numeric > 0 ? "+" : "";
  return `${sign}${numeric.toFixed(0)}%`;
};

const getDeclarationAgeDays = (value) => {
  if (!value) return 0;
  const declarationDate = new Date(value);
  if (Number.isNaN(declarationDate.getTime())) return 0;
  const now = new Date();
  const declarationDay = new Date(
    declarationDate.getFullYear(),
    declarationDate.getMonth(),
    declarationDate.getDate()
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const ms = today.getTime() - declarationDay.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
};

const TONES = {
  danger: { bg: "#fdecec", fg: "#b42318" },
  warning: { bg: "#fef3e0", fg: "#92590b" },
  ok: { bg: "#e9f7ef", fg: "#1a7f44" },
  neutral: { bg: "#f1f2f5", fg: "#6b7280" },
};

const Page = styled.div`
  width: 100%;
  box-sizing: border-box;
  padding: 18px 24px 28px;
  color: #1f2430;
  font-family: inherit;
`;

const Centered = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  color: #6b7280;
  font-size: 15px;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

const Subtitle = styled.p`
  font-size: 13px;
  color: #6b7280;
  margin: 0;
`;

const PrimaryButton = styled.button`
  border: none;
  background: #1f2430;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
  }
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
  gap: 8px;
  margin-bottom: 6px;
`;

const KpiIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  flex: none;
  background: ${(p) => p.$bg || "#f1f2f5"};
  color: ${(p) => p.$accent || "#5f5e5a"};
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

const KpiHint = styled.p`
  font-size: 11px;
  color: #9aa1ad;
  margin: 5px 0 0;
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.95fr) minmax(0, 1fr);
  gap: 14px;
  align-items: start;
  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  position: relative;
  background: #fff;
  border: 1px solid ${(p) => (p.$danger ? "#f3d2d2" : "#ececf1")};
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 14px;
  ${(p) =>
    p.$accent
      ? `border-top: 2px solid ${p.$accent};`
      : ""}
`;

const CardHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
`;

const CardTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  margin: 0;
`;

const CardDesc = styled.p`
  font-size: 12px;
  color: #9aa1ad;
  margin: 2px 0 0;
`;

const GhostButton = styled.button`
  border: 1px solid #e3e6ec;
  background: transparent;
  color: #1f2430;
  font-size: 12px;
  padding: 7px 12px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  &:hover {
    background: #f7f8fa;
  }
`;

const Chips = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin: 12px 0 2px;
`;

const Chip = styled.button`
  font-size: 12px;
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid ${(p) => (p.$active ? "#1f2430" : "#e3e6ec")};
  background: ${(p) => (p.$active ? "#1f2430" : "transparent")};
  color: ${(p) => (p.$active ? "#fff" : "#6b7280")};
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease;
  &:hover {
    border-color: ${(p) => (p.$active ? "#1f2430" : "#c7ccd6")};
  }
`;

const ChipCount = styled.span`
  opacity: 0.7;
  margin-left: 2px;
`;

const TableWrap = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 6px;
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
    padding: 8px 6px;
    border-bottom: 1px solid #f3f4f7;
    font-size: 13px;
    vertical-align: middle;
  }
  tbody tr:last-child td {
    border-bottom: none;
  }
  tbody tr:hover {
    background: #fafbfc;
  }
`;

const Submitter = styled.div`
  font-weight: 500;
  font-size: 13px;
`;

const SubMeta = styled.div`
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
`;

const Pill = styled.span`
  font-size: 11px;
  padding: 3px 9px;
  border-radius: 999px;
  white-space: nowrap;
  background: ${(p) => (TONES[p.$tone] || TONES.neutral).bg};
  color: ${(p) => (TONES[p.$tone] || TONES.neutral).fg};
`;

const RoleBadge = styled.span`
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 999px;
  white-space: nowrap;
  background: ${(p) => (p.$individual ? "#f1f2f5" : "#e8f1fe")};
  color: ${(p) => (p.$individual ? "#5f5e5a" : "#1d4ed8")};
`;

const StatusPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #1f2430;
  white-space: nowrap;
`;

const StatusDot = styled.i`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: none;
`;

const RowAction = styled.button`
  font-size: 12px;
  padding: 6px 10px;
  min-width: 72px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  border: 1px solid ${(p) => (p.$primary ? "#1f2430" : "#e3e6ec")};
  background: ${(p) => (p.$primary ? "#1f2430" : "transparent")};
  color: ${(p) => (p.$primary ? "#fff" : "#1f2430")};
  transition: background 0.12s ease, border-color 0.12s ease;
  &:hover {
    border-color: ${(p) => (p.$primary ? "#1f2430" : "#c7ccd6")};
    background: ${(p) => (p.$primary ? "#000" : "#fafbfc")};
  }
`;

const EmptyBlock = styled.div`
  padding: 20px 0;
  text-align: center;
  color: #9aa1ad;
  font-size: 13px;
`;

const SegBar = styled.div`
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  display: flex;
  gap: 2px;
  margin: 12px 0 10px;
  background: #f1f2f5;
  span {
    height: 100%;
  }
`;

const Legend = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(125px, 1fr));
  gap: 6px 12px;
`;

const LegendItem = styled.span`
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 7px;
`;

const Dot = styled.i`
  width: 9px;
  height: 9px;
  border-radius: 2px;
  flex: none;
`;

const MixWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
`;

const MixChart = styled.div`
  position: relative;
  width: 92px;
  height: 92px;
  flex: none;
`;

const MixCenter = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const MixTotalNum = styled.div`
  font-size: 20px;
  font-weight: 600;
  line-height: 1;
  color: #1f2430;
`;

const MixTotalLbl = styled.div`
  font-size: 10px;
  color: #9aa1ad;
  margin-top: 2px;
`;

const MixLegend = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
`;

const MixRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
`;

const MixName = styled.span`
  flex: 1;
  color: #6b7280;
`;

const MixVal = styled.span`
  font-weight: 500;
  color: #1f2430;
`;

const RiskList = styled.div`
  margin-top: 6px;
`;

const RiskRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  padding: 9px 6px;
  margin: 0 -6px;
  border-radius: 8px;
  border-bottom: 1px solid #f3f4f7;
  cursor: pointer;
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: #fafbfc;
  }
`;

const RiskRight = styled.div`
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

const GapNote = styled.div`
  font-size: 11px;
  color: #6b7280;
`;

const ExpGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 12px;
  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
`;

const ExpTile = styled.div`
  background: ${(p) => p.$bg || "#f7f8fa"};
  border: 1px solid ${(p) => p.$border || "#ececf1"};
  border-radius: 10px;
  padding: 12px;
`;

const ExpTileIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  margin-bottom: 10px;
  background: ${(p) => p.$bg || "#f1f2f5"};
  color: ${(p) => p.$fg || "#5f5e5a"};
`;

const ExpTileLabel = styled.div`
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 3px;
`;

const ExpTileValue = styled.div`
  font-weight: 600;
  font-size: 19px;
  letter-spacing: -0.01em;
  color: ${(p) => p.$fg || "#1f2430"};
`;

export default CustomsWorkspace;
