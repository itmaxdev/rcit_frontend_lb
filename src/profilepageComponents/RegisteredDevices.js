// src/profilepageComponents/RegisteredDevices.js
import React, { useState, useEffect, useContext } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { fetchRegisteredDevices } from "../functions/registered";
import { Context } from "../Context";

import DevicesTable from "./DevicesTable";
import chevronSVG from "../assets/chevron-down.svg";
import emptySVG from "../assets/noRegistered.svg";
import plusSVG from "../assets/plus.svg";
import searchSVG from "../assets/search3.svg";

const RegisteredDevices = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { accountType } = useContext(Context);

  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    fetchDevices();
  }, [currentPage, pageSize]);

  const fetchDevices = async () => {
    const response = await fetchRegisteredDevices(
      currentPage + 1,
      pageSize,
      search,
      null,
      accountType === "ROLE_ADMIN"
    );
    if (response) {
      setData(response.data);
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

  const handleButton = () => {
    if (accountType === "ROLE_IMPORTER") {
      navigate("/profile/role_importer/RegisterDevices");
    } else if (accountType === "ROLE_USER") {
      navigate("/profile/role_user/RegisterDevices");
    } else {
      navigate("/");
    }
  };

  if (totalElements === 0 || !totalElements) {
    return (
      <EmptyStateContainer>
        <EmptyStateSVG src={emptySVG} alt="No data" />
        <EmptyStateTitle>
          {t("NoDevices_Title1")}
          <br />
          {accountType !== "ROLE_ADMIN" && <span>{t("NoDevices_Title2")}</span>}
        </EmptyStateTitle>
        {accountType !== "ROLE_ADMIN" && (
          <Button onClick={handleButton}>{t("Start Registration")}</Button>
        )}
      </EmptyStateContainer>
    );
  }

  return (
    <RegisteredDevicesContainer>
      <Header>
        <TextContainer>
          <Title>{t("RegisteredDevices_Title")}</Title>
          <Subtext>{t("RegisteredDevices_Subtitle")}</Subtext>
        </TextContainer>
        {accountType !== "ROLE_ADMIN" && (
          <Button onClick={handleButton}>
            <img src={plusSVG} alt="Plus" />
            {t("RegisteredDevices_AddButton")}
          </Button>
        )}
      </Header>

      <TableContainer>
        <Header>
          <SearchBarWrapper>
            <SearchIcon
              onClick={() => fetchDevices()}
              src={searchSVG}
              alt="Search"
            />
            <TextInput
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  fetchDevices();
                }
              }}
            />
          </SearchBarWrapper>
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
        </Header>

        <DevicesTable data={data} isAdmin={accountType === "ROLE_ADMIN"} />
      </TableContainer>
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

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: #23863A;
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
  background: #23863A;
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

const TableContainer = styled.div`
  border-radius: 12px;
  border: 1px solid #d4d6df;
  background: #fff;
  padding: 20px 20px 5px 20px;
  width: 100%;
  height: 100%;
  overflow: hidden;
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

const PageSize = styled.input`
  width: 50px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  text-align: center;
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
  width: 229px;
  padding: 8px 16px;
  align-items: center;
  gap: 4px;
  border-radius: 1000px;
  border: 1px solid #d4d6df;
`;

const SearchIcon = styled.img`
  width: 16px;
  height: 16px;
  cursor: pointer;

  &:hover {
    opacity: 0.7;
  }
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
