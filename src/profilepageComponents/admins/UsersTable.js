// src/profilepageComponents/admins/UsersTable.js
import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getPrimaryRole, ROLE_ADMIN, ROLE_CUSTOMS, ROLE_IMPORTER, ROLE_USER } from "../../config/roles";

const getRoleLabel = (t, authorities) => {
  switch (getPrimaryRole(authorities)) {
    case ROLE_ADMIN:
      return t("RoleBadge_Administrator");
    case ROLE_CUSTOMS:
      return t("RoleBadge_CustomsOfficer");
    case ROLE_IMPORTER:
      return t("RoleBadge_Importer");
    case ROLE_USER:
      return t("RoleBadge_Individual");
    default:
      return "-";
  }
};

const UsersTable = ({ data }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleRowClick = (userId) => {
    navigate(`/profile/role_admin/UserDetails/${userId}`);
  };

  return (
    <UsersTableContainer>
      <Table>
        <thead>
          <TableRow>
            <TableHeader>{t("Input_FullName")}</TableHeader>
            <TableHeader>{t("Role")}</TableHeader>
            <TableHeader>{t("Email")}</TableHeader>
            <TableHeader>{t("Phone Number")}</TableHeader>
            <TableHeader>{t("Account Status")}</TableHeader>
          </TableRow>
        </thead>
        <tbody>
          {data && data.length > 0 ? (
            data.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <NameButton
                    type="button"
                    onClick={() => handleRowClick(user.id)}
                  >
                    {[user.firstName, user.lastName].filter(Boolean).join(" ") || "-"}
                  </NameButton>
                </TableCell>
                <TableCell>
                  <RolePill $role={getPrimaryRole(user.authorities)}>
                    {getRoleLabel(t, user.authorities)}
                  </RolePill>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phoneNumber}</TableCell>
                <TableCell>
                  <StatusBadge status={user.status}>
                    {t(user.status)}
                  </StatusBadge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan="5">{t("No data available")}</TableCell>
            </TableRow>
          )}
        </tbody>
      </Table>
    </UsersTableContainer>
  );
};

export default UsersTable;

const UsersTableContainer = styled.div`
  width: 100%;
  flex: 1;
  min-height: 360px;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  height: 100%;
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
  vertical-align: middle;
`;

const ROLE_PILL = {
  [ROLE_ADMIN]: { bg: "#efedfe", fg: "#5b21b6" },
  [ROLE_CUSTOMS]: { bg: "#e1f5ee", fg: "#0f6e56" },
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

  &:hover {
    text-decoration: underline;
  }
`;

const StatusBadge = styled.span`
  padding: 7px 10px;
  border-radius: 40px;
  font-size: 14px;
  background-color: ${(props) =>
    props.status === "APPROVED"
      ? "rgba(0, 149, 63, 0.07)"
      : props.status === "PENDING"
      ? "rgba(252, 116, 19, 0.07)"
      : props.status === "REJECTED"
      ? "rgba(236, 1, 26, 0.07)"
      : props.status === "DISABLED"
      ? "#F7F7F7"
      : "transparent"};
  color: ${(props) =>
    props.status === "APPROVED"
      ? "#00953F"
      : props.status === "PENDING"
      ? "#FC7413"
      : props.status === "REJECTED"
      ? "#EC011A"
      : props.status === "DISABLED"
      ? "#9098A0"
      : "black"};
`;
