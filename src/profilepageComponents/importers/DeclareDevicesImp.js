import React, { useState, useEffect, useCallback, useMemo } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  bulkUpload,
  fetchUploadResults,
  downloadFullFile,
  declareInformation,
} from "../../functions/impDeclare";
import DevicesTable from "../DevicesTableImporters";
import Popup from "../Popup";

import chevronSVG from "../../assets/chevron-down.svg";
import downloadSVG from "../../assets/download.svg";
import fileSVG from "../../assets/file.svg";
import replaceSVG from "../../assets/replace.svg";
import filtersSVG from "../../assets/filters.svg";

const EMPTY_FILTERS = {
  brand: "All",
  model: "All",
  deviceType: "All",
  country: "All",
  status: "All",
  importDateFrom: "",
  importDateTo: "",
};

const STATUS_OPTIONS = [
  "READY_TO_PROCESS",
  "MISSING_INFORMATION",
  "ALREADY_REGISTERED",
  "DUPLICATE",
  "COUNTERFEIT",
  "INVALID",
];

// Parses dates coming from the API (ISO "YYYY-MM-DD" or "MM/DD/YYYY").
const parseDeviceDate = (value) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const isoDate = new Date(value);
    return isNaN(isoDate.getTime()) ? null : isoDate;
  }
  const match = value.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (match) {
    const [, month, day, year] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  const fallback = new Date(value);
  return isNaN(fallback.getTime()) ? null : fallback;
};

const filterDevices = (devices, filters) =>
  (devices || []).filter((device) => {
    if (filters.brand !== "All" && device.brand !== filters.brand) return false;
    if (filters.model !== "All" && device.model !== filters.model) return false;
    if (filters.deviceType !== "All" && device.deviceType !== filters.deviceType)
      return false;
    if (filters.country !== "All" && device.country !== filters.country)
      return false;
    if (filters.status !== "All" && device.status !== filters.status)
      return false;

    if (filters.importDateFrom || filters.importDateTo) {
      const deviceDate = parseDeviceDate(device.importDate);
      if (!deviceDate) return false;
      if (filters.importDateFrom) {
        const from = new Date(filters.importDateFrom);
        from.setHours(0, 0, 0, 0);
        if (deviceDate < from) return false;
      }
      if (filters.importDateTo) {
        const to = new Date(filters.importDateTo);
        to.setHours(23, 59, 59, 999);
        if (deviceDate > to) return false;
      }
    }
    return true;
  });

const DeclareDevicesImp = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadID, setUploadID] = useState(null);
  const [allDevices, setAllDevices] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "/template.csv";
    link.download = "template.csv";
    link.click();
  };

  const displayCount = (value) => (value ?? "-");

  // Full filtered set + the slice shown on the current page (client-side).
  const filteredDevices = useMemo(
    () => filterDevices(allDevices, appliedFilters),
    [allDevices, appliedFilters]
  );

  const totalElements = filteredDevices.length;

  const pagedDevices = useMemo(
    () =>
      filteredDevices.slice(
        currentPage * pageSize,
        (currentPage + 1) * pageSize
      ),
    [filteredDevices, currentPage, pageSize]
  );

  const distinctOptions = useCallback(
    (key) => {
      const values = new Set();
      allDevices.forEach((device) => {
        if (device?.[key]) values.add(device[key]);
      });
      return Array.from(values);
    },
    [allDevices]
  );

  const openFilters = () => {
    setDraftFilters(appliedFilters);
    setFilterOpen(true);
  };

  const closeFilters = () => setFilterOpen(false);

  const handleFilterChange = (key, value) => {
    setDraftFilters((previous) => ({ ...previous, [key]: value }));
  };

  const clearFilters = () => setDraftFilters(EMPTY_FILTERS);

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setCurrentPage(0);
    setFilterOpen(false);
  };

  const hasFilterChanges =
    JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters);

  // Active (applied) filters, used for the button badge and the chips row.
  const activeFilters = useMemo(() => {
    const list = [];
    if (appliedFilters.brand !== "All")
      list.push({ key: "brand", label: t("Brand") });
    if (appliedFilters.model !== "All")
      list.push({ key: "model", label: t("Model") });
    if (appliedFilters.deviceType !== "All")
      list.push({ key: "deviceType", label: t("Device Type") });
    if (appliedFilters.country !== "All")
      list.push({ key: "country", label: t("Country of Origin") });
    if (appliedFilters.status !== "All")
      list.push({ key: "status", label: t("Device Status") });
    if (appliedFilters.importDateFrom || appliedFilters.importDateTo)
      list.push({ key: "importDate", label: t("Import date") });
    return list;
  }, [appliedFilters, t]);

  const activeFilterCount = activeFilters.length;

  const resetFilterKey = (filters, key) => {
    if (key === "importDate") {
      return { ...filters, importDateFrom: "", importDateTo: "" };
    }
    return { ...filters, [key]: "All" };
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

  // Load the full result set once so filtering and pagination run client-side.
  useEffect(() => {
    const loadAllDevices = async () => {
      if (!fileUploaded || !uploadID) return;
      const response = await fetchUploadResults(uploadID, 1, 1000000);
      if (response) {
        setAllDevices(response.content || []);
      }
    };
    loadAllDevices();
  }, [fileUploaded, uploadID]);

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    if (!isNaN(newSize) && newSize > 0) {
      setPageSize(newSize);
      setCurrentPage(0);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (file) {
      setUploadedFile(file);
      setUploading(true);
      setProgress(0);
      setAllDevices([]); // Clear previous data if any
      setFileUploaded(false);
      setCurrentPage(0);
      setAppliedFilters(EMPTY_FILTERS);
      setDraftFilters(EMPTY_FILTERS);

      try {
        const ret = await bulkUpload(file);
        if (ret.uploadedData) {
          setUploadID(ret.uploadId);
          setSummaryData(ret.summaryData);
          setFileUploaded(true);
        }
      } catch (error) {
        console.error("Upload error:", error);
      } finally {
        setUploading(false);
      }
    }
  };

  useEffect(() => {
    if (!allDevices || allDevices.length === 0) return;
    const sums = allDevices.reduce(
      (acc, item) => {
        if (item.status === "READY_TO_PROCESS") {
          acc.totalDeclaredValue += Number(item.declaredValue || 0);
          acc.totalDuty += Number(item.dutyFee || 0);
        }
        return acc;
      },
      { totalDeclaredValue: 0, totalDuty: 0 }
    );

    setSummaryData((previousSummary) =>
      previousSummary
        ? {
          ...previousSummary,
          totalDeclaredValue: sums.totalDeclaredValue,
          totalCustomsDuty: sums.totalDuty,
        }
        : previousSummary
    );
  }, [allDevices]);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFileUpload(e);
  };

  const handleDownloadReport = async () => {
    try {
      await downloadFullFile(uploadID);
    } catch (error) {
      console.error("Error downloading report:", error);
    }
  };

  const submitToCustoms = async () => {
    if (
      summaryData?.status === "PROCESSED_OK" &&
      summaryData?.validRecordsCount > 0 &&
      summaryData?.invalidRecordsCount === 0
    ) {
      setBusy(true);
      try {
        const resp = await declareInformation(uploadID);
        if (resp === 200) {
          setPopupOpen(true);
        }
      } catch (error) {
        console.error("Error declaring information:", error);
      }
      setBusy(false);
    }
  };

  const handlePopupClose = () => {
    navigate("/profile/role_importer/DeclareDevices");
    setPopupOpen(false);
  };

  const handlePopupAction = () => {
    if (uploadID) {
      navigate(`/profile/role_importer/DeclareDevices/${uploadID}`);
    } else {
      navigate("/profile/role_importer/DeclareDevices");
    }
    setPopupOpen(false);
  };

  return (
    <DeclareDevicesImpContainer>
      <Title>{t("DeclareDevicesImp_Title")}</Title>
      <Subtext>{t("DeclareDevicesImp_SubText")}</Subtext>

      <MainContainer>
        {!fileUploaded ? (
          !uploading ? (
            <>
              <DownloadContainer>
                <ActionText>
                  {t("DeclareDevicesImp_DownloadTemplate")}
                </ActionText>
                <DownloadButton onClick={handleDownload}>
                  {t("Download")}
                </DownloadButton>
              </DownloadContainer>

              <UploadContainer
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById("fileInput").click()}
              >
                <ActionText>{t("DeclareDevicesImp_UploadFile")}</ActionText>
                <FileInput
                  id="fileInput"
                  type="file"
                  onChange={handleFileUpload}
                  accept=".csv"
                />
                <UploadButton>{t("Browse File")}</UploadButton>
              </UploadContainer>
            </>
          ) : (
            <LoadingContainer>
              <ActionText>{t("Uploading & Validating the file")}</ActionText>
              <ProgressBar>
                <Progress style={{ width: `${progress}%` }} />
              </ProgressBar>
            </LoadingContainer>
          )
        ) : (
          <>
            <TableContainer>
              <Header>
                <FileInfoContainer>
                  <img src={fileSVG} alt="Uploaded File" height="20" />
                  {uploadedFile?.name || t("No file selected")}
                </FileInfoContainer>
                <ReplaceButton
                  onClick={() => document.getElementById("fileInput").click()}
                >
                  <img src={replaceSVG} alt="Replace CSV" />
                  {t("Replace CSV File")}
                </ReplaceButton>

                <FileInput
                  id="fileInput"
                  type="file"
                  onChange={handleFileUpload}
                  accept=".csv"
                />

                <FilterButton
                  onClick={openFilters}
                  $active={activeFilterCount > 0}
                >
                  <img src={filtersSVG} alt="Filters" />
                  {t("Filters")}
                  {activeFilterCount > 0 && (
                    <FilterBadge>{activeFilterCount}</FilterBadge>
                  )}
                </FilterButton>

                <Pagination>
                  <PageNumber>
                    <span>
                      {currentPage * pageSize + 1}
                      {" - "}
                      {Math.min((currentPage + 1) * pageSize, totalElements)}
                    </span>{" "}
                    out of <span>{totalElements}</span>
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
                          (currentPage + 1) * pageSize < totalElements
                            ? 1
                            : 0.5,
                      }}
                      onClick={() =>
                        (currentPage + 1) * pageSize < totalElements &&
                        setCurrentPage(currentPage + 1)
                      }
                    />
                  </PaginationControls>
                  <PageSize
                    type="number"
                    value={pageSize}
                    onBlur={handlePageSizeChange}
                    min="1"
                  />
                </Pagination>
              </Header>

              {activeFilterCount > 0 && (
                <FiltersAppliedRow>
                  <FiltersAppliedLabel>
                    {t("Filters applied")}:
                  </FiltersAppliedLabel>
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

              <DevicesTable data={pagedDevices} />
            </TableContainer>
            <Footer>
              <Stats>
                <Stat>
                  <StatText>{t("Total ready to process devices")}</StatText>
                  <span style={{ color: "green", marginRight: "8px" }}>●</span>
                  {displayCount(summaryData?.validRecordsCount)}
                </Stat>
                <Stat>
                  <StatText>{t("Total missing information devices")}</StatText>
                  <span style={{ color: "orange", marginRight: "8px" }}>●</span>
                  {displayCount(summaryData?.missingRecordsCount)}
                </Stat>
                <Stat>
                  <StatText>{t("Total invalid devices")}</StatText>
                  <span style={{ color: "red", marginRight: "8px" }}>●</span>
                  {displayCount(summaryData?.invalidRecordsCount)}
                </Stat>
                <Stat>
                  <StatText>{t("Total Declared Value (USD)")}</StatText>
                  <strong>{summaryData?.totalDeclaredValue ?? "-"}</strong>
                </Stat>
                <Stat style={{ borderRight: 0 }}>
                  <StatText>{t("Total Customs Duty")} (USD)</StatText>
                  <strong>{summaryData?.totalCustomsDuty ?? "-"}</strong>
                </Stat>
              </Stats>
              <ButtonContainer>
                <UploadButton disabled={busy} onClick={handleDownloadReport}>
                  <img
                    src={downloadSVG}
                    alt="Download"
                    style={{ marginRight: "8px" }}
                  />
                  {t("Download report")}
                </UploadButton>
                <DownloadButton
                  onClick={submitToCustoms}
                  disabled={
                    !(
                      summaryData?.status === "PROCESSED_OK" &&
                      summaryData?.validRecordsCount > 0 &&
                      summaryData?.invalidRecordsCount === 0
                    ) || busy
                  }
                >
                  {t("Submit to Customs")}
                </DownloadButton>
              </ButtonContainer>
            </Footer>
          </>
        )}
      </MainContainer>

      {filterOpen && (
        <FilterOverlay onClick={closeFilters}>
          <FilterPanel onClick={(e) => e.stopPropagation()}>
            <FilterHeader>
              <FilterTitle>{t("Filters")}</FilterTitle>
              <CloseButton type="button" onClick={closeFilters}>
                ✕
              </CloseButton>
            </FilterHeader>

            <FilterBody>
              <FilterField>
                <FilterLabel>{t("Brand")}</FilterLabel>
                <FilterSelect
                  value={draftFilters.brand}
                  onChange={(e) => handleFilterChange("brand", e.target.value)}
                >
                  <option value="All">{t("All")}</option>
                  {distinctOptions("brand").map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </FilterSelect>
              </FilterField>

              <FilterField>
                <FilterLabel>{t("Model")}</FilterLabel>
                <FilterSelect
                  value={draftFilters.model}
                  onChange={(e) => handleFilterChange("model", e.target.value)}
                >
                  <option value="All">{t("All")}</option>
                  {distinctOptions("model").map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </FilterSelect>
              </FilterField>

              <FilterField>
                <FilterLabel>{t("Device Type")}</FilterLabel>
                <FilterSelect
                  value={draftFilters.deviceType}
                  onChange={(e) =>
                    handleFilterChange("deviceType", e.target.value)
                  }
                >
                  <option value="All">{t("All")}</option>
                  {distinctOptions("deviceType").map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </FilterSelect>
              </FilterField>

              <FilterField>
                <FilterLabel>{t("Country of Origin")}</FilterLabel>
                <FilterSelect
                  value={draftFilters.country}
                  onChange={(e) => handleFilterChange("country", e.target.value)}
                >
                  <option value="All">{t("All")}</option>
                  {distinctOptions("country").map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </FilterSelect>
              </FilterField>

              <FilterField>
                <FilterLabel>{t("Device Status")}</FilterLabel>
                <FilterSelect
                  value={draftFilters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  <option value="All">{t("All")}</option>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {t(option)}
                    </option>
                  ))}
                </FilterSelect>
              </FilterField>

              <FilterField>
                <FilterLabel>{t("Import date")}</FilterLabel>
                <DateRange>
                  <DateInput
                    type="date"
                    value={draftFilters.importDateFrom}
                    max={draftFilters.importDateTo || undefined}
                    onChange={(e) =>
                      handleFilterChange("importDateFrom", e.target.value)
                    }
                  />
                  <DateRangeSeparator>-</DateRangeSeparator>
                  <DateInput
                    type="date"
                    value={draftFilters.importDateTo}
                    min={draftFilters.importDateFrom || undefined}
                    onChange={(e) =>
                      handleFilterChange("importDateTo", e.target.value)
                    }
                  />
                </DateRange>
              </FilterField>
            </FilterBody>

            <FilterFooter>
              <ClearFiltersButton type="button" onClick={clearFilters}>
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

      {popupOpen && (
        <Popup
          purpose="submitDevicesSuccess"
          data={{ devices: summaryData?.totalIMEIs ?? 0 }}
          onClose={() => handlePopupClose()}
          onAction={() => handlePopupAction()}
          actionText={t("Popup_CloseButton")}
        />
      )}
    </DeclareDevicesImpContainer>
  );
};

export default DeclareDevicesImp;

const DeclareDevicesImpContainer = styled.div`
  display: flex;
  width: 90%;
  height: 100%;
  flex-direction: column;
  padding-top: 50px;
  padding-bottom: 20px;
  align-items: start;

  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
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

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
`;

const DownloadContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 70%;
  gap: 50px;
  margin: 10px 0;
  padding: 50px;
  border-radius: 18px;
  background: #f5f6fa;
`;

const UploadContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 70%;
  gap: 50px;
  margin: 10px 0;
  padding: 50px;
  border-radius: 18px;
  border: 2px dashed #d4d6df;
  background: #f7f7f7;
  cursor: pointer;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 70%;
  padding: 50px;
  border: 1px solid #d4d6df;
  border-radius: 18px;
  background: #f7f7f7;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
`;

const ActionText = styled.p`
  font-size: 18px;
`;

const DownloadButton = styled.button`
  color: white;
  padding: 12px 25px;
  font-size: 14px;
  cursor: pointer;
  border-radius: 38px;
  border: 1px solid #436C4D;
  background: #436C4D;
  transition: all 0.3s ease;
  &:disabled{
    opacity:0.4 !important;
    cursor: default;
  }
  &:hover {
    opacity: 0.7;
  }
`;

const UploadButton = styled.button`
  display: flex;
  align-items: center;
  padding: 12px 25px;
  font-size: 14px;
  cursor: pointer;
  border-radius: 38px;
  border: 1px solid #20294c;
  transition: all 0.3s ease;
  background: none;

  &:hover {
    opacity: 0.7;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 10px;
  background: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
  margin-top: 20px;
`;

const Progress = styled.div`
  height: 100%;
  background: #436C4D;
  transition: width 0.3s ease;
`;

const TableContainer = styled.div`
  border-radius: 12px;
  border: 1px solid #d4d6df;
  background: #fff;
  padding: 20px 20px 5px 20px;
  width: 100%;
  justify-content: space-between;
  align-items: center;
`;

const FileInfoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 8px;
  background: #f5f6fa;
  padding: 10px 16px;
  align-items: center;
`;

const ReplaceButton = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #436C4D;
  font-size: 16px;
  font-weight: 700;
  text-decoration-line: underline;
  cursor: pointer;

  img {
    height: 20px;
  }
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
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
  margin-bottom: 20px;
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

const PageSize = styled.input`
  width: 50px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  text-align: center;
`;

const Footer = styled.div`
  display: flex;
  width: 100%;
  margin-top: auto;
  padding: 18px 32px;
  justify-content: space-between;
  align-items: center;
  border-radius: 20px;
  background: #f5f6fa;
`;

const Stats = styled.div`
  display: flex;
  gap: 8px;
`;

const Stat = styled.div`
  border-right: 1px solid #D4D6DF;
  padding-right: 8px;
  font-size:16px;
  >strong{
    letter-spacing:1px;
  }
`;

const StatText = styled.p`
  color: #797f94;
  font-size: 14px;
  font-weight: 500;
  margin-bottom:5px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
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

const FilterHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
`;

const FilterTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: #2671d9;
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
    border-bottom-color: #2671d9;
  }
`;

const DateRange = styled.div`
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

const DateRangeSeparator = styled.span`
  color: #797f94;
`;

const FilterFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  border: 1px solid #2671d9;
  background: #2671d9;
  transition: all 0.3s ease;

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
  &:hover:not(:disabled) {
    opacity: 0.8;
  }
`;
