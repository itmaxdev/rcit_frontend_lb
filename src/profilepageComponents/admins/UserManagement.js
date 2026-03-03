// src/profilepageComponents/admins/UserManagement.js
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { fetchPendingEntities } from "../../functions/admin";

import UsersTable from "./UsersTable";
import chevronSVG from "../../assets/chevron-down.svg";

const UserManagement = () => {
  const { t } = useTranslation();
  const [accountType, setAccountType] = useState("Importer");
  const [usersData, setUsersData] = useState([]);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    fetchData();
  }, [accountType, currentPage, pageSize]);

  const fetchData = async () => {
    const isUser = accountType === "Individual";
    const data = await fetchPendingEntities(
      isUser,
      currentPage,
      pageSize,
      setTotalElements
    );
    setUsersData(data || []);
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    if (!isNaN(newSize) && newSize > 0) {
      setPageSize(newSize);
      setCurrentPage(0);
    }
  };

  return (
    <UserManagementContainer>
      <Title>{t("UserManagement_Title")}</Title>
      <Subtext>{t("UserManagement_SubText")}</Subtext>

      <UsersContainer>
        <TopBar>
          <ChoiceContainer>
            <Button
              selected={accountType === "Importer"}
              onClick={() => setAccountType("Importer")}
            >
              {t("SignupPage_Importer")}
            </Button>
            <Button
              selected={accountType === "Individual"}
              onClick={() => setAccountType("Individual")}
            >
              {t("SignupPage_Individual")}
            </Button>
          </ChoiceContainer>
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
                    (currentPage + 1) * pageSize < totalElements ? 1 : 0.5,
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
              defaultValue={20}
              onChange={handlePageSizeChange}
              min="1"
            />
          </Pagination>
        </TopBar>

        <UsersTable data={usersData} />
      </UsersContainer>
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
  color: #23863A;
  margin-bottom: 10px;
`;

const Subtext = styled.p`
  font-size: 16px;
  margin-bottom: 30px;
`;

const UsersContainer = styled.div`
  display: flex;
  border-radius: 12px;
  border: 1px solid #eaebef;
  padding: 20px 20px 0 20px;
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

const ChoiceContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-right: auto;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Button = styled.button`
  cursor: pointer;
  display: flex;
  padding: 15px 50px;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  background: white;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
  background: #f5f6fa;

  border: ${({ selected }) =>
    selected ? "1px solid #23863A" : "1px solid #f5f6fa"};
  color: ${({ selected }) => (selected ? "#23863A" : "#20294C")};
  transition: all 0.3s ease;

  &:hover {
    opacity: 0.7;
  }
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
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

const PageSize = styled.input`
  width: 50px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  text-align: center;
`;
