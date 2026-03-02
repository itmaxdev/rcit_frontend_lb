// src/profilepageComponents/admins/UsersTable.js
import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import chevronSvg from "../../assets/chevron-down.svg";

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
            <TableHeader>{t("First Name")}</TableHeader>
            <TableHeader>{t("Last Name")}</TableHeader>
            <TableHeader>{t("Email")}</TableHeader>
            <TableHeader>{t("Phone Number")}</TableHeader>
            <TableHeader>{t("Account Status")}</TableHeader>
            <TableHeader></TableHeader>
          </TableRow>
        </thead>
        <tbody>
          {data && data.length > 0 ? (
            data.map((user, index) => (
              <TableRow key={index} onClick={() => handleRowClick(user.id)}>
                <TableCell>{user.firstName}</TableCell>
                <TableCell>{user.lastName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phoneNumber}</TableCell>
                <TableCell>
                  <StatusBadge status={user.status}>
                    {t(user.status)}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  <ChevronIcon src={chevronSvg} alt="Chevron" />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan="7">{t("No data available")}</TableCell>
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
    cursor: pointer;
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

const ChevronIcon = styled.img`
  width: 16px;
  height: 16px;
  display: block;
  margin-left: auto;
  transform: rotate(-90deg);
  opacity: 0.7;
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
