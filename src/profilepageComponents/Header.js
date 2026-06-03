// src/profilepageComponents/Header.js
import React, { useContext, useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { Context } from "../Context";
import { fetchUserSummary } from "../functions/profile";
import {
  ROLE_ADMIN,
  ROLE_CUSTOMS,
  ROLE_IMPORTER,
  ROLE_USER,
} from "../config/roles";

import globeSvg from "../assets/globe.svg";
import bellSvg from "../assets/bell.svg";
import supportSvg from "../assets/support.svg";

const Header = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { accountType } = useContext(Context);
  const [userSummary, setUserSummary] = useState(null);

  const segments = location.pathname.split("/").filter(Boolean);
  const title = getHeaderTitle(t, segments, accountType);
  const accountBadge = getAccountBadge(t, accountType, userSummary);
  const supportPath = getSupportPath(accountType);
  const accountChipPath = getAccountChipPath(accountType);

  useEffect(() => {
    let isMounted = true;

    const loadUserSummary = async () => {
      const summary = await fetchUserSummary();
      if (isMounted) {
        setUserSummary(summary);
      }
    };

    if (accountType && accountType !== "Unknown") {
      loadUserSummary();
    }

    return () => {
      isMounted = false;
    };
  }, [accountType]);

  return (
    <HeaderContainer>
      <TitleGroup>
        <Title>{title}</Title>
      </TitleGroup>
      <ButtonsContainer>
        {supportPath ? (
          <Link to={supportPath}>
            <Support>
              <img src={supportSvg} alt="Support" />
              {t("Sidebar_ContactSupport")}
            </Support>
          </Link>
        ) : (
          <Support as="div">
            <img src={supportSvg} alt="Support" />
            {t("Sidebar_ContactSupport")}
          </Support>
        )}
        <Button src={bellSvg} alt="Notifications" style={{ width: "35px" }} />
        <LanguageButton
          onClick={() =>
            i18n.changeLanguage(i18n.resolvedLanguage === "en" ? "fr" : "en")
          }
        >
          <img src={globeSvg} alt="Language" />
          {i18n.resolvedLanguage === "en" ? "EN" : "FR"}
        </LanguageButton>
        {accountBadge &&
          (accountChipPath ? (
            <AccountChipLink to={accountChipPath}>
              <AccountChip>
                <AccountIconCircle aria-hidden="true">
                  <AccountIcon viewBox="0 0 24 24">
                    <path d="M6.57757 15.4816C5.1628 16.324 1.45336 18.0441 3.71266 20.1966C4.81631 21.248 6.04549 22 7.59087 22H16.4091C17.9545 22 19.1837 21.248 20.2873 20.1966C22.5466 18.0441 18.8372 16.324 17.4224 15.4816C14.1048 13.5061 9.89519 13.5061 6.57757 15.4816Z" />
                    <path d="M16.5 6.5C16.5 8.98528 14.4853 11 12 11C9.51472 11 7.5 8.98528 7.5 6.5C7.5 4.01472 9.51472 2 12 2C14.4853 2 16.5 4.01472 16.5 6.5Z" />
                  </AccountIcon>
                </AccountIconCircle>
                <AccountText>
                  <AccountName>{accountBadge.name}</AccountName>
                  <AccountRole>{accountBadge.roleLabel}</AccountRole>
                </AccountText>
              </AccountChip>
            </AccountChipLink>
          ) : (
            <AccountChip>
              <AccountIconCircle aria-hidden="true">
                <AccountIcon viewBox="0 0 24 24">
                  <path d="M6.57757 15.4816C5.1628 16.324 1.45336 18.0441 3.71266 20.1966C4.81631 21.248 6.04549 22 7.59087 22H16.4091C17.9545 22 19.1837 21.248 20.2873 20.1966C22.5466 18.0441 18.8372 16.324 17.4224 15.4816C14.1048 13.5061 9.89519 13.5061 6.57757 15.4816Z" />
                  <path d="M16.5 6.5C16.5 8.98528 14.4853 11 12 11C9.51472 11 7.5 8.98528 7.5 6.5C7.5 4.01472 9.51472 2 12 2C14.4853 2 16.5 4.01472 16.5 6.5Z" />
                </AccountIcon>
              </AccountIconCircle>
              <AccountText>
                <AccountName>{accountBadge.name}</AccountName>
                <AccountRole>{accountBadge.roleLabel}</AccountRole>
              </AccountText>
            </AccountChip>
          ))}
      </ButtonsContainer>
    </HeaderContainer>
  );
};

export default Header;

const getHeaderTitle = (t, segments, accountType) => {
  const lastSegment = segments[segments.length - 1] || "";
  const previousSegment = segments[segments.length - 2] || "";
  const isNumericSegment = /^\d+$/.test(lastSegment);

  if (accountType === ROLE_IMPORTER && lastSegment === "DeclareDevices") {
    return t("Header_MyDeclarations");
  }

  if (accountType === ROLE_USER && lastSegment === "DeclareDevices") {
    return t("Header_MyDevices");
  }

  if (accountType === ROLE_CUSTOMS && lastSegment === "Declaration") {
    return t("Sidebar_Declarations");
  }

  if (previousSegment === "UserDetails") {
    return t("Sidebar_UserDetails");
  }

  if (isNumericSegment && previousSegment === "DeclareDevices") {
    return t("Declaration Status");
  }

  if (isNumericSegment && previousSegment) {
    return t(`Sidebar_${previousSegment}`);
  }

  return t(`Sidebar_${lastSegment}`);
};

const getRoleLabel = (t, accountType) => {
  switch (accountType) {
    case ROLE_CUSTOMS:
      return t("RoleBadge_CustomsOfficer");
    case ROLE_IMPORTER:
      return t("RoleBadge_Importer");
    case ROLE_USER:
      return t("RoleBadge_Individual");
    case ROLE_ADMIN:
      return t("RoleBadge_Administrator");
    default:
      return null;
  }
};

const getAccountBadge = (t, accountType, userSummary) => {
  const roleLabel = getRoleLabel(t, accountType);
  if (!roleLabel) {
    return null;
  }

  const firstName = userSummary?.firstName?.trim() || "";
  const lastName = userSummary?.lastName?.trim() || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const fallbackName =
    userSummary?.companyName?.trim() ||
    userSummary?.email?.trim() ||
    roleLabel;

  return {
    name: fullName || fallbackName,
    roleLabel,
  };
};

const getSupportPath = (accountType) => {
  switch (accountType) {
    case ROLE_ADMIN:
      return "/profile/role_admin/Help";
    case ROLE_CUSTOMS:
      return "/profile/role_customs/Help";
    case ROLE_IMPORTER:
    case ROLE_USER:
      return `/profile/${accountType.toLowerCase()}/Help`;
    default:
      return null;
  }
};

const getAccountChipPath = (accountType) => {
  switch (accountType) {
    case ROLE_USER:
    case ROLE_IMPORTER:
    case ROLE_CUSTOMS:
      return `/profile/${accountType.toLowerCase()}/Profile`;
    default:
      return null;
  }
};

const HeaderContainer = styled.div`
  display: flex;
  width: 100%;
  min-height: 75px;
  justify-content: space-between;
  align-items: center;
  gap: 12px 20px;
  flex-wrap: wrap;
  background: #f5f6fa;
  padding: 15px 30px;
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1 1 220px;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 0 1 auto;
  flex-wrap: wrap;
  gap: 14px;
  min-width: 0;
`;

const Support = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  text-decoration-line: underline;
  white-space: nowrap;
`;

const Button = styled.img`
  border-radius: 50%;
  cursor: pointer;
  border-radius: 50px;
  background: #fff;
  padding: 5px;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.1);
  }
`;

const LanguageButton = styled.div`
  cursor: pointer;
  display: flex;
  padding: 6px 10px 6px 6px;
  gap: 6px;
  border-radius: 40px;
  background: #fff;
  white-space: nowrap;
`;

const AccountChipLink = styled(Link)`
  text-decoration: none;
`;

const AccountChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 8px 14px 8px 10px;
  border-radius: 999px;
  background: #20232c;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14);
  color: #fff;
`;

const AccountIconCircle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #fff;
  border: 1px solid rgba(232, 236, 245, 0.95);
`;

const AccountIcon = styled.svg`
  width: 16px;
  height: 16px;
  fill: none;
  stroke: #20232c;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

const AccountText = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.1;
`;

const AccountName = styled.span`
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
`;

const AccountRole = styled.span`
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 3px;
  font-size: 10px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.92);
`;
