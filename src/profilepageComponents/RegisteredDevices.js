// src/profilepageComponents/RegisteredDevices.js
import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  clearImporterUploadData,
  fetchClearableImporterUpload,
  fetchRegisteredDevices,
} from "../functions/registered";
import { Context } from "../Context";

import DevicesTable from "./DevicesTable";
import chevronSVG from "../assets/chevron-down.svg";
import emptySVG from "../assets/noRegistered.svg";
import plusSVG from "../assets/plus.svg";
import searchSVG from "../assets/search3.svg";
import filtersSVG from "../assets/filters.svg";

const DEVICE_TYPE_OPTIONS = ["All", "2G", "3G", "4G", "5G"];

const EMPTY_FILTERS = {
  technology: "All",
  brand: "",
  country: "",
  declDateFrom: "",
  declDateTo: "",
};

// Backend rejects search terms shorter than this (@Length(min = 3)).
const MIN_SEARCH_LENGTH = 3;

const RegisteredDevices = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { accountType } = useContext(Context);
  const isAdmin = accountType === "ROLE_ADMIN";

  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [clearableUpload, setClearableUpload] = useState(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    const filtersPayload = isAdmin
      ? {
          brand: appliedFilters.brand.trim(),
          country: appliedFilters.country.trim(),
          technology:
            appliedFilters.technology === "All" ? "" : appliedFilters.technology,
          declDateFrom: appliedFilters.declDateFrom,
          declDateTo: appliedFilters.declDateTo,
        }
      : {};

    const response = await fetchRegisteredDevices(
      currentPage + 1,
      pageSize,
      appliedSearch,
      null,
      isAdmin,
      filtersPayload
    );

    if (response) {
      setData(response.data || []);
      setTotalElements(response.totalElements || 0);
    } else {
      setData([]);
      setTotalElements(0);
    }
    setLoading(false);
  }, [isAdmin, currentPage, pageSize, appliedSearch, appliedFilters]);

  const fetchClearableUpload = useCallback(async () => {
    const response = await fetchClearableImporterUpload();
    setClearableUpload(response);
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    if (accountType === "ROLE_IMPORTER") {
      fetchClearableUpload();
    }
  }, [accountType, fetchClearableUpload]);

  // Debounce search; honor the backend's minimum length (shorter = no filter).
  useEffect(() => {
    const timerId = window.setTimeout(() => {
      const trimmed = searchQuery.trim();
      setAppliedSearch(trimmed.length >= MIN_SEARCH_LENGTH ? trimmed : "");
      setCurrentPage(0);
    }, 300);

    return () => window.clearTimeout(timerId);
  }, [searchQuery]);

  const activeFilters = useMemo(() => {
    if (!isAdmin) return [];
    const list = [];
    if (appliedFilters.technology !== "All")
      list.push({ key: "technology", label: t("Device Type") });
    if (appliedFilters.brand.trim())
      list.push({ key: "brand", label: t("Brand") });
    if (appliedFilters.country.trim())
      list.push({ key: "country", label: t("Country of Origin") });
    if (appliedFilters.declDateFrom || appliedFilters.declDateTo)
      list.push({ key: "declDate", label: t("Declaration Date") });
    return list;
  }, [isAdmin, appliedFilters, t]);

  const activeFilterCount = activeFilters.length;
  const isSearchingOrFiltering = appliedSearch !== "" || activeFilterCount > 0;

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
    setCurrentPage(0);
    setFilterOpen(false);
  };

  const hasFilterChanges =
    JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters);

  const resetFilterKey = (filters, key) => {
    if (key === "declDate")
      return { ...filters, declDateFrom: "", declDateTo: "" };
    if (key === "technology") return { ...filters, technology: "All" };
    return { ...filters, [key]: "" };
  };

  const removeFilter = (key) => {
    setAppliedFilters((previous) => resetFilterKey(previous, key));
    setDraftFilters((previous) => resetFilterKey(previous, key));
    setCurrentPage(0);
  };

  const clearAllFilters = () => {
    setAppliedFilters(EMPTY_FILTERS);
    setDraftFilters(EMPTY_FILTERS);
    setCurrentPage(0);
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    if (!isNaN(newSize) && newSize > 0) {
      setPageSize(newSize);
      setCurrentPage(0);
    }
  };

  const handleButton = () => {
    if (accountType === "ROLE_IMPORTER") {
      navigate("/profile/role_importer/RegisterDevices");
    } else if (accountType === "ROLE_USER") {
      navigate("/profile/role_user/RegisterDevices");
    } else {
      navigate("/");
    }
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
      await fetchDevices();
      await fetchClearableUpload();
    }
  };

  // Full-page empty state only when there are genuinely no devices and the
  // user is not searching/filtering — otherwise the toolbar must stay visible.
  if (!loading && totalElements === 0 && !isSearchingOrFiltering) {
    return (
      <EmptyStateContainer>
        <EmptyStateSVG src={emptySVG} alt="No data" />
        <EmptyStateTitle>
          {t("NoDevices_Title1")}
          <br />
          {!isAdmin && <span>{t("NoDevices_Title2")}</span>}
        </EmptyStateTitle>
        {!isAdmin && (
          <Button onClick={handleButton}>{t("Start Registration")}</Button>
        )}
      </EmptyStateContainer>
    );
  }

  const pageStart = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const pageEnd =
    totalElements === 0
      ? 0
      : Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <RegisteredDevicesContainer>
      <Header>
        <TextContainer>
          <Title>{t("RegisteredDevices_Title")}</Title>
          <Subtext>{t("RegisteredDevices_Subtitle")}</Subtext>
        </TextContainer>
        <HeaderActions>
          {accountType === "ROLE_IMPORTER" && clearableUpload?.uploadId && (
            <SecondaryButton type="button" onClick={handleClearData}>
              {t("Clear Data")}
            </SecondaryButton>
          )}
          {!isAdmin && (
            <Button onClick={handleButton}>
              <img src={plusSVG} alt="Plus" />
              {t("RegisteredDevices_AddButton")}
            </Button>
          )}
        </HeaderActions>
      </Header>

      <TableContainer>
        <Toolbar>
          <ToolbarLeft>
            <SearchBarWrapper>
              <SearchIcon src={searchSVG} alt="Search" />
              <TextInput
                type="text"
                placeholder={t("RegisteredDevices_SearchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </SearchBarWrapper>

            {isAdmin && (
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
            )}
          </ToolbarLeft>

          <Pagination>
            <PageNumber>
              <span>
                {pageStart}
                {" - "}
                {pageEnd}
              </span>{" "}
              {t("Out of")} <span>{totalElements}</span>
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

        <DevicesTable data={data} isAdmin={isAdmin} />
      </TableContainer>

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
                <FilterLabel>{t("Device Type")}</FilterLabel>
                <FilterSelect
                  value={draftFilters.technology}
                  onChange={(e) =>
                    handleFilterChange("technology", e.target.value)
                  }
                >
                  {DEVICE_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option === "All" ? t("All") : option}
                    </option>
                  ))}
                </FilterSelect>
              </FilterField>

              <FilterField>
                <FilterLabel>{t("Brand")}</FilterLabel>
                <FilterTextInput
                  type="text"
                  value={draftFilters.brand}
                  onChange={(e) => handleFilterChange("brand", e.target.value)}
                />
              </FilterField>

              <FilterField>
                <FilterLabel>{t("Country of Origin")}</FilterLabel>
                <FilterTextInput
                  type="text"
                  value={draftFilters.country}
                  onChange={(e) =>
                    handleFilterChange("country", e.target.value)
                  }
                />
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
    </RegisteredDevicesContainer>
  );
};

export default RegisteredDevices;

const RegisteredDevicesContainer = styled.div`
  display: flex;
  width: 90%;
  height: calc(100vh - 75px);
  flex-direction: column;
  padding: 40px 0;
  align-items: start;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  width: 100%;
  gap: 20px;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: #436c4d;
  margin-bottom: 10px;
`;

const Subtext = styled.p`
  font-size: 16px;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 25px;
  border-radius: 38px;
  background: #436c4d;
  color: white;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    opacity: 0.7;
  }
`;

const SecondaryButton = styled(Button)`
  background: #ffffff;
  color: #436c4d;
  border: 1px solid #436c4d;
`;

const TableContainer = styled.div`
  border-radius: 12px;
  border: 1px solid #d4d6df;
  background: #fff;
  padding: 20px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow: hidden;
`;

const Toolbar = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  gap: 20px;
`;

const ToolbarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  margin-right: auto;
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
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

  &:focus {
    border-color: #436c4d;
  }
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  gap: 30px;
`;

const EmptyStateSVG = styled.img`
  width: 250px;
`;

const EmptyStateTitle = styled.h2`
  font-size: 20px;
  font-weight: 400;
  text-align: center;

  span {
    font-weight: 700;
  }
`;

const SearchBarWrapper = styled.div`
  display: flex;
  width: 320px;
  max-width: 100%;
  padding: 8px 16px;
  align-items: center;
  gap: 8px;
  border-radius: 1000px;
  border: 1px solid #d4d6df;
`;

const SearchIcon = styled.img`
  width: 16px;
  height: 16px;
`;

const TextInput = styled.input`
  border: none;
  outline: none;
  flex: 1;
  font-size: 16px;
  color: #000;
  background: none;
  font-family: "Lato", sans-serif;

  ::placeholder {
    color: #a0a4b8;
  }
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
  color: #436c4d;
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
    border-bottom-color: #436c4d;
  }
`;

const FilterTextInput = styled.input`
  width: 100%;
  border: none;
  border-bottom: 1.5px solid #d4d6df;
  outline: none;
  font-size: 16px;
  font-weight: 500;
  padding: 6px 0;
  background: none;
  color: #20294c;
  font-family: inherit;

  &:focus {
    border-bottom-color: #436c4d;
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
  border: 1px solid #436c4d;
  background: #436c4d;
  transition: all 0.3s ease;

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
  &:hover:not(:disabled) {
    opacity: 0.8;
  }
`;
