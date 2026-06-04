import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import eyeSVG from "../../assets/eye.svg";
import noDeclarations from "../../assets/noDeclarations.png";
import { fetchCustomsDashboard } from "../../functions/customs";
import { STATUS_STYLES, StatusBadge, StatusIcon } from "../statusBadge";

const SERIES_COLORS = {
  submittedCount: "#7b61ff",
  approvedCount: "#ffb648",
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

const RECENT_FILTERS = [
  { key: "PENDING_REVIEWS", label: "Pending Reviews" },
  { key: "UNDER_REVIEW", label: "Under Review" },
  { key: "AWAITING_PAYMENT", label: "Awaiting Payment" },
  { key: "APPROVED", label: "Approved" },
  { key: "PAID", label: "Paid" },
  { key: "DECLINED", label: "Rejected" },
];

const CustomsDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [recentFilter, setRecentFilter] = useState("PENDING_REVIEWS");

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

  const filteredRecentDeclarations = useMemo(() => {
    const recentDeclarations = dashboard?.recentDeclarations || [];
    return recentDeclarations.filter((row) =>
      matchesRecentFilter(getDisplayStatus(row), recentFilter)
    );
  }, [dashboard, recentFilter]);

  const statusBreakdown = dashboard?.declarationStatusBreakdown || [];
  const totalDeclarations =
    dashboard?.totalDeclarations ||
    statusBreakdown.reduce((sum, item) => sum + Number(item.count || 0), 0);

  const openDeclarationsPage = () => {
    navigate("/profile/role_customs/Declaration");
  };

  const openDeclaration = (row) => {
    navigate("/profile/role_customs/Declaration", {
      state: {
        declarationType: row.declarationType || "IMPORTER",
        declarationId: row.id,
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
            <StatCard>
              <StatLabel>{t("Under Review")}</StatLabel>
              <StatValue>{dashboard.underReviewCount || 0}</StatValue>
              <StatIconTile>
                <BriefcaseIcon />
              </StatIconTile>
            </StatCard>
            <StatCard>
              <StatLabel>{t("Approved")}</StatLabel>
              <StatValue>{dashboard.approvedCount || 0}</StatValue>
              <StatIconTile>
                <DocumentIcon />
              </StatIconTile>
            </StatCard>
            <StatCard>
              <StatLabel>{t("Rejected")}</StatLabel>
              <StatValue>{dashboard.declinedCount || 0}</StatValue>
              <StatIconTile>
                <UsersIcon />
              </StatIconTile>
            </StatCard>
            <StatCard>
              <StatLabel>{t("Paid")}</StatLabel>
              <StatValue>{dashboard.paidCount || 0}</StatValue>
              <StatIconTile>
                <BriefcaseIcon />
              </StatIconTile>
            </StatCard>
            <StatCard>
              <StatLabel>{t("Closed")}</StatLabel>
              <StatValue>{dashboard.closedCount || 0}</StatValue>
              <StatIconTile>
                <BriefcaseIcon />
              </StatIconTile>
            </StatCard>
          </StatsGrid>

          <MiddleGrid>
            <Panel>
              <PanelTitle>{t("Customs_DashboardStatusBreakdown")}</PanelTitle>
              <DonutSection>
                <DonutChart
                  total={totalDeclarations}
                  slices={statusBreakdown.map((slice) => ({
                    label: t(formatStatusLabel(slice.status)),
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
                      <span>{t(formatStatusLabel(slice.status))}</span>
                    </LegendItem>
                  ))}
                </LegendList>
              </DonutSection>
            </Panel>

            <Panel>
              <PanelHeader>
                <PanelTitle>{t("Customs_DashboardOverTime")}</PanelTitle>
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
                    key: "approvedCount",
                    label: t("Approved"),
                    color: SERIES_COLORS.approvedCount,
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

            <SidePanel>
              <PanelTitle>{t("Customs_DashboardTopImporters")}</PanelTitle>
              <TopList>
                {(dashboard.topImporters || []).map((item) => (
                  <TopListRow key={item.importerName}>
                    <span>{item.importerName}</span>
                    <strong>{formatInteger(item.declarationsCount)}</strong>
                  </TopListRow>
                ))}
              </TopList>
              <OutlineButton type="button" onClick={openDeclarationsPage}>
                {t("View All Importers")}
              </OutlineButton>
            </SidePanel>
          </MiddleGrid>

          <BottomGrid>
            <RecentDeclarationsPanel>
              <PanelTitle>{t("Customs_DashboardRecentDeclarations")}</PanelTitle>
              <TabRow>
                {RECENT_FILTERS.map((filter) => (
                  <FilterTab
                    key={filter.key}
                    type="button"
                    $active={recentFilter === filter.key}
                    onClick={() => setRecentFilter(filter.key)}
                  >
                    {t(filter.label)}
                  </FilterTab>
                ))}
              </TabRow>

              {filteredRecentDeclarations.length === 0 ? (
                <EmptyBlock>
                  <img src={noDeclarations} alt="No declarations" />
                  <span>{t("Customs_NoDeclarationsSubtitle")}</span>
                </EmptyBlock>
              ) : (
                <RecentTableWrapper>
                  <RecentTable>
                    <thead>
                      <tr>
                        <th>{t("Importer")}</th>
                        <th>{t("Declaration Nbr.")}</th>
                        <th>{t("Declaration Date")}</th>
                        <th>{t("Devices Count")}</th>
                        <th>{t("Declared Total (USD)")}</th>
                        <th>{t("Estimated Value (USD)")}</th>
                        <th>{t("Variance")}</th>
                        <th>{t("Price Source")}</th>
                        <th>{t("Status")}</th>
                        <th>{t("Actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecentDeclarations.map((row) => {
                        const displayStatus = getDisplayStatus(row);
                        return (
                          <tr key={`${row.declarationType}-${row.id}`}>
                            <td>{row.submitterName}</td>
                            <td>{row.declarationNumber}</td>
                            <td>{formatDate(row.declarationDate)}</td>
                            <td>{row.devicesCount}</td>
                            <td>{formatMoney(row.declaredTotalUsd)}</td>
                            <td>
                              <AdjustedEstimatedValue row={row} />
                            </td>
                            <td>
                              <VarianceValue value={Number(row.variancePercent || 0)} />
                            </td>
                            <td>{row.priceSource || "-"}</td>
                            <td>
                              <StatusBadge $status={displayStatus}>
                                <StatusIcon status={displayStatus} />
                                {t(formatStatusLabel(displayStatus))}
                              </StatusBadge>
                            </td>
                            <td>
                              <InlineActionButton
                                type="button"
                                onClick={() => openDeclaration(row)}
                              >
                                <img src={eyeSVG} alt="View details" />
                                {t("View Details")}
                              </InlineActionButton>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </RecentTable>
                </RecentTableWrapper>
              )}
            </RecentDeclarationsPanel>

            <RightColumn>
              <SidePanel>
                <PanelTitle>{t("Payment Status Overview")}</PanelTitle>
                <PaymentStatusLayout>
                  <DonutChart
                    total={
                      Number(dashboard.paidInvoicesCount || 0) +
                      Number(dashboard.unpaidInvoicesCount || 0)
                    }
                    size={180}
                    innerSize={102}
                    slices={[
                      {
                        label: t("Paid"),
                        value: Number(dashboard.paidInvoicesCount || 0),
                        color: "#7b61ff",
                      },
                      {
                        label: t("Unpaid"),
                        value: Number(dashboard.unpaidInvoicesCount || 0),
                        color: "#6ed39b",
                      },
                    ]}
                  />
                  <LegendList>
                    <LegendItem>
                      <LegendDot style={{ background: "#7b61ff" }} />
                      <span>{t("Paid")}</span>
                    </LegendItem>
                    <LegendItem>
                      <LegendDot style={{ background: "#6ed39b" }} />
                      <span>{t("Unpaid")}</span>
                    </LegendItem>
                  </LegendList>
                </PaymentStatusLayout>
              </SidePanel>

              <SidePanel>
                <PanelTitle>{t("Customs_DashboardHighVariance")}</PanelTitle>
                <TopList>
                  {(dashboard.highVarianceDeclarations || []).map((item) => (
                    <TopListRow key={`${item.declarationNumber}-${item.variancePercent}`}>
                      <span>{item.declarationNumber}</span>
                      <VarianceText $positive={Number(item.variancePercent || 0) >= 0}>
                        {formatVariance(item.variancePercent)}
                      </VarianceText>
                    </TopListRow>
                  ))}
                </TopList>
                <OutlineButton type="button" onClick={openDeclarationsPage}>
                  {t("View All Importers")}
                </OutlineButton>
              </SidePanel>
            </RightColumn>
          </BottomGrid>
        </>
      )}
    </DashboardPage>
  );
};

const matchesRecentFilter = (status, filter) => {
  if (filter === "PENDING_REVIEWS") {
    return status === "SUBMITTED" || status === "UNDER_REVIEW" || status === "PENDING_APPROVAL";
  }
  if (filter === "DECLINED") {
    return status === "DECLINED";
  }
  return status === filter;
};

const getDisplayStatus = (row) => {
  if (
    row?.declarationType === "IMPORTER" &&
    row?.status === "UNDER_REVIEW" &&
    row?.approvedPriceUsd != null &&
    row?.adjustmentReason?.trim()
  ) {
    return "PENDING_APPROVAL";
  }
  return row?.status;
};

const hasAdjustedApprovedValue = (row) =>
  row?.declarationType === "IMPORTER" &&
  row?.approvedPriceUsd != null &&
  Boolean(row?.adjustmentReason?.trim());

const AdjustedEstimatedValue = ({ row }) => {
  if (!hasAdjustedApprovedValue(row)) {
    return formatMoney(row?.estimatedValueUsd);
  }

  return (
    <AdjustedValueStack>
      <OriginalValueText>{formatMoney(row?.estimatedValueUsd)}</OriginalValueText>
      <AdjustedValueText>{formatMoney(row?.approvedPriceUsd)}</AdjustedValueText>
    </AdjustedValueStack>
  );
};

const formatStatusLabel = (status) => {
  if (status === "PENDING_APPROVAL") return "Pending Approval";
  if (status === "DECLINED") return "Rejected";
  if (status === "CLOSED") return "Closed";
  return status
    ?.replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

const VarianceValue = ({ value }) => {
  const positive = value >= 0;
  return (
    <VarianceCell $positive={positive}>
      <span>{`${positive ? "" : "-"}${Math.abs(value).toFixed(2)}%`}</span>
      <VarianceTriangle $positive={positive} />
    </VarianceCell>
  );
};

const DonutChart = ({ slices, total, size = 220, innerSize = 122 }) => {
  const normalizedSlices = slices.filter((slice) => Number(slice.value) > 0);
  const gradient = buildConicGradient(normalizedSlices);

  return (
    <DonutContainer $size={size} $gradient={gradient}>
      <DonutCenter $size={innerSize}>
        <small>Total</small>
        <strong>{formatInteger(total)}</strong>
      </DonutCenter>
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

  return (
    <ChartWrapper>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="250">
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
      </svg>

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
  min-height: 112px;
  border-radius: 20px;
  background: #fff;
  padding: 18px 18px 16px;
  box-shadow: 0 10px 30px rgba(17, 38, 146, 0.06);
  border: 1px solid #eef1f7;
`;

const StatLabel = styled.div`
  color: #6f7793;
  font-size: 15px;
  font-weight: 500;
`;

const StatValue = styled.div`
  margin-top: 26px;
  color: #252a3d;
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
`;

const StatIconTile = styled.div`
  position: absolute;
  right: 18px;
  bottom: 18px;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #edf5ff;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 22px;
    height: 22px;
    color: #2480f2;
  }
`;

const MiddleGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.35fr) minmax(0, 0.8fr);
  gap: 12px;
  margin-bottom: 12px;

  @media (max-width: 1280px) {
    grid-template-columns: 1fr;
  }
`;

const BottomGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(320px, 0.75fr);
  gap: 12px;
  align-items: stretch;

  @media (max-width: 1280px) {
    grid-template-columns: 1fr;
  }
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

const SidePanel = styled(Panel)`
  display: flex;
  flex-direction: column;
`;

const RecentDeclarationsPanel = styled(Panel)`
  display: flex;
  flex-direction: column;
  min-height: 520px;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const PanelTitle = styled.h2`
  margin: 0 0 14px;
  color: #24315e;
  font-size: 17px;
  font-weight: 700;
`;

const DropdownStub = styled.div`
  border: 1px solid #d9e0ef;
  border-radius: 10px;
  padding: 6px 10px;
  color: #3a4567;
  font-size: 12px;
  background: #fff;
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

const PaymentStatusLayout = styled.div`
  display: grid;
  grid-template-columns: 180px 1fr;
  align-items: center;
  gap: 12px;

  @media (max-width: 600px) {
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
`;

const TopList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 18px;
`;

const TopListRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: #2d3557;
  font-size: 14px;

  span:first-child {
    min-width: 0;
    flex: 1;
  }

  strong {
    font-size: 16px;
  }
`;

const OutlineButton = styled.button`
  width: 100%;
  min-height: 48px;
  border-radius: 999px;
  border: 1.5px solid #263765;
  background: #fff;
  color: #263765;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: auto;
`;

const TabRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid #eef1f7;
  padding-bottom: 8px;
`;

const FilterTab = styled.button`
  background: transparent;
  border: none;
  padding: 0 0 8px;
  color: ${({ $active }) => ($active ? "#2480f2" : "#6f7793")};
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  cursor: pointer;
  border-bottom: 2px solid ${({ $active }) => ($active ? "#2480f2" : "transparent")};
`;

const RecentTableWrapper = styled.div`
  flex: 1;
  min-height: 360px;
  overflow-x: auto;
  display: flex;
`;

const RecentTable = styled.table`
  width: 100%;
  min-height: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 980px;

  thead th {
    background: #f5f7fc;
    color: #7d86a2;
    font-size: 13px;
    font-weight: 500;
    text-align: left;
    padding: 14px 14px;
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
`;

const EmptyBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 360px;
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

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="16" cy="10" r="2" stroke="currentColor" strokeWidth="1.7" />
    <path
      d="M5.5 17.5C5.9 15.7 7.3 14.5 9 14.5C10.7 14.5 12.1 15.7 12.5 17.5"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    <path
      d="M13.5 17.5C13.9 16.1 15 15.2 16.3 15.2C17.5 15.2 18.6 16 19 17.2"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

export default CustomsDashboard;
