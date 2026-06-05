// src/profilepageComponents/admins/UserManagement.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { fetchUsers } from "../../functions/admin";
import {
  ROLE_ADMIN,
  ROLE_CUSTOMS,
  ROLE_IMPORTER,
  ROLE_USER,
} from "../../config/roles";

import UsersTable from "./UsersTable";
import chevronSVG from "../../assets/chevron-down.svg";
import searchSVG from "../../assets/search3.svg";
import filtersSVG from "../../assets/filters.svg";

const USER_ROLE_FILTERS = [
  { key: "ALL", labelKey: "All Users", value: "" },
  { key: ROLE_ADMIN, labelKey: "RoleBadge_Administrator", value: ROLE_ADMIN },
  { key: ROLE_CUSTOMS, labelKey: "RoleBadge_CustomsOfficer", value: ROLE_CUSTOMS },
  { key: ROLE_IMPORTER, labelKey: "RoleBadge_Importer", value: ROLE_IMPORTER },
  { key: ROLE_USER, labelKey: "RoleBadge_Individual", value: ROLE_USER },
];

const USER_STATUS_FILTERS = [
  { key: "ALL", labelKey: "All", value: "" },
  { key: "APPROVED", labelKey: "APPROVED", value: "APPROVED" },
  { key: "PENDING", labelKey: "PENDING", value: "PENDING" },
  { key: "REJECTED", labelKey: "REJECTED", value: "REJECTED" },
  { key: "DISABLED", labelKey: "DISABLED", value: "DISABLED" },
];

const EMPTY_FILTERS = { role: "ALL", status: "ALL" };

const UserManagement = () => {
  const { t } = useTranslation();
  const [usersData, setUsersData] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const fetchData = useCallback(async () => {
    const selectedRole = USER_ROLE_FILTERS.find(
      (filter) => filter.key === appliedFilters.role
    );
    const selectedStatus = USER_STATUS_FILTERS.find(
      (filter) => filter.key === appliedFilters.status
    );
    const data = await fetchUsers(
      selectedRole?.value || "",
      currentPage,
      pageSize,
      setTotalElements,
      appliedSearch,
      selectedStatus?.value || ""
    );
    setUsersData(data || []);
  }, [appliedFilters, appliedSearch, currentPage, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounce the search input before triggering a fetch.
  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setAppliedSearch(searchQuery.trim());
      setCurrentPage(0);
    }, 250);

    return () => window.clearTimeout(timerId);
  }, [searchQuery]);

  const activeFilters = useMemo(() => {
    const list = [];
    if (appliedFilters.role !== "ALL") {
      const selected = USER_ROLE_FILTERS.find(
        (filter) => filter.key === appliedFilters.role
      );
      list.push({ key: "role", label: t(selected?.labelKey || "Account Type") });
    }
    if (appliedFilters.status !== "ALL") {
      const selected = USER_STATUS_FILTERS.find(
        (filter) => filter.key === appliedFilters.status
      );
      list.push({
        key: "status",
        label: t(selected?.labelKey || "Account Status"),
      });
    }
    return list;
  }, [appliedFilters, t]);

  const activeFilterCount = activeFilters.length;

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

  const removeFilter = (key) => {
    setAppliedFilters((previous) => ({ ...previous, [key]: "ALL" }));
    setDraftFilters((previous) => ({ ...previous, [key]: "ALL" }));
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

  const pageStart = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const pageEnd =
    totalElements === 0
      ? 0
      : Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <UserManagementContainer>
      <Title>{t("UserManagement_Title")}</Title>
      <Subtext>{t("UserManagement_SubText")}</Subtext>

      <UsersContainer>
        <TopBar>
          <ToolbarLeft>
            <SearchBar>
              <SearchIcon src={searchSVG} alt="Search" />
              <SearchInput
                type="text"
                placeholder={t("UserManagement_SearchPlaceholder")}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </SearchBar>

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
        </TopBar>

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

        <UsersTable data={usersData} />
      </UsersContainer>

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
                <FilterLabel>{t("Account Type")}</FilterLabel>
                <FilterSelect
                  value={draftFilters.role}
                  onChange={(e) => handleFilterChange("role", e.target.value)}
                >
                  {USER_ROLE_FILTERS.map((filter) => (
                    <option key={filter.key} value={filter.key}>
                      {t(filter.labelKey)}
                    </option>
                  ))}
                </FilterSelect>
              </FilterField>

              <FilterField>
                <FilterLabel>{t("Account Status")}</FilterLabel>
                <FilterSelect
                  value={draftFilters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  {USER_STATUS_FILTERS.map((filter) => (
                    <option key={filter.key} value={filter.key}>
                      {t(filter.labelKey)}
                    </option>
                  ))}
                </FilterSelect>
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
    </UserManagementContainer>
  );
};

export default UserManagement;

const UserManagementContainer = styled.div`
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
  color: #436C4D;
  margin-bottom: 10px;
`;

const Subtext = styled.p`
  font-size: 16px;
  margin-bottom: 30px;
`;

const UsersContainer = styled.div`
  display: flex;
  flex: 1;
  min-height: 520px;
  border-radius: 12px;
  border: 1px solid #eaebef;
  padding: 20px;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  width: 100%;
  overflow: hidden;
`;

const TopBar = styled.div`
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

const SearchBar = styled.div`
  width: 100%;
  max-width: 320px;
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
