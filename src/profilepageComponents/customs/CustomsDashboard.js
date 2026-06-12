import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import eyeSVG from "../../assets/eye.svg";
import noDeclarations from "../../assets/noDeclarations.png";
import { fetchCustomsDashboard } from "../../functions/customs";
import { STATUS_STYLES, StatusIcon } from "../statusBadge";

const SERIES_COLORS = {
  submittedCount: "#7b61ff",
  underReviewCount: "#ff9d76",
  awaitingPaymentCount: "#4b6ee8",
  paidCount: "#57c785",
  declinedCount: "#ff8d8d",
};

const STATUS_CHART_COLORS = {
  SUBMITTED: "#7b61ff",
  UNDER_REVIEW: "#ff9d76",
  APPROVED: "#ffb648",
  AWAITING_PAYMENT: "#4b6ee8",
  PAID: "#57c785",
  DECLINED: "#ff8d8d",
  CLOSED: "#3bb8d8",
};

const WORKFLOW_STYLES = {
  ...STATUS_STYLES,
  PAID_AWAITING_CLOSURE: {
    background: "#ebf9ef",
    color: "#0da44b",
  },
};

const PRIORITY_FILTERS = [
  { key: "ALL", label: "Customs_DashboardQueueAll" },
  { key: "SUBMITTED", label: "Customs_DashboardNewSubmissions" },
  { key: "UNDER_REVIEW", label: "Under Review" },
  { key: "PENDING_APPROVAL", label: "Pending Approval" },
  { key: "AWAITING_PAYMENT", label: "Awaiting Payment" },
  { key: "PAID_AWAITING_CLOSURE", label: "Customs_DashboardAwaitingClosure" },
];

const KPI_CARD_CONFIG = [
  {
    key: "submittedCount",
    label: "Customs_DashboardNewSubmissions",
    hint: "Customs_DashboardHintSubmitted",
    icon: "document",
    accent: "#2480f2",
    surface: "linear-gradient(180deg, #ffffff 0%, #f6f9ff 100%)",
    tile: "#edf5ff",
  },
  {
    key: "underReviewCount",
    label: "Under Review",
    hint: "Customs_DashboardHintUnderReview",
    icon: "briefcase",
    accent: "#f28b2c",
    surface: "linear-gradient(180deg, #ffffff 0%, #fff9f0 100%)",
    tile: "#fff3df",
  },
  {
    key: "pendingApprovalCount",
    label: "Pending Approval",
    hint: "Customs_DashboardHintPendingApproval",
    icon: "adjustment",
    accent: "#845ef7",
    surface: "linear-gradient(180deg, #ffffff 0%, #f8f4ff 100%)",
    tile: "#f1eaff",
  },
  {
    key: "awaitingPaymentCount",
    label: "Awaiting Payment",
    hint: "Customs_DashboardHintAwaitingPayment",
    icon: "wallet",
    accent: "#4b6ee8",
    surface: "linear-gradient(180deg, #ffffff 0%, #f5f8ff 100%)",
    tile: "#e9efff",
  },
  {
    key: "paidAwaitingClosureCount",
    label: "Customs_DashboardAwaitingClosure",
    hint: "Customs_DashboardHintAwaitingClosure",
    icon: "checkCircle",
    accent: "#19a463",
    surface: "linear-gradient(180deg, #ffffff 0%, #f2fbf6 100%)",
    tile: "#e7f8ee",
  },
];

const CustomsDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setIsLoading(true);
      setLoadError("");
      const response = await fetchCustomsDashboard();
      if (!active) return;

      if (response) {
        setDashboard(response);
      } else {
        setDashboard(null);
        setLoadError(t("Customs_DashboardLoadError"));
      }

      setIsLoading(false);
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [t]);

  const priorityDeclarations = useMemo(() => {
    const rows = dashboard?.priorityDeclarations || [];
    return rows.filter((row) => matchesPriorityFilter(getDashboardWorkflowKey(row), priorityFilter));
  }, [dashboard, priorityFilter]);

  const statusBreakdown = dashboard?.declarationStatusBreakdown || [];
  const totalDeclarations =
    dashboard?.totalDeclarations ||
    statusBreakdown.reduce((sum, item) => sum + Number(item.count || 0), 0);

  const importerDeclarationsCount = Number(dashboard?.importerDeclarationsCount || 0);
  const individualDeclarationsCount = Number(dashboard?.individualDeclarationsCount || 0);
  const mixTotal = importerDeclarationsCount + individualDeclarationsCount;

  const openDeclarationsPage = () => {
    navigate("/profile/role_customs/Declaration");
  };

  const openDeclaration = (row) => {
    navigate("/profile/role_customs/Declaration", {
      state: {
        declarationType: row.declarationType || "IMPORTER",
        declarationId: row.id || row.declarationId,
      },
    });
  };

  return (
    <DashboardPage>
      {isLoading ? (
        <CenteredState>{t("Loading...")}</CenteredState>
      ) : loadError ? (
        <CenteredState>{loadError}</CenteredState>
      ) : !dashboard ? (
        <CenteredState>{t("Customs_DashboardEmpty")}</CenteredState>
      ) : (
        <>
          <StatsGrid>
            {KPI_CARD_CONFIG.map((card) => {
              const Icon = getKpiIcon(card.icon);
              return (
                <StatCard key={card.key} $surface={card.surface}>
                  <StatAccentLine $accent={card.accent} />
                  <StatLabel>{t(card.label)}</StatLabel>
                  <StatValue $accent={card.accent}>
                    {formatInteger(dashboard[card.key] || 0)}
                  </StatValue>
                  <StatHint>{t(card.hint)}</StatHint>
                  <StatIconTile $background={card.tile} $accent={card.accent}>
                    <Icon />
                  </StatIconTile>
                </StatCard>
              );
            })}
          </StatsGrid>

          <DashboardColumns>
            <LeftColumn>
            <PriorityPanel $compact={priorityDeclarations.length === 0}>
              <PanelHeader>
                <div>
                  <PanelTitle>{t("Customs_DashboardPriorityQueue")}</PanelTitle>
                  <PanelDescription>{t("Customs_DashboardPriorityQueueDescription")}</PanelDescription>
                </div>
                <HeaderActionButton type="button" onClick={openDeclarationsPage}>
                  {t("Customs_DashboardViewAllDeclarations")}
                </HeaderActionButton>
              </PanelHeader>

              <FilterRow>
                {PRIORITY_FILTERS.map((filter) => (
                  <FilterTab
                    key={filter.key}
                    type="button"
                    $active={priorityFilter === filter.key}
                    onClick={() => setPriorityFilter(filter.key)}
                  >
                    {t(filter.label)}
                  </FilterTab>
                ))}
              </FilterRow>

              {priorityDeclarations.length === 0 ? (
                <EmptyBlock>
                  <img src={noDeclarations} alt="No declarations" />
                  <span>{t("Customs_DashboardNoPriority")}</span>
                </EmptyBlock>
              ) : (
                <PriorityTableWrapper>
                  <PriorityTable>
                    <thead>
                      <tr>
                        <th>{t("Role")}</th>
                        <th>{t("Submitter")}</th>
                        <th>{t("Declaration Nbr.")}</th>
                        <th>{t("Declaration Date")}</th>
                        <th>{t("Devices Count")}</th>
                        <th>{t("Variance")}</th>
                        <th>{t("Status")}</th>
                        <th>{t("Actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priorityDeclarations.map((row) => {
                        const workflowKey = getDashboardWorkflowKey(row);
                        return (
                          <tr key={`${row.declarationType}-${row.id}`}>
                            <td>
                              <RoleBadge $role={row.declarationType}>
                                {t(row.declarationType === "INDIVIDUAL" ? "Individual" : "Importer")}
                              </RoleBadge>
                            </td>
                            <td>{row.submitterName}</td>
                            <td>{row.declarationNumber}</td>
                            <td>{formatDate(row.declarationDate)}</td>
                            <td>{formatInteger(row.devicesCount)}</td>
                            <td>
                              <VarianceValue value={Number(row.variancePercent || 0)} />
                            </td>
                            <td>
                              <WorkflowBadge $status={workflowKey}>
                                <StatusIcon
                                  status={workflowKey === "PAID_AWAITING_CLOSURE" ? "PAID" : workflowKey}
                                />
                                {t(formatWorkflowLabel(workflowKey))}
                              </WorkflowBadge>
                            </td>
                            <td>
                              <InlineActionButton type="button" onClick={() => openDeclaration(row)}>
                                <img src={eyeSVG} alt="View details" />
                                {t("View Details")}
                              </InlineActionButton>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </PriorityTable>
                </PriorityTableWrapper>
              )}
            </PriorityPanel>

            <Panel>
              <PanelTitle>{t("Customs_DashboardStatusDistribution")}</PanelTitle>
              <PanelDescription>{t("Customs_DashboardStatusDistributionDescription")}</PanelDescription>
              <DonutSection>
                <DonutChart
                  total={totalDeclarations}
                  slices={statusBreakdown.map((slice) => ({
                    label: t(formatWorkflowLabel(slice.status)),
                    value: Number(slice.count || 0),
                    color:
                      STATUS_CHART_COLORS[slice.status] ||
                      STATUS_STYLES[slice.status]?.color ||
                      "#7b61ff",
                  }))}
                />
                <LegendList>
                  {statusBreakdown.map((slice) => (
                    <LegendItem key={slice.status}>
                      <LegendDot
                        style={{
                          background:
                            STATUS_CHART_COLORS[slice.status] ||
                            STATUS_STYLES[slice.status]?.color ||
                            "#7b61ff",
                        }}
                      />
                      <span>{t(formatWorkflowLabel(slice.status))}</span>
                    </LegendItem>
                  ))}
                </LegendList>
              </DonutSection>
            </Panel>
            </LeftColumn>

            <RightColumn>
              <InsightPanel>
                <PanelTitle>{t("Customs_DashboardDeclarationMix")}</PanelTitle>
                <InsightDescription>{t("Customs_DashboardDeclarationMixDescription")}</InsightDescription>
                <MixCardGroup>
                  <MixCard>
                    <MixHeader>
                      <span>{t("Importer")}</span>
                      <strong>{formatInteger(importerDeclarationsCount)}</strong>
                    </MixHeader>
                    <MixBarTrack>
                      <MixBarFill
                        $color="#4b6ee8"
                        $width={mixTotal ? (importerDeclarationsCount / mixTotal) * 100 : 0}
                      />
                    </MixBarTrack>
                  </MixCard>
                  <MixCard>
                    <MixHeader>
                      <span>{t("Individual")}</span>
                      <strong>{formatInteger(individualDeclarationsCount)}</strong>
                    </MixHeader>
                    <MixBarTrack>
                      <MixBarFill
                        $color="#57c785"
                        $width={mixTotal ? (individualDeclarationsCount / mixTotal) * 100 : 0}
                      />
                    </MixBarTrack>
                  </MixCard>
                </MixCardGroup>
              </InsightPanel>

              <InsightPanel>
                <PanelTitle>{t("Customs_DashboardOverdueActions")}</PanelTitle>
                <InsightDescription>{t("Customs_DashboardOverdueDescription")}</InsightDescription>
                {(dashboard.overdueDeclarations || []).length === 0 ? (
                  <SmallEmptyState>{t("Customs_DashboardNoOverdue")}</SmallEmptyState>
                ) : (
                  <InsightList>
                    {dashboard.overdueDeclarations.map((row) => {
                      const workflowKey = getDashboardWorkflowKey(row);
                      return (
                        <InsightListItem
                          key={`overdue-${row.declarationType}-${row.id}`}
                          type="button"
                          onClick={() => openDeclaration(row)}
                        >
                          <InsightTopRow>
                            <strong>{row.declarationNumber}</strong>
                            <VarianceText $positive={false}>
                              {formatAge(getDeclarationAgeDays(row.declarationDate), t)}
                            </VarianceText>
                          </InsightTopRow>
                          <InsightBodyText>{row.submitterName}</InsightBodyText>
                          <InsightMetaRow>
                            <RoleChip $role={row.declarationType}>
                              {t(row.declarationType === "INDIVIDUAL" ? "Individual" : "Importer")}
                            </RoleChip>
                            <WorkflowChip $status={workflowKey}>
                              {t(formatWorkflowLabel(workflowKey))}
                            </WorkflowChip>
                          </InsightMetaRow>
                        </InsightListItem>
                      );
                    })}
                  </InsightList>
                )}
              </InsightPanel>

              <InsightPanel>
                <PanelTitle>{t("Customs_DashboardHighVarianceWatchlist")}</PanelTitle>
                <InsightDescription>{t("Customs_DashboardHighVarianceDescription")}</InsightDescription>
                {(dashboard.highVarianceDeclarations || []).length === 0 ? (
                  <SmallEmptyState>{t("Customs_DashboardNoVariance")}</SmallEmptyState>
                ) : (
                  <InsightList>
                    {dashboard.highVarianceDeclarations.map((item) => (
                      <InsightListItem
                        key={`variance-${item.declarationType}-${item.declarationId}`}
                        type="button"
                        onClick={() =>
                          openDeclaration({
                            id: item.declarationId,
                            declarationType: item.declarationType,
                          })
                        }
                      >
                        <InsightTopRow>
                          <strong>{item.declarationNumber}</strong>
                          <VarianceText $positive={Number(item.variancePercent || 0) >= 0}>
                            {formatVariance(item.variancePercent)}
                          </VarianceText>
                        </InsightTopRow>
                        <InsightBodyText>{item.submitterName}</InsightBodyText>
                        <InsightMetaRow>
                          <RoleChip $role={item.declarationType}>
                            {t(item.declarationType === "INDIVIDUAL" ? "Individual" : "Importer")}
                          </RoleChip>
                          <WorkflowChip $status={item.status}>
                            {t(formatWorkflowLabel(item.status))}
                          </WorkflowChip>
                        </InsightMetaRow>
                      </InsightListItem>
                    ))}
                  </InsightList>
                )}
              </InsightPanel>

            <Panel>
              <PanelHeader>
                <div>
                  <PanelTitle>{t("Customs_DashboardWorkflowTrend")}</PanelTitle>
                  <PanelDescription>{t("Customs_DashboardWorkflowTrendDescription")}</PanelDescription>
                </div>
                <DropdownStub>{t("Daily")}</DropdownStub>
              </PanelHeader>
              <LineChart
                points={dashboard.declarationTrend || []}
                series={[
                  {
                    key: "submittedCount",
                    label: t("Submitted"),
                    color: SERIES_COLORS.submittedCount,
                  },
                  {
                    key: "underReviewCount",
                    label: t("Under Review"),
                    color: SERIES_COLORS.underReviewCount,
                  },
                  {
                    key: "awaitingPaymentCount",
                    label: t("Awaiting Payment"),
                    color: SERIES_COLORS.awaitingPaymentCount,
                  },
                  {
                    key: "paidCount",
                    label: t("Paid"),
                    color: SERIES_COLORS.paidCount,
                  },
                  {
                    key: "declinedCount",
                    label: t("Rejected"),
                    color: SERIES_COLORS.declinedCount,
                  },
                ]}
              />
            </Panel>
            </RightColumn>
          </DashboardColumns>
        </>
      )}
    </DashboardPage>
  );
};

const matchesPriorityFilter = (status, filter) => {
  if (filter === "ALL") {
    return true;
  }
  return status === filter;
};

const getDashboardWorkflowKey = (row) => {
  if (
    row?.declarationType === "IMPORTER" &&
    row?.status === "UNDER_REVIEW" &&
    row?.approvedPriceUsd != null &&
    row?.adjustmentReason?.trim()
  ) {
    return "PENDING_APPROVAL";
  }

  if (row?.status === "PAID") {
    return "PAID_AWAITING_CLOSURE";
  }

  return row?.status;
};

const formatWorkflowLabel = (status) => {
  if (status === "PENDING_APPROVAL") return "Pending Approval";
  if (status === "PAID_AWAITING_CLOSURE") return "Customs_DashboardAwaitingClosure";
  if (status === "DECLINED") return "Rejected";
  if (status === "CLOSED") return "Closed";
  return status
    ?.replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatInteger = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatVariance = (value) => {
  const numeric = Number(value || 0);
  const sign = numeric > 0 ? "+" : "";
  return `${sign}${numeric.toFixed(2)}%`;
};

const getDeclarationAgeDays = (value) => {
  if (!value) return 0;
  const declarationDate = new Date(value);
  if (Number.isNaN(declarationDate.getTime())) {
    return 0;
  }

  const now = new Date();
  const declarationDay = new Date(
    declarationDate.getFullYear(),
    declarationDate.getMonth(),
    declarationDate.getDate()
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const milliseconds = today.getTime() - declarationDay.getTime();
  return Math.max(0, Math.round(milliseconds / (1000 * 60 * 60 * 24)));
};

const formatAge = (days, t) => {
  if (days <= 0) {
    return t("Customs_DashboardToday");
  }
  if (days === 1) {
    return `1 ${t("Customs_DashboardDayOld")}`;
  }
  return `${days} ${t("Customs_DashboardDaysOld")}`;
};

function getKpiIcon(iconKey) {
  switch (iconKey) {
    case "document":
      return DocumentIcon;
    case "briefcase":
      return BriefcaseIcon;
    case "adjustment":
      return AdjustmentIcon;
    case "wallet":
      return WalletIcon;
    case "checkCircle":
      return CheckCircleIcon;
    default:
      return BriefcaseIcon;
  }
}

const VarianceValue = ({ value }) => {
  const positive = value >= 0;
  return (
    <VarianceCell $positive={positive}>
      <span>{`${positive ? "" : "-"}${Math.abs(value).toFixed(2)}%`}</span>
      <VarianceTriangle $positive={positive} />
    </VarianceCell>
  );
};

const polarToCartesian = (cx, cy, radius, angleDeg) => {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
};

const annulusSectorPath = (cx, cy, rOuter, rInner, startAngle, endAngle) => {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const outerStart = polarToCartesian(cx, cy, rOuter, startAngle);
  const outerEnd = polarToCartesian(cx, cy, rOuter, endAngle);
  const innerEnd = polarToCartesian(cx, cy, rInner, endAngle);
  const innerStart = polarToCartesian(cx, cy, rInner, startAngle);
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
};

const DonutChart = ({ slices, total, size = 220, innerSize = 122 }) => {
  const [hover, setHover] = useState(null);
  const normalizedSlices = slices.filter((slice) => Number(slice.value) > 0);
  const gradient = buildConicGradient(normalizedSlices);

  const sliceTotal = normalizedSlices.reduce(
    (sum, slice) => sum + Number(slice.value || 0),
    0
  );
  const rOuter = size / 2;
  const rInner = innerSize / 2;
  let angleCursor = 0;
  const arcs = normalizedSlices.map((slice) => {
    const portion = sliceTotal ? Number(slice.value || 0) / sliceTotal : 0;
    const startAngle = angleCursor;
    let endAngle = angleCursor + portion * 360;
    if (endAngle - startAngle >= 360) {
      endAngle = startAngle + 359.999;
    }
    angleCursor = endAngle;
    return {
      ...slice,
      portion,
      path: annulusSectorPath(rOuter, rOuter, rOuter, rInner, startAngle, endAngle),
    };
  });

  return (
    <DonutContainer $size={size} $gradient={gradient}>
      <DonutCenter $size={innerSize}>
        <small>Total</small>
        <strong>{formatInteger(total)}</strong>
      </DonutCenter>
      <DonutHoverSvg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        onMouseLeave={() => setHover(null)}
      >
        {arcs.map((arc, index) => (
          <path
            key={`${arc.label}-${index}`}
            d={arc.path}
            fill="transparent"
            style={{ cursor: "pointer", pointerEvents: "all" }}
            onMouseMove={(event) =>
              setHover({
                index,
                x: event.nativeEvent.offsetX,
                y: event.nativeEvent.offsetY,
              })
            }
            onMouseEnter={(event) =>
              setHover({
                index,
                x: event.nativeEvent.offsetX,
                y: event.nativeEvent.offsetY,
              })
            }
          />
        ))}
      </DonutHoverSvg>
      {hover && arcs[hover.index] && (
        <DonutTooltip $left={hover.x} $top={hover.y}>
          <TooltipDot $color={arcs[hover.index].color} />
          <TooltipLabel>{arcs[hover.index].label}</TooltipLabel>
          <TooltipValue>
            {formatInteger(arcs[hover.index].value)} (
            {Math.round(arcs[hover.index].portion * 100)}%)
          </TooltipValue>
        </DonutTooltip>
      )}
    </DonutContainer>
  );
};

const buildConicGradient = (slices) => {
  const total = slices.reduce((sum, slice) => sum + Number(slice.value || 0), 0);
  if (!total) {
    return "#eef2ff";
  }

  let offset = 0;
  const stops = slices.map((slice) => {
    const portion = (Number(slice.value || 0) / total) * 100;
    const start = offset;
    const end = offset + portion;
    offset = end;
    return `${slice.color} ${start}% ${end}%`;
  });

  return `conic-gradient(${stops.join(", ")})`;
};

const LineChart = ({ points, series }) => {
  const [hoverIndex, setHoverIndex] = useState(null);
  const chartWidth = 460;
  const chartHeight = 250;
  const padding = { top: 18, right: 16, bottom: 36, left: 34 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;
  const allValues = points.flatMap((point) =>
    series.map((item) => Number(point[item.key] || 0))
  );
  const maxValue = Math.max(...allValues, 10);
  const yMax = Math.ceil(maxValue / 10) * 10;
  const xStep = points.length > 1 ? innerWidth / (points.length - 1) : innerWidth;
  const yTicks = 5;

  const hoveredPoint = hoverIndex != null ? points[hoverIndex] : null;
  const hoverX = hoverIndex != null ? padding.left + xStep * hoverIndex : 0;

  return (
    <ChartWrapper>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        width="100%"
        height="250"
        onMouseLeave={() => setHoverIndex(null)}
      >
        {hoveredPoint && (
          <line
            x1={hoverX}
            y1={padding.top}
            x2={hoverX}
            y2={padding.top + innerHeight}
            stroke="#c3cad9"
            strokeWidth="1"
          />
        )}
        {Array.from({ length: yTicks + 1 }).map((_, index) => {
          const value = (yMax / yTicks) * (yTicks - index);
          const y = padding.top + (innerHeight / yTicks) * index;
          return (
            <g key={value}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + innerWidth}
                y2={y}
                stroke="#e7ebf4"
                strokeDasharray={index === yTicks ? "0" : "3 3"}
              />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fill="#8a93ac" fontSize="11">
                {value}
              </text>
            </g>
          );
        })}

        {points.map((point, index) => {
          const x = padding.left + xStep * index;
          return (
            <g key={`${point.date}-${index}`}>
              <line
                x1={x}
                y1={padding.top}
                x2={x}
                y2={padding.top + innerHeight}
                stroke="#f0f2f8"
              />
              <text
                x={x}
                y={padding.top + innerHeight + 20}
                textAnchor="middle"
                fill="#8a93ac"
                fontSize="11"
              >
                {formatChartDate(point.date)}
              </text>
            </g>
          );
        })}

        {series.map((item) => {
          const path = points
            .map((point, index) => {
              const x = padding.left + xStep * index;
              const y =
                padding.top +
                innerHeight -
                ((Number(point[item.key] || 0) / yMax) * innerHeight || 0);
              return `${index === 0 ? "M" : "L"} ${x} ${y}`;
            })
            .join(" ");

          return (
            <g key={item.key}>
              <path
                d={path}
                fill="none"
                stroke={item.color}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {points.map((point, index) => {
                const x = padding.left + xStep * index;
                const y =
                  padding.top +
                  innerHeight -
                  ((Number(point[item.key] || 0) / yMax) * innerHeight || 0);
                return (
                  <circle
                    key={`${item.key}-${point.date}`}
                    cx={x}
                    cy={y}
                    r="3"
                    fill="#fff"
                    stroke={item.color}
                    strokeWidth="1.5"
                  />
                );
              })}
            </g>
          );
        })}

        {hoveredPoint &&
          series.map((item) => {
            const y =
              padding.top +
              innerHeight -
              ((Number(hoveredPoint[item.key] || 0) / yMax) * innerHeight || 0);
            return (
              <circle
                key={`hover-${item.key}`}
                cx={hoverX}
                cy={y}
                r="4.5"
                fill={item.color}
                stroke="#fff"
                strokeWidth="2"
              />
            );
          })}

        {points.map((point, index) => {
          const x = padding.left + xStep * index;
          return (
            <rect
              key={`hover-band-${point.date}-${index}`}
              x={x - xStep / 2}
              y={padding.top}
              width={xStep}
              height={innerHeight}
              fill="transparent"
              style={{ pointerEvents: "all" }}
              onMouseEnter={() => setHoverIndex(index)}
            />
          );
        })}
      </svg>

      {hoveredPoint && (
        <ChartTooltip $left={(hoverX / chartWidth) * 100} $top={6}>
          <TooltipDate>{formatChartDate(hoveredPoint.date)}</TooltipDate>
          {series.map((item) => (
            <TooltipRow key={`tip-${item.key}`}>
              <TooltipDot $color={item.color} />
              <TooltipLabel>{item.label}</TooltipLabel>
              <TooltipValue>
                {formatInteger(Number(hoveredPoint[item.key] || 0))}
              </TooltipValue>
            </TooltipRow>
          ))}
        </ChartTooltip>
      )}

      <LegendRow>
        {series.map((item) => (
          <LegendItem key={item.key}>
            <LegendDot style={{ background: item.color }} />
            <span>{item.label}</span>
          </LegendItem>
        ))}
      </LegendRow>
    </ChartWrapper>
  );
};

const formatChartDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
};

const DashboardPage = styled.div`
  width: 100%;
  padding: 22px 20px 26px;
  background: #f8f9fc;
  box-sizing: border-box;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;

  @media (max-width: 1280px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const StatCard = styled.div`
  position: relative;
  min-height: 132px;
  border-radius: 20px;
  background: ${({ $surface }) => $surface || "#fff"};
  padding: 18px 18px 16px;
  box-shadow: 0 10px 30px rgba(17, 38, 146, 0.06);
  border: 1px solid #eef1f7;
`;

const StatAccentLine = styled.div`
  position: absolute;
  top: 0;
  left: 18px;
  right: 18px;
  height: 4px;
  border-radius: 999px;
  background: ${({ $accent }) => $accent};
`;

const StatLabel = styled.div`
  color: #6f7793;
  font-size: 15px;
  font-weight: 500;
`;

const StatValue = styled.div`
  margin-top: 20px;
  color: ${({ $accent }) => $accent || "#252a3d"};
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
`;

const StatHint = styled.div`
  margin-top: 10px;
  color: #7f8aa8;
  font-size: 12px;
  max-width: 190px;
`;

const StatIconTile = styled.div`
  position: absolute;
  right: 18px;
  bottom: 18px;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: ${({ $background }) => $background || "#edf5ff"};
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 22px;
    height: 22px;
    color: ${({ $accent }) => $accent || "#2480f2"};
  }
`;

const DashboardColumns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(320px, 0.95fr);
  gap: 12px;
  align-items: start;

  @media (max-width: 1280px) {
    grid-template-columns: 1fr;
  }
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Panel = styled.section`
  border-radius: 24px;
  background: #fff;
  padding: 18px 18px 16px;
  box-shadow: 0 12px 35px rgba(17, 38, 146, 0.05);
  border: 1px solid #eef1f7;
`;

const PriorityPanel = styled(Panel)`
  display: flex;
  flex-direction: column;
  min-height: ${({ $compact }) => ($compact ? "460px" : "560px")};
`;

const InsightPanel = styled(Panel)`
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #ffffff 0%, #fafcff 100%);
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
`;

const PanelTitle = styled.h2`
  margin: 0;
  color: #24315e;
  font-size: 17px;
  font-weight: 700;
`;

const PanelDescription = styled.p`
  margin: 6px 0 0;
  color: #75809e;
  font-size: 13px;
  line-height: 1.5;
`;

const InsightDescription = styled.p`
  margin: 6px 0 14px;
  color: #75809e;
  font-size: 13px;
  line-height: 1.5;
`;

const HeaderActionButton = styled.button`
  border: 1.5px solid #263765;
  border-radius: 999px;
  background: #fff;
  color: #263765;
  font-size: 13px;
  font-weight: 600;
  padding: 10px 14px;
  cursor: pointer;
  white-space: nowrap;
`;

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eef1f7;
`;

const FilterTab = styled.button`
  border: 1px solid ${({ $active }) => ($active ? "#2480f2" : "#dde3f1")};
  background: ${({ $active }) => ($active ? "#eef5ff" : "#fff")};
  color: ${({ $active }) => ($active ? "#2480f2" : "#5f6985")};
  border-radius: 999px;
  padding: 9px 14px;
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  cursor: pointer;
`;

const PriorityTableWrapper = styled.div`
  flex: 1;
  min-height: 380px;
  overflow-x: auto;
  display: flex;
  align-items: flex-start;
`;

const PriorityTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 920px;

  thead th {
    background: #f5f7fc;
    color: #7d86a2;
    font-size: 13px;
    font-weight: 500;
    text-align: left;
    padding: 14px;
  }

  thead th:first-child {
    border-top-left-radius: 14px;
  }

  thead th:last-child {
    border-top-right-radius: 14px;
  }

  tbody td {
    padding: 14px;
    border-bottom: 1px solid #eef1f7;
    color: #2d3557;
    font-size: 14px;
    vertical-align: middle;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
`;

const RoleBadge = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
  color: ${({ $role }) => ($role === "INDIVIDUAL" ? "#197d49" : "#2356c8")};
  background: ${({ $role }) => ($role === "INDIVIDUAL" ? "#ebf9ef" : "#eef5ff")};
`;

const WorkflowBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  background: ${({ $status }) => WORKFLOW_STYLES[$status]?.background || "#eef5ff"};
  color: ${({ $status }) => WORKFLOW_STYLES[$status]?.color || "#2480f2"};
`;

const InlineActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  color: #2a79e5;
  font-weight: 600;
  cursor: pointer;

  img {
    width: 16px;
    height: 16px;
  }
`;

const MixCardGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MixCard = styled.div`
  padding: 14px 14px 16px;
  border-radius: 16px;
  background: linear-gradient(180deg, #fbfcff 0%, #f4f7fd 100%);
  border: 1px solid #eef1f7;
`;

const MixHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
  color: #2d3557;
  font-size: 14px;

  strong {
    font-size: 16px;
  }
`;

const MixBarTrack = styled.div`
  height: 12px;
  border-radius: 999px;
  background: #e9edf6;
  overflow: hidden;
`;

const MixBarFill = styled.div`
  height: 100%;
  width: ${({ $width }) => $width}%;
  background: ${({ $color }) =>
    `linear-gradient(90deg, ${$color} 0%, ${$color}cc 100%)`};
  border-radius: 999px;
`;

const InsightList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const InsightListItem = styled.button`
  border: 1px solid #eef1f7;
  background: #fff;
  border-radius: 16px;
  padding: 12px 14px;
  text-align: left;
  cursor: pointer;
  transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease;

  &:hover {
    border-color: #dbe3f3;
    box-shadow: 0 8px 24px rgba(17, 38, 146, 0.07);
    transform: translateY(-1px);
  }
`;

const InsightTopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;

  strong {
    color: #24315e;
    font-size: 14px;
  }
`;

const InsightBodyText = styled.div`
  color: #4d597a;
  font-size: 13px;
  margin-bottom: 10px;
`;

const InsightMetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const RoleChip = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 5px 9px;
  font-size: 11px;
  font-weight: 700;
  color: ${({ $role }) => ($role === "INDIVIDUAL" ? "#197d49" : "#2356c8")};
  background: ${({ $role }) => ($role === "INDIVIDUAL" ? "#ebf9ef" : "#eef5ff")};
`;

const WorkflowChip = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 5px 9px;
  font-size: 11px;
  font-weight: 700;
  background: ${({ $status }) => WORKFLOW_STYLES[$status]?.background || "#eef5ff"};
  color: ${({ $status }) => WORKFLOW_STYLES[$status]?.color || "#2480f2"};
`;

const SmallEmptyState = styled.div`
  min-height: 112px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #8a93ac;
  font-size: 13px;
  border-radius: 16px;
  background: linear-gradient(180deg, #fbfcff 0%, #f5f8fd 100%);
  border: 1px dashed #dce3f1;
`;

const DonutSection = styled.div`
  display: grid;
  grid-template-columns: 220px 1fr;
  align-items: center;
  gap: 16px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
    justify-items: center;
  }
`;

const DonutContainer = styled.div`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  background: ${({ $gradient }) => $gradient};
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DonutHoverSvg = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
`;

const DonutCenter = styled.div`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #2d3557;
  box-shadow: inset 0 0 0 1px #f2f4f9;

  small {
    color: #9098b0;
    font-size: 14px;
  }

  strong {
    font-size: 36px;
    line-height: 1.1;
  }
`;

const LegendList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const LegendRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 6px;
  color: #717c98;
  font-size: 12px;
`;

const LegendItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #717c98;
  font-size: 13px;
`;

const LegendDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const ChartWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
`;

const ChartTooltip = styled.div`
  position: absolute;
  top: ${({ $top }) => $top}px;
  left: ${({ $left }) => $left}%;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 5;
  min-width: 120px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #1f2540;
  color: #fff;
  box-shadow: 0 8px 24px rgba(17, 24, 39, 0.18);
  font-size: 12px;
  white-space: nowrap;
`;

const TooltipDate = styled.div`
  font-weight: 700;
  margin-bottom: 6px;
  color: #fff;
`;

const TooltipRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  line-height: 1.6;
`;

const TooltipDot = styled.span`
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $color }) => $color};
`;

const TooltipLabel = styled.span`
  color: #c7cce0;
`;

const TooltipValue = styled.span`
  margin-left: auto;
  font-weight: 700;
  color: #fff;
`;

const DonutTooltip = styled.div`
  position: absolute;
  top: ${({ $top }) => $top}px;
  left: ${({ $left }) => $left}px;
  transform: translate(-50%, -120%);
  pointer-events: none;
  z-index: 5;
  padding: 8px 11px;
  border-radius: 10px;
  background: #1f2540;
  color: #fff;
  box-shadow: 0 8px 24px rgba(17, 24, 39, 0.18);
  font-size: 12px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DropdownStub = styled.div`
  border: 1px solid #d9e0ef;
  border-radius: 10px;
  padding: 6px 10px;
  color: #3a4567;
  font-size: 12px;
  background: #fff;
`;

const VarianceCell = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: ${({ $positive }) => ($positive ? "#14a44d" : "#ef3d35")};
  font-weight: 600;
`;

const VarianceTriangle = styled.span`
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: ${({ $positive }) =>
    $positive ? "8px solid #14a44d" : "0 solid transparent"};
  border-top: ${({ $positive }) =>
    $positive ? "0 solid transparent" : "8px solid #ef3d35"};
`;

const VarianceText = styled.span`
  color: ${({ $positive }) => ($positive ? "#14a44d" : "#ef3d35")};
  font-weight: 700;
  font-size: 13px;
`;

const EmptyBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 240px;
  padding: 36px 18px 18px;
  color: #7d86a2;

  img {
    width: 120px;
    opacity: 0.88;
  }
`;

const CenteredState = styled.div`
  min-height: calc(100vh - 160px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6f7793;
  font-size: 16px;
`;

const BriefcaseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M7.5 6.5V5.5C7.5 4.4 8.4 3.5 9.5 3.5H14.5C15.6 3.5 16.5 4.4 16.5 5.5V6.5"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    <rect
      x="4"
      y="6.5"
      width="16"
      height="12"
      rx="2.5"
      stroke="currentColor"
      strokeWidth="1.7"
    />
    <path
      d="M4 11.5H20"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

const DocumentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M8 4.5H13.5L17.5 8.5V19.5H8C6.9 19.5 6 18.6 6 17.5V6.5C6 5.4 6.9 4.5 8 4.5Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path d="M13 4.5V9H17.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M9 12H14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M9 15H14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const AdjustmentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M6 7.5H18"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    <path
      d="M6 12H14"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    <path
      d="M6 16.5H11"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    <circle cx="17.5" cy="15.5" r="3" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

const WalletIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M5.5 7.5C5.5 6.4 6.4 5.5 7.5 5.5H17.5C18.6 5.5 19.5 6.4 19.5 7.5V16.5C19.5 17.6 18.6 18.5 17.5 18.5H7.5C6.4 18.5 5.5 17.6 5.5 16.5V7.5Z"
      stroke="currentColor"
      strokeWidth="1.7"
    />
    <path
      d="M5.5 9.5H16.5C17.6 9.5 18.5 10.4 18.5 11.5V12.5C18.5 13.6 17.6 14.5 16.5 14.5H5.5"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <circle cx="15.7" cy="12" r="0.9" fill="currentColor" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
    <path
      d="M8.5 12.3L11 14.8L15.7 10.1"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default CustomsDashboard;
