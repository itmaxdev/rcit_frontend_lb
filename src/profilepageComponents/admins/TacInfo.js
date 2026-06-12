import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { fetchTacInfo } from "../../functions/admin";
import { formatCount } from "../../functions/format";
import searchSVG from "../../assets/search3.svg";
import chevronSVG from "../../assets/chevron-down.svg";

const TacInfo = () => {
  const { t } = useTranslation();
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const loadTacInfo = useCallback(async () => {
    const data = await fetchTacInfo(
      currentPage,
      pageSize,
      setTotalElements,
      appliedSearch
    );
    setRecords(data || []);
  }, [appliedSearch, currentPage, pageSize]);

  useEffect(() => {
    loadTacInfo();
  }, [loadTacInfo]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setAppliedSearch(searchQuery.trim());
      setCurrentPage(0);
    }, 250);

    return () => window.clearTimeout(timerId);
  }, [searchQuery]);

  const handlePageSizeChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    if (!Number.isNaN(newSize) && newSize > 0) {
      setPageSize(newSize);
      setCurrentPage(0);
    }
  };

  const pageStart = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const pageEnd =
    totalElements === 0
      ? 0
      : Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <TacInfoContainer>
      <Title>{t("TacInfo_Title")}</Title>
      <Subtext>{t("TacInfo_Subtext")}</Subtext>

      <Card>
        <TopBar>
          <SearchBar>
            <SearchIcon src={searchSVG} alt="Search" />
            <SearchInput
              type="text"
              placeholder={t("TacInfo_SearchPlaceholder")}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
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
                <TableHeader>{t("TacInfo_TAC")}</TableHeader>
                <TableHeader>{t("Brand")}</TableHeader>
                <TableHeader>{t("Model")}</TableHeader>
                <TableHeader>{t("TacInfo_DeviceType")}</TableHeader>
                <TableHeader>{t("Technology")}</TableHeader>
                <TableHeader>{t("TacInfo_IMEISupport")}</TableHeader>
                <TableHeader>{t("TacInfo_SIMSlots")}</TableHeader>
                <TableHeader>{t("TacInfo_EstimatedValue")}</TableHeader>
              </TableRow>
            </thead>
            <tbody>
              {records.length > 0 ? (
                records.map((record) => (
                  <TableRow key={record.tacNumber}>
                    <TableCell>{record.tacNumber || "-"}</TableCell>
                    <TableCell>{record.brand || "-"}</TableCell>
                    <TableCell>{record.model || "-"}</TableCell>
                    <TableCell>{record.deviceType || "-"}</TableCell>
                    <TableCell>{record.technology || "-"}</TableCell>
                    <TableCell>{record.imeiQuantitySupport ?? "-"}</TableCell>
                    <TableCell>{record.simSlot ?? "-"}</TableCell>
                    <TableCell>{record.cfi || "-"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <EmptyCell colSpan="8">{t("No data available")}</EmptyCell>
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
  height: calc(100vh - 75px);
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
