// src/profilepageComponents/DevicesTable.js
import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { statusColors } from "../functions/badgesColors"
import { formatCount } from "../functions/format";
import {
  getPrimaryRole,
  ROLE_ADMIN,
  ROLE_CUSTOMS,
  ROLE_TELECOM,
  ROLE_IMPORTER,
  ROLE_USER,
} from "../config/roles";

const getRoleLabel = (t, role) => {
  switch (role) {
    case ROLE_ADMIN:
      return t("RoleBadge_Administrator");
    case ROLE_CUSTOMS:
      return t("RoleBadge_CustomsOfficer");
    case ROLE_TELECOM:
      return t("RoleBadge_TelecomOfficer");
    case ROLE_IMPORTER:
      return t("RoleBadge_Importer");
    case ROLE_USER:
      return t("RoleBadge_Individual");
    default:
      return "-";
  }
};

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
            <TableHeader>{t("Device Type")}</TableHeader>
            <TableHeader>{t("Country of Origin")}</TableHeader>
            <TableHeader>{t("Declaration Date")}</TableHeader>
            {isAdmin && <TableHeader>{t("Input_FullName")}</TableHeader>}
            {isAdmin && <TableHeader>{t("Role")}</TableHeader>}
            <TableHeader>{t("Device Status")}</TableHeader>
          </TableRow>
        </thead>
        <tbody>
          {data && data.length > 0 ? (
            data.map((device, index) => (
              <TableRow key={device.id || `${device.userId}-${index}`}>
                <TableCell>{formatCount(device.imeiCount || 1)}</TableCell>
                <TableCell>
                  {device.imei || device.imeis?.replace("|", " ") || "-"}
                </TableCell>
                <TableCell>{device.brand || "-"}</TableCell>
                <TableCell>{device.model || "-"}</TableCell>
                <TableCell>{device.technology || "-"}</TableCell>
                <TableCell>{device.country || "-"}</TableCell>
                <TableCell>{device.declarationDate || "-"}</TableCell>
                {isAdmin && (
                  <TableCell>
                    <NameButton
                      type="button"
                      onClick={() => handleRowClick(device.userId)}
                      disabled={!device.userId}
                    >
                      {device.fullName || "-"}
                    </NameButton>
                  </TableCell>
                )}
                {isAdmin && (
                  <TableCell>
                    <RolePill $role={getPrimaryRole(device.role)}>
                      {getRoleLabel(t, getPrimaryRole(device.role))}
                    </RolePill>
                  </TableCell>
                )}
                <TableCell>
                  <StatusBadge status={device.status || "Registered"}>
                    {t(device.status || "Registered")}
                  </StatusBadge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={isAdmin ? "9" : "7"}>
                {t("No data available")}
              </TableCell>
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

const ROLE_PILL = {
  [ROLE_ADMIN]: { bg: "#efedfe", fg: "#5b21b6" },
  [ROLE_CUSTOMS]: { bg: "#e1f5ee", fg: "#0f6e56" },
  [ROLE_TELECOM]: { bg: "#e6f4f9", fg: "#0f6e8c" },
  [ROLE_IMPORTER]: { bg: "#e8f1fe", fg: "#1d4ed8" },
  [ROLE_USER]: { bg: "#f1f2f5", fg: "#5f5e5a" },
};

const RolePill = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  padding: 4px 11px;
  border-radius: 999px;
  white-space: nowrap;
  background: ${(p) => (ROLE_PILL[p.$role] || ROLE_PILL[ROLE_USER]).bg};
  color: ${(p) => (ROLE_PILL[p.$role] || ROLE_PILL[ROLE_USER]).fg};
`;

const NameButton = styled.button`
  border: none;
  background: transparent;
  padding: 0;
  font: inherit;
  color: #2671d9;
  font-weight: 600;
  cursor: pointer;
  text-align: left;

  &:hover:not(:disabled) {
    text-decoration: underline;
  }

  &:disabled {
    color: inherit;
    cursor: default;
  }
`;

const StatusBadge = styled.span`
  padding: 7px 10px;
  border-radius: 40px;
  font-size: 14px;
  white-space: nowrap;
  background-color: ${(props) => statusColors[props.status]?.bg ?? "transparent"};
  color: ${(props) => statusColors[props.status]?.color ?? "black"};
`;
