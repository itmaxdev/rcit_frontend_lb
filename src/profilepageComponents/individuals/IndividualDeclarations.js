import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import emptySVG from "../../assets/noRegistered.svg";
import plusSVG from "../../assets/plus.svg";
import searchSVG from "../../assets/search3.svg";
import { fetchUserDeclarations } from "../../functions/indDeclare";
import { StatusTag } from "../statusBadge";
import { formatCount } from "../../functions/format";

const IndividualDeclarations = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [declarations, setDeclarations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setAppliedSearch(searchQuery.trim());
      setCurrentPage(0);
    }, 250);

    return () => window.clearTimeout(timerId);
  }, [searchQuery]);

  const loadDeclarations = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    const response = await fetchUserDeclarations(
      currentPage + 1,
      pageSize,
      appliedSearch
    );

    if (!response) {
      setDeclarations([]);
      setTotalElements(0);
      setLoadError(true);
      setLoading(false);
      return;
    }

    setDeclarations(response.data || []);
    setTotalElements(response.totalElements || 0);
    setLoading(false);
  }, [appliedSearch, currentPage, pageSize]);

  useEffect(() => {
    loadDeclarations();
  }, [loadDeclarations]);

  const pageStart = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const pageEnd =
    totalElements === 0
      ? 0
      : Math.min((currentPage + 1) * pageSize, totalElements);

  const handleRegisterDevices = () => {
    navigate("/profile/role_user/RegisterDevices");
  };

  const handleViewDetails = (declarationId) => {
    navigate(`/profile/role_user/DeclareDevices/${declarationId}`);
  };

  if (!loading && totalElements === 0 && !appliedSearch) {
    return (
      <EmptyStateContainer>
        <EmptyStateSVG src={emptySVG} alt="No declarations" />
        <EmptyStateTitle>{t("IndividualDeclarations_EmptyTitle")}</EmptyStateTitle>
        <EmptyStateSubtext>{t("IndividualDeclarations_EmptySubtitle")}</EmptyStateSubtext>
        <Button type="button" onClick={handleRegisterDevices}>
          {t("RegisteredDevices_AddButton")}
        </Button>
      </EmptyStateContainer>
    );
  }

  return (
    <Container>
      <Header>
        <TextContainer>
          <Title>{t("IndividualDeclarations_Title")}</Title>
          <Subtext>{t("IndividualDeclarations_Subtitle")}</Subtext>
        </TextContainer>
        <Button type="button" onClick={handleRegisterDevices}>
          <img src={plusSVG} alt="" />
          {t("RegisteredDevices_AddButton")}
        </Button>
      </Header>

      <Card>
        <Toolbar>
          <SearchInputWrapper>
            <SearchIcon src={searchSVG} alt="Search" />
            <SearchInput
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t("ImporterDeclarations_SearchPlaceholder")}
            />
          </SearchInputWrapper>

          <PaginationMeta>
            <RangeText>
              {formatCount(pageStart)}-{formatCount(pageEnd)} {t("Out of")}{" "}
              {formatCount(totalElements)}
            </RangeText>
            <PageButton
              type="button"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 0))}
            >
              ‹
            </PageButton>
            <PageButton
              type="button"
              disabled={pageEnd >= totalElements}
              onClick={() => setCurrentPage((page) => page + 1)}
            >
              ›
            </PageButton>
            <PageSizeSelect
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setCurrentPage(0);
              }}
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </PageSizeSelect>
          </PaginationMeta>
        </Toolbar>

        {loading ? (
          <StateCard>{t("Loading")}</StateCard>
        ) : loadError ? (
          <StateCard>
            <div>{t("ImporterDeclarations_LoadError")}</div>
            <OutlineButton type="button" onClick={loadDeclarations}>
              {t("Retry")}
            </OutlineButton>
          </StateCard>
        ) : declarations.length === 0 ? (
          <StateCard>{t("IndividualDeclarations_NoSearchResults")}</StateCard>
        ) : (
          <TableWrapper>
            <Table>
              <thead>
                <TableRow>
                  <TableHeader>{t("Declaration Nbr.")}</TableHeader>
                  <TableHeader>{t("Declaration Date")}</TableHeader>
                  <TableHeader>{t("Nbr of Devices")}</TableHeader>
                  <TableHeader>{t("Brand")}</TableHeader>
                  <TableHeader>{t("Model")}</TableHeader>
                  <TableHeader>{t("Total Payable (USD)")}</TableHeader>
                  <TableHeader>{t("Status")}</TableHeader>
                  <TableHeader>{t("Actions")}</TableHeader>
                </TableRow>
              </thead>
              <tbody>
                {declarations.map((declaration) => (
                  <TableRow key={declaration.id}>
                    <TableCell>{declaration.declarationNumber}</TableCell>
                    <TableCell>{formatDate(declaration.declarationDate)}</TableCell>
                    <TableCell>{formatCount(declaration.devicesCount)}</TableCell>
                    <TableCell>{declaration.brand || "-"}</TableCell>
                    <TableCell>{declaration.model || "-"}</TableCell>
                    <TableCell>{formatMoney(declaration.totalPayableUsd)}</TableCell>
                    <TableCell>
                      <StatusTag status={declaration.status}>
                        {formatStatusLabel(t, declaration.status)}
                      </StatusTag>
                    </TableCell>
                    <TableCell>
                      <ActionButton
                        type="button"
                        onClick={() => handleViewDetails(declaration.id)}
                      >
                        {t("View Details")}
                      </ActionButton>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </TableWrapper>
        )}
      </Card>
    </Container>
  );
};

export default IndividualDeclarations;

const formatMoney = (value) => {
  const amount = Number(value || 0);
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatStatusLabel = (t, status) => {
  switch (status) {
    case "SUBMITTED":
      return t("Submitted");
    case "UNDER_REVIEW":
      return t("Under Review");
    case "AWAITING_PAYMENT":
      return t("Awaiting Payment");
    case "PAID":
      return t("Paid");
    case "CLOSED":
      return t("Closed");
    case "DECLINED":
      return t("Rejected");
    default:
      return status;
  }
};

const Container = styled.div`
  display: flex;
  width: 90%;
  flex-direction: column;
  padding: 50px 0 30px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
  flex-wrap: wrap;
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: #20294c;
  margin: 0;
`;

const Subtext = styled.p`
  font-size: 16px;
  color: #20294c;
  margin: 0;
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #e5e9f2;
  border-radius: 24px;
  padding: 20px;
  min-height: 560px;
  display: flex;
  flex-direction: column;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const SearchInputWrapper = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 260px;
  background: #fff;
  border: 1px solid #d4d8e5;
  border-radius: 999px;
  padding: 12px 18px;
`;

const SearchIcon = styled.img`
  width: 18px;
  height: 18px;
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  width: 100%;
  font-size: 15px;
  color: #20294c;
  background: transparent;
`;

const PaginationMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const RangeText = styled.span`
  color: #6f7897;
  font-size: 14px;
`;

const PageButton = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid #d9deeb;
  background: #fff;
  color: #20294c;
  font-size: 20px;
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const PageSizeSelect = styled.select`
  border: 1px solid #d9deeb;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  color: #20294c;
  background: #fff;
`;

const TableWrapper = styled.div`
  flex: 1;
  overflow: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableRow = styled.tr`
  &:hover {
    background: #f8fafc;
  }
`;

const TableHeader = styled.th`
  background: #f5f6fa;
  color: #797f94;
  font-weight: 500;
  text-align: left;
  padding: 14px 16px;
  font-size: 14px;
`;

const TableCell = styled.td`
  padding: 16px;
  border-bottom: 1px solid #eaebef;
  text-align: left;
  font-size: 14px;
  color: #20294c;
  vertical-align: middle;
`;

const ActionButton = styled.button`
  border: none;
  background: transparent;
  color: #2671d9;
  font-weight: 600;
  cursor: pointer;
  padding: 0;

  &:hover {
    text-decoration: underline;
  }
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: 999px;
  background: #436c4d;
  color: white;
  padding: 14px 20px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;

  img {
    width: 16px;
    height: 16px;
  }
`;

const OutlineButton = styled.button`
  border: 1px solid #20294c;
  border-radius: 999px;
  background: white;
  color: #20294c;
  padding: 12px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`;

const StateCard = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  justify-content: center;
  color: #6f7897;
  font-size: 15px;
  text-align: center;
`;

const EmptyStateContainer = styled.div`
  display: flex;
  width: 100%;
  min-height: calc(100vh - 140px);
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 18px;
`;

const EmptyStateSVG = styled.img`
  width: 220px;
  max-width: 70%;
`;

const EmptyStateTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #20294c;
  margin: 0;
`;

const EmptyStateSubtext = styled.p`
  font-size: 16px;
  color: #6f7897;
  margin: 0;
`;
