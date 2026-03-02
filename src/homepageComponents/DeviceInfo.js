// src/homepageComponents/DeviceInfo.js
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Context } from "../Context";

import img from "../assets/phone.png";
import valid from "../assets/valid.svg";
import alert from "../assets/alert.svg";
import invalid from "../assets/invalid.svg";

const DeviceInfo = ({ device }) => {
  const { t } = useTranslation();
  const { isLoggedIn, accountType } = useContext(Context);

  const getIcon = (validity) => {
    switch (validity) {
      case "valid":
        return valid;
      case "unregistered":
        return alert;
      case "invalid":
        return invalid;
      default:
        return "";
    }
  };

  return (
    <DeviceInfoContainer>
      <Img src={img} alt="Device" />
      <InfoContainer>
        <Model>{device.Model}</Model>
        <Validity validity={device.Validity}>
          <SVG src={getIcon(device.Validity)} alt="status icon" />
          {device.Validity === "valid" && t("DeviceInfo_Valid")}
          {device.Validity === "unregistered" && (
            <>
              {t("DeviceInfo_Unregistered")}
              <Link
                to={
                  isLoggedIn
                    ? `/profile/${accountType}/DeclareDevices`
                    : "/signup"
                }
              >
                <DeclareButton>{t("Header_DeclareNow")}</DeclareButton>
              </Link>
            </>
          )}
          {device.Validity === "invalid" && t("DeviceInfo_Invalid")}
        </Validity>
        <DetailsContainer>
          <Header>{t("DeviceInfo_Details")}</Header>
          <Row>
            <Element>
              <Subheader>{t("DeviceInfo_BrandModel")}</Subheader>
              <Value>{device.Model || ""}</Value>
            </Element>
            <Element>
              <Subheader>{t("DeviceInfo_Type")}</Subheader>
              <Value>{device.Type || "-"}</Value>
            </Element>
            <Element>
              <Subheader>{t("DeviceInfo_Manufacturer")}</Subheader>
              <Value>{device.Manufacturer || "-"}</Value>
            </Element>
            <Element>
              <Subheader>{t("DeviceInfo_Status")}</Subheader>
              {device.Status && <Status>{device.Status}</Status>}
            </Element>
          </Row>
        </DetailsContainer>
      </InfoContainer>
    </DeviceInfoContainer>
  );
};

export default DeviceInfo;

const DeviceInfoContainer = styled.div`
  display: flex;
  padding: 30px;
  gap: 30px;
  border-radius: 20px;
  background-color: #fff;
  margin: 50px;
`;

const Img = styled.img`
  height: 200px;
`;

const InfoContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const Model = styled.div`
  font-size: 22px;
  font-weight: 700;
`;

const Subheader = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: #797f94;
`;

const Validity = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  border-radius: 14px;
  padding: 10px;
  margin: 15px 0;
  background-color: ${({ validity }) =>
    validity === "valid"
      ? "rgba(0, 149, 63, 0.05)"
      : validity === "unregistered"
      ? "rgba(252, 116, 19, 0.05)"
      : "rgba(255, 0, 0, 0.05)"};
  color: ${({ validity }) =>
    validity === "valid"
      ? "#00953F"
      : validity === "unregistered"
      ? "#FC7413"
      : "#FF0000"};
`;

const SVG = styled.img`
  width: 20px;
`;

const DeclareButton = styled.button`
  background-color: #fc7413;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 56px;
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 0.7;
  }
`;

const DetailsContainer = styled.div`
  display: flex;
  padding: 24px;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 20px;
  border-radius: 14px;
  background: #f7f7f7;
`;

const Header = styled.div`
  font-size: 16px;
  font-weight: 700;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  width: 95%;
  gap: 10px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
  }
`;

const Element = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Value = styled.div`
  font-size: 14px;
  font-weight: 700;
`;

const Status = styled.div`
  border-radius: 40px;
  border: 1px solid #00953f;
  display: flex;
  padding: 2px 10px;
  justify-content: center;
  align-items: center;
  color: #00953f;
  font-size: 14px;
  font-weight: 600;
`;
