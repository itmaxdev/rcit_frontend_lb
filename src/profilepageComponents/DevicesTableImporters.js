// src/profilepageComponents/DevicesTable.js
import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { statusColors } from "../functions/badgesColors"


const DevicesTable = ({ data, isAdmin = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleRowClick = (userId) => {
    navigate(`/profile/role_admin/UserDetails/${userId}`);
  };

  return (
    <DevicesTableContainer>
      <Table>
        <thead>
          <TableRow>
            <TableHeader>{t("Nbr of IMEIs")}</TableHeader>
            <TableHeader>{t("IMEIs")}</TableHeader>
            <TableHeader>{t("Brand")}</TableHeader>
            <TableHeader>{t("Model")}</TableHeader>
            <TableHeader>{t("Country of Origin")}</TableHeader>
            <TableHeader>{t("Import Date")}</TableHeader>
            {isAdmin && <TableHeader>{t("User Email")}</TableHeader>}
            <TableHeader>{t("Device Status")}</TableHeader>
            <TableHeader>{t("Value (USD)")}</TableHeader>
            <TableHeader>{t("Customs Duty (USD)")}</TableHeader>
          </TableRow>
        </thead>
        <tbody>
          {data && data.length > 0 ? (
            data.map((device, index) => (
              <TableRow
                key={index}
                onClick={
                  isAdmin ? () => handleRowClick(device.userId) : undefined
                }
                isAdmin={isAdmin}
              >
                <TableCell>{device.imeiCount || 1}</TableCell>
                <TableCell>
                  {device.imei || device.imeis.replace("|", " ") || "-"}
                </TableCell>
                <TableCell>{device.brand || "-"}</TableCell>
                <TableCell>{device.model || "-"}</TableCell>
                <TableCell>{device.country || "-"}</TableCell>
                <TableCell>{device.importDate || "-"}</TableCell>
                {isAdmin && <TableCell>{device.userEmail || "-"}</TableCell>}
                <TableCell>
                  <StatusBadge status={device.status || "Registered"}>
                    {t(device.status || "Registered")}
                  </StatusBadge>
                </TableCell>
                <TableCell>{device.cfi || "-"}</TableCell>
                <TableCell>{device.dutyFee || "-"}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan="7">{t("No data available")}</TableCell>
            </TableRow>
          )}
        </tbody>
      </Table>
    </DevicesTableContainer>
  );
};

export default DevicesTable;

const DevicesTableContainer = styled.div`
  width: 100%;
  border-radius: 8px;
  height: 80%;

  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableRow = styled.tr`
  transition: all 0.2s ease;
  &:hover {
    background-color: #f5f6fa;
    cursor: ${(props) => (props.isAdmin ? "pointer" : "default")};
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
`;

const StatusBadge = styled.span`
  padding: 7px 10px;
  border-radius: 40px;
  font-size: 14px;
  white-space: nowrap;
  background-color: ${(props) => statusColors[props.status]?.bg ?? "transparent"};
  color: ${(props) => statusColors[props.status]?.color ?? "black"};
`;
