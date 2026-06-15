import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import {
  approveTacPriceChangeRequest,
  fetchTacInfo,
  fetchTacPriceChangeRequests,
  rejectTacPriceChangeRequest,
} from "../../functions/admin";
import {
  fetchCustomsTacInfo,
  fetchCustomsTacPriceRequests,
  submitCustomsTacPriceRequest,
} from "../../functions/customs";
import { formatCount } from "../../functions/format";
import searchSVG from "../../assets/search3.svg";
import chevronSVG from "../../assets/chevron-down.svg";
import { Context } from "../../Context";
import { ROLE_ADMIN, ROLE_CUSTOMS } from "../../config/roles";

const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;
const DEFAULT_SORT = {
  sortBy: "tacNumber",
  sortDirection: "asc",
};
const CUSTOMS_COLUMNS = [
  { key: "tacNumber", labelKey: "TacInfo_TAC" },
  { key: "brand", labelKey: "Brand" },
  { key: "model", labelKey: "Model" },
  { key: "deviceType", labelKey: "TacInfo_DeviceType" },
  { key: "technology", labelKey: "Technology" },
  { key: "imeiQuantitySupport", labelKey: "TacInfo_IMEISupport" },
  { key: "simSlot", labelKey: "TacInfo_SIMSlots" },
  { key: "cfi", labelKey: "TacInfo_EstimatedValue" },
  { key: "requestStatus", labelKey: "TacInfo_RequestStatus" },
];
const ADMIN_COLUMNS = CUSTOMS_COLUMNS.filter(
  (column) => column.key !== "requestStatus"
);

const TacInfo = () => {
  const { t } = useTranslation();
  const { accountType } = useContext(Context);
  const isAdmin = accountType === ROLE_ADMIN;
  const isCustoms = accountType === ROLE_CUSTOMS;

  const [records, setRecords] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [sortBy, setSortBy] = useState(DEFAULT_SORT.sortBy);
  const [sortDirection, setSortDirection] = useState(
    DEFAULT_SORT.sortDirection
  );
  const [editingTacNumber, setEditingTacNumber] = useState("");
  const [draftValue, setDraftValue] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [busyId, setBusyId] = useState("");
  const tacInfoRequestIdRef = useRef(0);

  const loadTacInfo = useCallback(async () => {
    const requestId = tacInfoRequestIdRef.current + 1;
    tacInfoRequestIdRef.current = requestId;

    const data = isAdmin
      ? await fetchTacInfo(
          currentPage,
          pageSize,
          setTotalElements,
          appliedSearch,
          sortBy,
          sortDirection
        )
      : await fetchCustomsTacInfo(
          currentPage,
          pageSize,
          setTotalElements,
          appliedSearch,
          sortBy,
          sortDirection
        );

    if (requestId !== tacInfoRequestIdRef.current) {
      return;
    }

    setRecords(data || []);
  }, [appliedSearch, currentPage, isAdmin, pageSize, sortBy, sortDirection]);

  const loadRequests = useCallback(async () => {
    const data = isAdmin
      ? await fetchTacPriceChangeRequests()
      : await fetchCustomsTacPriceRequests();
    setRequests(Array.isArray(data) ? data : []);
  }, [isAdmin]);

  useEffect(() => {
    loadTacInfo();
  }, [loadTacInfo]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setAppliedSearch(searchQuery.trim());
    }, 250);

    return () => window.clearTimeout(timerId);
  }, [searchQuery]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    if (currentPage !== 0) {
      setCurrentPage(0);
    }
  };

  const latestRequestsByTac = useMemo(() => {
    return requests.reduce((accumulator, request) => {
      if (!accumulator[request.tacNumber]) {
        accumulator[request.tacNumber] = request;
      }
      return accumulator;
    }, {});
  }, [requests]);

  const pageStart = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const pageEnd =
    totalElements === 0
      ? 0
      : Math.min((currentPage + 1) * pageSize, totalElements);

  const panelTitle = isAdmin
    ? t("TacInfo_ReviewTitle")
    : t("TacInfo_RequestTitle");
  const panelSubtext = isAdmin
    ? t("TacInfo_ReviewSubtext")
    : t("TacInfo_RequestSubtext");

  const handlePageSizeChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    if (!Number.isNaN(newSize) && newSize > 0) {
      setPageSize(newSize);
      setCurrentPage(0);
    }
  };

  const startEditing = (record) => {
    setEditingTacNumber(record.tacNumber);
    setDraftValue(record.cfi || "");
    setFeedback({ type: "", message: "" });
  };

  const stopEditing = () => {
    setEditingTacNumber("");
    setDraftValue("");
  };

  const validateDraftValue = () => {
    const trimmedValue = draftValue.trim();
    if (!PRICE_PATTERN.test(trimmedValue)) {
      setFeedback({
        type: "error",
        message: t("TacInfo_InvalidEstimatedValue"),
      });
      return null;
    }

    return trimmedValue;
  };

  const handleSubmitRequest = async (record) => {
    const normalizedValue = validateDraftValue();
    if (!normalizedValue) {
      return;
    }

    setBusyId(record.tacNumber);
    const result = await submitCustomsTacPriceRequest(
      record.tacNumber,
      normalizedValue
    );
    setBusyId("");

    if (!result.success) {
      setFeedback({
        type: "error",
        message: result.error || t("TacInfo_RequestError"),
      });
      return;
    }

    stopEditing();
    setFeedback({
      type: "success",
      message: t("TacInfo_RequestSuccess"),
    });
    await Promise.all([loadTacInfo(), loadRequests()]);
  };

  const handleReviewRequest = async (requestId, action) => {
    setBusyId(String(requestId));
    const result =
      action === "approve"
        ? await approveTacPriceChangeRequest(requestId)
        : await rejectTacPriceChangeRequest(requestId);
    setBusyId("");

    if (!result.success) {
      setFeedback({
        type: "error",
        message: result.error || t("TacInfo_ReviewError"),
      });
      return;
    }

    setFeedback({
      type: "success",
      message:
        action === "approve"
          ? t("TacInfo_ApproveSuccess")
          : t("TacInfo_RejectSuccess"),
    });
    await Promise.all([loadTacInfo(), loadRequests()]);
  };

  const renderCustomsStatus = (record) => {
    const latestRequest = latestRequestsByTac[record.tacNumber];
    const requestStatus = record.requestStatus || latestRequest?.status;
    const requestedCfi = record.requestedCfi || latestRequest?.requestedCfi;

    if (!requestStatus) {
      return <MutedText>{t("TacInfo_NoRequest")}</MutedText>;
    }

    return (
      <StatusStack>
        <StatusBadge $status={requestStatus}>
          {t(`TacInfo_Status_${requestStatus}`)}
        </StatusBadge>
        <StatusMeta>
          {t("TacInfo_RequestedValueShort")}: {requestedCfi}
        </StatusMeta>
      </StatusStack>
    );
  };

  const handleSort = (columnKey) => {
    setCurrentPage(0);

    if (sortBy === columnKey) {
      setSortDirection((currentDirection) =>
        currentDirection === "asc" ? "desc" : "asc"
      );
      return;
    }

    setSortBy(columnKey);
    setSortDirection("asc");
  };

  const renderSortHeader = ({ key, labelKey }) => (
    <TableHeaderButton type="button" onClick={() => handleSort(key)}>
      <span>{t(labelKey)}</span>
      <SortIcon
        src={chevronSVG}
        alt=""
        aria-hidden="true"
        $active={sortBy === key}
        $direction={sortBy === key ? sortDirection : "desc"}
      />
    </TableHeaderButton>
  );

  const tableColSpan = isCustoms ? 10 : 8;
  const columns = isCustoms ? CUSTOMS_COLUMNS : ADMIN_COLUMNS;

  return (
    <TacInfoContainer>
      <Title>{t("TacInfo_Title")}</Title>
      <Subtext>{t("TacInfo_Subtext")}</Subtext>

      <Card>
        <Panel>
          <PanelHeader>
            <PanelTitle>{panelTitle}</PanelTitle>
            <PanelSubtext>{panelSubtext}</PanelSubtext>
          </PanelHeader>

          {feedback.message ? (
            <FeedbackBanner $type={feedback.type}>{feedback.message}</FeedbackBanner>
          ) : null}

          {isAdmin ? (
            requests.length > 0 ? (
              <RequestList>
                {requests.map((request) => (
                  <RequestCard key={request.id}>
                    <RequestSummary>
                      <RequestTitle>
                        {request.tacNumber} • {request.brand || "-"} {request.model || ""}
                      </RequestTitle>
                      <RequestMeta>
                        {request.requestedByName || "-"} • {t("TacInfo_CurrentValue")}:{" "}
                        {request.currentCfi || "-"} • {t("TacInfo_RequestedValue")}:{" "}
                        {request.requestedCfi || "-"}
                      </RequestMeta>
                    </RequestSummary>
                    <RequestActions>
                      <ActionButton
                        type="button"
                        onClick={() => handleReviewRequest(request.id, "approve")}
                        disabled={busyId === String(request.id)}
                      >
                        {busyId === String(request.id)
                          ? t("Loading")
                          : t("TacInfo_Approve")}
                      </ActionButton>
                      <SecondaryActionButton
                        type="button"
                        onClick={() => handleReviewRequest(request.id, "reject")}
                        disabled={busyId === String(request.id)}
                      >
                        {t("TacInfo_Reject")}
                      </SecondaryActionButton>
                    </RequestActions>
                  </RequestCard>
                ))}
              </RequestList>
            ) : (
              <EmptyPanel>{t("TacInfo_NoPendingRequests")}</EmptyPanel>
            )
          ) : requests.length > 0 ? (
            <RequestSummaryBanner>
              <RequestSummaryText>
                {t("TacInfo_OpenRequestsCount", {
                  count: requests.filter((request) => request.status === "PENDING")
                    .length,
                })}
              </RequestSummaryText>
            </RequestSummaryBanner>
          ) : (
            <RequestSummaryBanner>
              <RequestSummaryText>{t("TacInfo_NoOpenRequests")}</RequestSummaryText>
            </RequestSummaryBanner>
          )}
        </Panel>

        <TopBar>
          <SearchBar>
            <SearchIcon src={searchSVG} alt="Search" />
            <SearchInput
              type="text"
              placeholder={t("TacInfo_SearchPlaceholder")}
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </SearchBar>

          <Pagination>
            <PageNumber>
              <span>
                {formatCount(pageStart)}
                {" - "}
                {formatCount(pageEnd)}
              </span>{" "}
              {t("Out of")} <span>{formatCount(totalElements)}</span>
            </PageNumber>
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
            </PaginationControls>
            <PageSize value={pageSize} onChange={handlePageSizeChange}>
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </PageSize>
          </Pagination>
        </TopBar>

        <TableWrapper>
          <Table>
            <thead>
              <TableRow>
                {columns.map((column) => (
                  <TableHeader key={column.key}>
                    {renderSortHeader(column)}
                  </TableHeader>
                ))}
                {isCustoms ? <TableHeader>{t("Actions")}</TableHeader> : null}
              </TableRow>
            </thead>
            <tbody>
              {records.length > 0 ? (
                records.map((record) => {
                  const latestRequest = latestRequestsByTac[record.tacNumber];
                  const hasPendingRequest =
                    (record.requestStatus || latestRequest?.status) ===
                    "PENDING";
                  const isEditing = editingTacNumber === record.tacNumber;

                  return (
                    <TableRow key={record.tacNumber}>
                      <TableCell>{record.tacNumber || "-"}</TableCell>
                      <TableCell>{record.brand || "-"}</TableCell>
                      <TableCell>{record.model || "-"}</TableCell>
                      <TableCell>{record.deviceType || "-"}</TableCell>
                      <TableCell>{record.technology || "-"}</TableCell>
                      <TableCell>{record.imeiQuantitySupport ?? "-"}</TableCell>
                      <TableCell>{record.simSlot ?? "-"}</TableCell>
                      <TableCell>{record.cfi || "-"}</TableCell>
                      {isCustoms ? (
                        <>
                          <TableCell>{renderCustomsStatus(record)}</TableCell>
                          <TableCell>
                            {isEditing ? (
                              <InlineEditor>
                                <InlineInput
                                  type="text"
                                  inputMode="decimal"
                                  value={draftValue}
                                  onChange={(event) =>
                                    setDraftValue(event.target.value)
                                  }
                                  placeholder={t("TacInfo_NewEstimatedValue")}
                                />
                                <InlineActions>
                                  <InlineButton
                                    type="button"
                                    onClick={() => handleSubmitRequest(record)}
                                    disabled={busyId === record.tacNumber}
                                  >
                                    {busyId === record.tacNumber
                                      ? t("Loading")
                                      : t("TacInfo_SubmitRequest")}
                                  </InlineButton>
                                  <InlineGhostButton
                                    type="button"
                                    onClick={stopEditing}
                                  >
                                    {t("Cancel")}
                                  </InlineGhostButton>
                                </InlineActions>
                              </InlineEditor>
                            ) : (
                              <InlineActions>
                                <InlineGhostButton
                                  type="button"
                                  onClick={() => startEditing(record)}
                                  disabled={hasPendingRequest}
                                >
                                  {hasPendingRequest
                                    ? t("TacInfo_PendingAdminReview")
                                    : t("TacInfo_RequestChange")}
                                </InlineGhostButton>
                              </InlineActions>
                            )}
                          </TableCell>
                        </>
                      ) : null}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <EmptyCell colSpan={tableColSpan}>
                    {t("No data available")}
                  </EmptyCell>
                </TableRow>
              )}
            </tbody>
          </Table>
        </TableWrapper>
      </Card>
    </TacInfoContainer>
  );
};

export default TacInfo;

const TacInfoContainer = styled.div`
  display: flex;
  width: 90%;
  min-height: calc(100vh - 75px);
  flex-direction: column;
  padding: 40px 0;
  align-items: start;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: #436c4d;
  margin-bottom: 10px;
`;

const Subtext = styled.p`
  font-size: 16px;
  margin-bottom: 30px;
`;

const Card = styled.div`
  display: flex;
  flex: 1;
  min-height: 520px;
  width: 100%;
  border-radius: 12px;
  border: 1px solid #eaebef;
  padding: 20px;
  flex-direction: column;
  gap: 20px;
  overflow: hidden;
`;

const Panel = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
  padding: 18px;
  border-radius: 12px;
  background: linear-gradient(180deg, #f9fbff 0%, #f5f8ff 100%);
  border: 1px solid #e4ebfa;
`;

const PanelHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const PanelTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #20294c;
`;

const PanelSubtext = styled.p`
  font-size: 14px;
  color: #697493;
  line-height: 1.5;
`;

const FeedbackBanner = styled.div`
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ $type }) => ($type === "success" ? "#1e8d4d" : "#d34b4b")};
  background: ${({ $type }) =>
    $type === "success" ? "rgba(30, 141, 77, 0.08)" : "rgba(211, 75, 75, 0.08)"};
  border: 1px solid
    ${({ $type }) =>
      $type === "success" ? "rgba(30, 141, 77, 0.16)" : "rgba(211, 75, 75, 0.16)"};
`;

const RequestList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const RequestCard = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #e4ebfa;
  background: #fff;
`;

const RequestSummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const RequestTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: #20294c;
`;

const RequestMeta = styled.p`
  font-size: 13px;
  color: #697493;
  line-height: 1.5;
`;

const RequestActions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const ActionButton = styled.button`
  border: none;
  border-radius: 999px;
  background: #436c4d;
  color: #fff;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SecondaryActionButton = styled(ActionButton)`
  background: #eef2fb;
  color: #20294c;
`;

const EmptyPanel = styled.div`
  padding: 28px 18px;
  border-radius: 12px;
  border: 1px dashed #d8dfef;
  background: rgba(255, 255, 255, 0.72);
  color: #8a95b5;
  text-align: center;
  font-size: 14px;
`;

const RequestSummaryBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px dashed #d8dfef;
  background: rgba(255, 255, 255, 0.72);
`;

const RequestSummaryText = styled.span`
  font-size: 14px;
  color: #5d6889;
`;

const TopBar = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  gap: 20px;
`;

const SearchBar = styled.div`
  width: 100%;
  max-width: 360px;
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

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-left: auto;
`;

const PageNumber = styled.span`
  font-size: 14px;
  color: #797f94;

  span {
    font-weight: 700;
  }
`;

const PaginationControls = styled.div`
  display: flex;
  gap: 10px;
`;

const PageSize = styled.select`
  height: 36px;
  padding: 0 10px;
  border: 1px solid #d4d6df;
  border-radius: 8px;
  background: #fff;
  color: #20294c;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  outline: none;
`;

const TableWrapper = styled.div`
  width: 100%;
  flex: 1;
  min-height: 360px;
  overflow: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Table = styled.table`
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
`;

const TableRow = styled.tr`
  &:hover {
    background-color: #f5f6fa;
  }
`;

const TableHeader = styled.th`
  background-color: #f5f6fa;
  color: #797f94;
  font-weight: 500;
  text-align: left;
  padding: 12px;
  font-size: 14px;
`;

const TableHeaderButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  padding: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
`;

const SortIcon = styled.img`
  width: 14px;
  height: 14px;
  opacity: ${({ $active }) => ($active ? 1 : 0.35)};
  transform: ${({ $direction }) =>
    $direction === "asc" ? "rotate(180deg)" : "rotate(0deg)"};
`;

const TableCell = styled.td`
  padding: 15px;
  border-bottom: 1px solid #eaebef;
  text-align: left;
  font-size: 14px;
  vertical-align: middle;
  color: #20294c;
`;

const EmptyCell = styled(TableCell)`
  color: #797f94;
`;

const MutedText = styled.span`
  color: #8b94ad;
  font-size: 13px;
`;

const StatusStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const StatusBadge = styled.span`
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ $status }) =>
    $status === "APPROVED"
      ? "#1e8d4d"
      : $status === "REJECTED"
      ? "#d34b4b"
      : "#c57b19"};
  background: ${({ $status }) =>
    $status === "APPROVED"
      ? "rgba(30, 141, 77, 0.12)"
      : $status === "REJECTED"
      ? "rgba(211, 75, 75, 0.12)"
      : "rgba(197, 123, 25, 0.12)"};
`;

const StatusMeta = styled.span`
  color: #697493;
  font-size: 12px;
`;

const InlineEditor = styled.div`
  display: flex;
  min-width: 240px;
  flex-direction: column;
  gap: 10px;
`;

const InlineInput = styled.input`
  width: 100%;
  border: 1px solid #d4d6df;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  color: #20294c;
  outline: none;

  &:focus {
    border-color: #436c4d;
  }
`;

const InlineActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`;

const InlineButton = styled.button`
  border: none;
  border-radius: 999px;
  background: #20294c;
  color: #fff;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const InlineGhostButton = styled.button`
  border: 1px solid #d4d6df;
  border-radius: 999px;
  background: #fff;
  color: #20294c;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
