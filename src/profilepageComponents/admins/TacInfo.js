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

const PRICE_PATTERN = /^(?!0+(?:\.0{1,2})?$)\d{1,12}(\.\d{1,2})?$/;
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

const parsePrice = (value) => {
  const numericValue = Number.parseFloat(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const formatPrice = (value) => {
  const numericValue = parsePrice(value);
  if (numericValue === null) {
    return "-";
  }
  return numericValue.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const getPriceDifference = (currentValue, requestedValue) => {
  const current = parsePrice(currentValue);
  const requested = parsePrice(requestedValue);

  if (current === null || requested === null) {
    return null;
  }

  const amount = requested - current;
  const percentage = current === 0 ? null : (amount / current) * 100;
  const sign = amount > 0 ? "+" : "";

  return {
    amount,
    label: `${sign}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`,
    percentage:
      percentage === null
        ? ""
        : `${sign}${percentage.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}%`,
    tone: amount > 0 ? "increase" : amount < 0 ? "decrease" : "neutral",
  };
};

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
  const [requestRecord, setRequestRecord] = useState(null);
  const [draftValue, setDraftValue] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [requestError, setRequestError] = useState("");
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
    setRequestRecord(record);
    setDraftValue("");
    setRequestReason("");
    setRequestError("");
    setFeedback({ type: "", message: "" });
  };

  const stopEditing = () => {
    setRequestRecord(null);
    setDraftValue("");
    setRequestReason("");
    setRequestError("");
  };

  const validateDraftValue = () => {
    const trimmedValue = draftValue.trim();
    if (!PRICE_PATTERN.test(trimmedValue)) {
      setRequestError(t("TacInfo_InvalidEstimatedValue"));
      return null;
    }

    return trimmedValue;
  };

  const handleSubmitRequest = async () => {
    if (!requestRecord) {
      return;
    }

    const normalizedValue = validateDraftValue();
    if (!normalizedValue) {
      return;
    }

    const normalizedReason = requestReason.trim();
    if (!normalizedReason) {
      setRequestError(t("TacInfo_ReasonRequired"));
      return;
    }

    setRequestError("");
    setBusyId(requestRecord.tacNumber);
    const result = await submitCustomsTacPriceRequest(
      requestRecord.tacNumber,
      normalizedValue,
      normalizedReason
    );
    setBusyId("");

    if (!result.success) {
      setRequestError(result.error || t("TacInfo_RequestError"));
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
          {t("TacInfo_RequestedValueShort")}: {formatPrice(requestedCfi)}
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
  const requestDifference = requestRecord
    ? getPriceDifference(requestRecord.cfi, draftValue)
    : null;

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
                {requests.map((request) => {
                  const difference = getPriceDifference(
                    request.currentCfi,
                    request.requestedCfi
                  );

                  return (
                    <RequestCard key={request.id}>
                      <RequestSummary>
                        <RequestTitle>
                          {request.tacNumber} • {request.brand || "-"}{" "}
                          {request.model || ""}
                        </RequestTitle>
                        <RequestMeta>
                          {t("TacInfo_RequestedBy")}:{" "}
                          {request.requestedByName || "-"}
                        </RequestMeta>
                        <ValueComparison>
                          <ValueBlock>
                            <ValueLabel>{t("TacInfo_CurrentValue")}</ValueLabel>
                            <ValueAmount>{formatPrice(request.currentCfi)}</ValueAmount>
                          </ValueBlock>
                          <ValueArrow aria-hidden="true">-&gt;</ValueArrow>
                          <ValueBlock>
                            <ValueLabel>{t("TacInfo_RequestedValue")}</ValueLabel>
                            <ValueAmount>{formatPrice(request.requestedCfi)}</ValueAmount>
                          </ValueBlock>
                          {difference ? (
                            <DeltaBadge $tone={difference.tone}>
                              {difference.label}
                              {difference.percentage
                                ? ` (${difference.percentage})`
                                : ""}
                            </DeltaBadge>
                          ) : null}
                        </ValueComparison>
                        <ReasonBox>
                          <ReasonLabel>{t("TacInfo_Reason")}</ReasonLabel>
                          <ReasonText>{request.reason || "-"}</ReasonText>
                        </ReasonBox>
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
                  );
                })}
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

                  return (
                    <TableRow key={record.tacNumber}>
                      <TableCell>{record.tacNumber || "-"}</TableCell>
                      <TableCell>{record.brand || "-"}</TableCell>
                      <TableCell>{record.model || "-"}</TableCell>
                      <TableCell>{record.deviceType || "-"}</TableCell>
                      <TableCell>{record.technology || "-"}</TableCell>
                      <TableCell>{record.imeiQuantitySupport ?? "-"}</TableCell>
                      <TableCell>{record.simSlot ?? "-"}</TableCell>
                      <TableCell>{formatPrice(record.cfi)}</TableCell>
                      {isCustoms ? (
                        <>
                          <TableCell>{renderCustomsStatus(record)}</TableCell>
                          <TableCell>
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

      {isCustoms && requestRecord ? (
        <ModalOverlay>
          <RequestModal role="dialog" aria-modal="true">
            <ModalHeader>
              <div>
                <ModalTitle>{t("TacInfo_RequestModalTitle")}</ModalTitle>
                <ModalSubtext>
                  {requestRecord.tacNumber} • {requestRecord.brand || "-"}{" "}
                  {requestRecord.model || ""}
                </ModalSubtext>
              </div>
              <CloseButton type="button" onClick={stopEditing}>
                x
              </CloseButton>
            </ModalHeader>

            <ValueComparison $modal>
              <ValueBlock>
                <ValueLabel>{t("TacInfo_CurrentValue")}</ValueLabel>
                <ValueAmount>{formatPrice(requestRecord.cfi)}</ValueAmount>
              </ValueBlock>
              <ValueArrow aria-hidden="true">-&gt;</ValueArrow>
              <ValueBlock>
                <ValueLabel>{t("TacInfo_RequestedValue")}</ValueLabel>
                <ModalInput
                  type="text"
                  inputMode="decimal"
                  maxLength={15}
                  value={draftValue}
                  onChange={(event) => {
                    setDraftValue(event.target.value);
                    setRequestError("");
                  }}
                  placeholder={t("TacInfo_NewEstimatedValue")}
                />
              </ValueBlock>
              {requestDifference ? (
                <DeltaBadge $tone={requestDifference.tone}>
                  {requestDifference.label}
                  {requestDifference.percentage
                    ? ` (${requestDifference.percentage})`
                    : ""}
                </DeltaBadge>
              ) : null}
            </ValueComparison>

            <ModalField>
              <ModalLabel>{t("TacInfo_Reason")}</ModalLabel>
              <ModalTextarea
                value={requestReason}
                maxLength={1000}
                onChange={(event) => {
                  setRequestReason(event.target.value);
                  setRequestError("");
                }}
                placeholder={t("TacInfo_ReasonPlaceholder")}
              />
              <CharacterCount>
                {requestReason.length}
                {" / 1000"}
              </CharacterCount>
            </ModalField>

            {requestError ? <ModalError>{requestError}</ModalError> : null}

            <ModalActions>
              <SecondaryActionButton type="button" onClick={stopEditing}>
                {t("Cancel")}
              </SecondaryActionButton>
              <ActionButton
                type="button"
                onClick={handleSubmitRequest}
                disabled={busyId === requestRecord.tacNumber}
              >
                {busyId === requestRecord.tacNumber
                  ? t("Loading")
                  : t("TacInfo_SubmitRequest")}
              </ActionButton>
            </ModalActions>
          </RequestModal>
        </ModalOverlay>
      ) : null}
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

const ValueComparison = styled.div`
  display: flex;
  align-items: ${({ $modal }) => ($modal ? "stretch" : "center")};
  gap: 12px;
  flex-wrap: wrap;
  padding: ${({ $modal }) => ($modal ? "16px" : "0")};
  border-radius: ${({ $modal }) => ($modal ? "12px" : "0")};
  background: ${({ $modal }) => ($modal ? "#f8fafc" : "transparent")};
  border: ${({ $modal }) => ($modal ? "1px solid #e5eaf4" : "none")};
`;

const ValueBlock = styled.div`
  display: flex;
  min-width: 132px;
  flex-direction: column;
  gap: 5px;
`;

const ValueLabel = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #74809e;
`;

const ValueAmount = styled.span`
  font-size: 18px;
  font-weight: 800;
  color: #20294c;
`;

const ValueArrow = styled.span`
  display: inline-flex;
  align-items: center;
  color: #9aa4bd;
  font-weight: 800;
`;

const DeltaBadge = styled.span`
  width: fit-content;
  align-self: center;
  padding: 7px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  color: ${({ $tone }) =>
    $tone === "increase" ? "#0d8f4f" : $tone === "decrease" ? "#b45309" : "#697493"};
  background: ${({ $tone }) =>
    $tone === "increase"
      ? "rgba(13, 143, 79, 0.1)"
      : $tone === "decrease"
      ? "rgba(180, 83, 9, 0.1)"
      : "rgba(105, 116, 147, 0.1)"};
`;

const ReasonBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e5eaf4;
`;

const ReasonLabel = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: #74809e;
`;

const ReasonText = styled.p`
  font-size: 13px;
  color: #20294c;
  line-height: 1.45;
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

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(16, 24, 40, 0.38);
`;

const RequestModal = styled.div`
  display: flex;
  width: min(620px, 100%);
  max-height: calc(100vh - 48px);
  flex-direction: column;
  gap: 18px;
  overflow: auto;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 22px 60px rgba(22, 34, 58, 0.24);
  padding: 24px;
`;

const ModalHeader = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
`;

const ModalTitle = styled.h3`
  font-size: 20px;
  font-weight: 800;
  color: #20294c;
`;

const ModalSubtext = styled.p`
  margin-top: 6px;
  font-size: 14px;
  color: #697493;
`;

const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #f2f4f8;
  color: #20294c;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
`;

const ModalField = styled.label`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ModalLabel = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: #20294c;
`;

const ModalInput = styled.input`
  width: 100%;
  height: 42px;
  border: 1px solid #d4d6df;
  border-radius: 10px;
  padding: 0 12px;
  color: #20294c;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: #436c4d;
  }
`;

const ModalTextarea = styled.textarea`
  width: 100%;
  min-height: 110px;
  resize: vertical;
  border: 1px solid #d4d6df;
  border-radius: 10px;
  padding: 12px;
  color: #20294c;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.5;
  outline: none;

  &:focus {
    border-color: #436c4d;
  }
`;

const CharacterCount = styled.span`
  align-self: flex-end;
  font-size: 12px;
  color: #8a95b5;
`;

const ModalError = styled.div`
  padding: 10px 12px;
  border-radius: 10px;
  color: #d34b4b;
  background: rgba(211, 75, 75, 0.08);
  border: 1px solid rgba(211, 75, 75, 0.16);
  font-size: 13px;
  font-weight: 600;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const InlineActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
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
