import React, { useState, useEffect } from "react";
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
import PaymentSummary from "../paymentSummary"

import chevronSVG from "../../assets/chevron-down.svg";
import downloadSVG from "../../assets/download.svg";
import fileSVG from "../../assets/file.svg";
import replaceSVG from "../../assets/replace.svg";

const currencyData = {}

const DeclareDevicesImp = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadID, setUploadID] = useState(null);
  const [uploadedData, setUploadedData] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [paymentData, setPaymentData] = useState({
    totalCIFValue: 10,
    totalCustomsDuty: 20,
    usdToLbpRate: 89500,
    vatPercentage: 11
  });
  const [showPayment, setShowPayment] = useState(false);


  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "/template.csv";
    link.download = "template.csv";
    link.click();
  };

  useEffect(() => {
    // Only fetch devices if the file has been uploaded and page/pageSize has changed
    if (fileUploaded) {
      fetchDevices(currentPage, pageSize);
    }
  }, [currentPage, pageSize]); // Depend on fileUploaded

  const fetchDevices = async (page, size) => {
    const response = await fetchUploadResults(uploadID, page + 1, size);
    if (response) {
      setUploadedData(response.content);
      setTotalElements(response.totalElements);
    }
  };

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
      setUploadedData(null); // Clear previous data if any
      setFileUploaded(false);

      try {
        const ret = await bulkUpload(file);
        if (ret.uploadedData) {
          currencyData.usdToLbpRate = ret.uploadedData.usdToLbpRate
          currencyData.vatPercentage = ret.uploadedData.vatPercentage
          setUploadID(ret.uploadId);
          setSummaryData(ret.summaryData);
          setUploadedData(ret.uploadedData.content);
          setTotalElements(ret.uploadedData.totalElements);
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
    if (!uploadedData || !Array.isArray(uploadedData)) return
    const newSummary = JSON.parse(JSON.stringify(summaryData))
    const sums = uploadedData.reduce(
      (acc, item) => {
        acc.totalCif += Number(item.cfi || 0);
        acc.totalDuty += Number(item.dutyFee || 0);
        return acc;
      },
      { totalCif: 0, totalDuty: 0 }
    );
    newSummary.totalCIFValue = sums.totalCif
    newSummary.totalCustomsDuty = sums.totalDuty
    setPaymentData({
      ...currencyData,
      totalCIFValue: newSummary.totalCIFValue,
      totalCustomsDuty: newSummary.totalCustomsDuty,
    })
    setSummaryData(newSummary)
  }, [uploadedData])

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

  const handleDeclare = async () => {
    if (
      summaryData?.status === "PROCESSED_OK" &&
      summaryData?.validRecordsCount > 0 &&
      summaryData?.invalidRecordsCount === 0
    ) {
      setBusy(true)
      try {
        await declareInformation(uploadID);
        global.alert2(t("Declaration successful!"));
      } catch (error) {
        console.error("Error declaring information:", error);
      }
      setBusy(false)
    }
  };

  const openPayment = () => {
    setShowPayment(true)
  }

  const handlePopupClose = () => {
    navigate("/profile/role_importer/dashboard");
    setPopupOpen(false);
  };

  const handlePopupAction = () => {
    navigate("/profile/role_importer/DeclareDevices");
    setPopupOpen(false);
  };

  if (showPayment) {
    return (
      <PaymentSummary busy={busy} onPay={handleDeclare} data={paymentData} />
    )
  }

  return (
    <DeclareDevicesImpContainer>
      <Title>{t("DeclareDevicesImp_Title")}</Title>
      <Subtext>{t("DeclareDevicesImp_SubText")}</Subtext>

      <MainContainer>
        {!uploadedData ? (
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

              <DevicesTable data={uploadedData} />
            </TableContainer>
            <Footer>
              <Stats>
                <Stat>
                  <StatText>{t("Total ready to process devices")}</StatText>
                  <span style={{ color: "green", marginRight: "8px" }}>●</span>
                  {summaryData?.validRecordsCount || "-"}
                </Stat>
                <Stat>
                  <StatText>{t("Total missing information devices")}</StatText>
                  <span style={{ color: "orange", marginRight: "8px" }}>●</span>
                  {summaryData?.missingRecordsCount || "-"}
                </Stat>
                <Stat>
                  <StatText>{t("Total invalid devices")}</StatText>
                  <span style={{ color: "red", marginRight: "8px" }}>●</span>
                  {summaryData?.invalidRecordsCount || "-"}
                </Stat>
                <Stat>
                  <StatText>{t("Total Value")}</StatText>
                  <strong>{summaryData?.totalCIFValue || "-"}</strong>
                </Stat>
                <Stat style={{ borderRight: 0 }}>
                  <StatText>{t("Total Customs Duty")}</StatText>
                  <strong>{summaryData?.totalCustomsDuty || "-"}</strong>
                </Stat>
              </Stats>
              <ButtonContainer>
                <UploadButton onClick={handleDownloadReport}>
                  <img
                    src={downloadSVG}
                    alt="Download"
                    style={{ marginRight: "8px" }}
                  />
                  {t("Download report")}
                </UploadButton>
                <DownloadButton
                  onClick={openPayment}
                  disabled={
                    !(
                      summaryData?.status === "PROCESSED_OK" &&
                      summaryData?.validRecordsCount > 0 &&
                      summaryData?.invalidRecordsCount === 0
                    )
                  }
                >
                  {t("Declare")}
                </DownloadButton>
              </ButtonContainer>
            </Footer>
          </>
        )}
      </MainContainer>

      {popupOpen && (
        <Popup
          purpose="userDeclare"
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

const Pagination = styled.div`
  display: flex;
  align-items: center;
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
  gap: 6px;
`;

const Stat = styled.div`
  border-right: 1px solid #D4D6DF;
  padding-right: 6px;
`;

const StatText = styled.p`
  color: #797f94;
  font-size: 14px;
  font-weight: 500;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
`;
