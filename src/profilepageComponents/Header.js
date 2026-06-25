// src/profilepageComponents/Header.js
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Context } from "../Context";
import { fetchUserSummary } from "../functions/profile";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../functions/notifications";
import {
  ROLE_ADMIN,
  ROLE_CUSTOMS,
  ROLE_TELECOM,
  ROLE_IMPORTER,
  ROLE_USER,
} from "../config/roles";

import globeSvg from "../assets/globe.svg";
import bellSvg from "../assets/bell.svg";
import supportSvg from "../assets/support.svg";

const Header = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { accountType } = useContext(Context);
  const [userSummary, setUserSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationMenuRef = useRef(null);
  const isHeaderMountedRef = useRef(false);
  const notificationsRef = useRef([]);
  const processingNotificationIdsRef = useRef(new Set());

  const segments = location.pathname.split("/").filter(Boolean);
  const title = getHeaderTitle(t, segments, accountType);
  const accountBadge = getAccountBadge(t, accountType, userSummary);
  const headerTheme = getHeaderTheme(accountType);
  const workspaceLabel = accountBadge?.roleLabel
    ? t("Header_Workspace", { role: accountBadge.roleLabel })
    : "";
  const supportPath = getSupportPath(accountType);
  const accountChipPath = getAccountChipPath(accountType);

  useEffect(() => {
    isHeaderMountedRef.current = true;
    return () => {
      isHeaderMountedRef.current = false;
    };
  }, []);

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

  const loadNotifications = useCallback(async () => {
    if (!accountType || accountType === "Unknown") {
      if (isHeaderMountedRef.current) {
        notificationsRef.current = [];
        setNotifications([]);
        setUnreadCount(0);
        setIsNotificationsOpen(false);
      }
      return;
    }

    const data = await fetchNotifications();
    if (!data || !isHeaderMountedRef.current) {
      return;
    }

    const nextNotifications = Array.isArray(data?.notifications)
      ? data.notifications
      : [];
    notificationsRef.current = nextNotifications;
    setNotifications(nextNotifications);
    setUnreadCount(data?.unreadCount || 0);
  }, [accountType]);

  useEffect(() => {
    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 30000);

    return () => window.clearInterval(intervalId);
  }, [loadNotifications]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      if (processingNotificationIdsRef.current.has(notification.id)) {
        return;
      }

      processingNotificationIdsRef.current.add(notification.id);
      try {
        const updatedNotification = await markNotificationRead(notification.id);
        if (!updatedNotification) {
          await loadNotifications();
          return;
        }

        const wasUnread = notificationsRef.current.some(
          (currentNotification) =>
            currentNotification.id === notification.id && !currentNotification.read
        );

        const nextNotifications = notificationsRef.current.map(
          (currentNotification) =>
            currentNotification.id === notification.id
              ? { ...currentNotification, ...updatedNotification, read: true }
              : currentNotification
        );
        notificationsRef.current = nextNotifications;
        setNotifications(nextNotifications);

        if (wasUnread) {
          setUnreadCount((currentUnreadCount) =>
            Math.max(currentUnreadCount - 1, 0)
          );
        }
      } finally {
        processingNotificationIdsRef.current.delete(notification.id);
      }
    }

    await loadNotifications();
    setIsNotificationsOpen(false);

    if (notification.targetPath) {
      navigate(notification.targetPath);
    }
  };

  const handleMarkAllRead = async () => {
    const success = await markAllNotificationsRead();
    if (success) {
      const nextNotifications = notificationsRef.current.map(
        (currentNotification) => ({
          ...currentNotification,
          read: true,
        })
      );
      notificationsRef.current = nextNotifications;
      setNotifications(nextNotifications);
      setUnreadCount(0);
      await loadNotifications();
    }
  };

  return (
    <HeaderContainer $theme={headerTheme}>
      <TitleGroup>
        <Title>{title}</Title>
        {workspaceLabel ? (
          <WorkspacePill $theme={headerTheme}>{workspaceLabel}</WorkspacePill>
        ) : null}
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
        <NotificationMenu ref={notificationMenuRef}>
          <NotificationButton
            type="button"
            onClick={() => setIsNotificationsOpen((isOpen) => !isOpen)}
            aria-label={t("Notifications_Title")}
          >
            <NotificationIcon src={bellSvg} alt="" aria-hidden="true" />
            {unreadCount > 0 ? (
              <NotificationBadge>{unreadCount > 9 ? "9+" : unreadCount}</NotificationBadge>
            ) : null}
          </NotificationButton>
          {isNotificationsOpen ? (
            <NotificationDropdown>
              <NotificationHeader>
                <NotificationTitle>{t("Notifications_Title")}</NotificationTitle>
                {unreadCount > 0 ? (
                  <MarkAllButton type="button" onClick={handleMarkAllRead}>
                    {t("Notifications_MarkAllRead")}
                  </MarkAllButton>
                ) : null}
              </NotificationHeader>
              {notifications.length > 0 ? (
                <NotificationList>
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      $unread={!notification.read}
                    >
                      <NotificationItemTop>
                        <NotificationItemTitle>{notification.title}</NotificationItemTitle>
                        <NotificationStatus $read={notification.read}>
                          {notification.read
                            ? t("Notifications_Read")
                            : t("Notifications_Unread")}
                        </NotificationStatus>
                      </NotificationItemTop>
                      <NotificationMessage>{notification.message}</NotificationMessage>
                      <NotificationTime>
                        {formatNotificationTime(notification.createdAt)}
                      </NotificationTime>
                    </NotificationItem>
                  ))}
                </NotificationList>
              ) : (
                <NotificationEmpty>{t("Notifications_Empty")}</NotificationEmpty>
              )}
            </NotificationDropdown>
          ) : null}
        </NotificationMenu>
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
              <AccountChip $theme={headerTheme}>
                <AccountIconCircle aria-hidden="true">
                  <AccountIcon viewBox="0 0 24 24">
                    <path d="M6.57757 15.4816C5.1628 16.324 1.45336 18.0441 3.71266 20.1966C4.81631 21.248 6.04549 22 7.59087 22H16.4091C17.9545 22 19.1837 21.248 20.2873 20.1966C22.5466 18.0441 18.8372 16.324 17.4224 15.4816C14.1048 13.5061 9.89519 13.5061 6.57757 15.4816Z" />
                    <path d="M16.5 6.5C16.5 8.98528 14.4853 11 12 11C9.51472 11 7.5 8.98528 7.5 6.5C7.5 4.01472 9.51472 2 12 2C14.4853 2 16.5 4.01472 16.5 6.5Z" />
                  </AccountIcon>
                </AccountIconCircle>
                <AccountText>
                  <AccountName>{accountBadge.name}</AccountName>
                </AccountText>
              </AccountChip>
            </AccountChipLink>
          ) : (
            <AccountChip $theme={headerTheme}>
              <AccountIconCircle aria-hidden="true">
                <AccountIcon viewBox="0 0 24 24">
                  <path d="M6.57757 15.4816C5.1628 16.324 1.45336 18.0441 3.71266 20.1966C4.81631 21.248 6.04549 22 7.59087 22H16.4091C17.9545 22 19.1837 21.248 20.2873 20.1966C22.5466 18.0441 18.8372 16.324 17.4224 15.4816C14.1048 13.5061 9.89519 13.5061 6.57757 15.4816Z" />
                  <path d="M16.5 6.5C16.5 8.98528 14.4853 11 12 11C9.51472 11 7.5 8.98528 7.5 6.5C7.5 4.01472 9.51472 2 12 2C14.4853 2 16.5 4.01472 16.5 6.5Z" />
                </AccountIcon>
              </AccountIconCircle>
              <AccountText>
                <AccountName>{accountBadge.name}</AccountName>
              </AccountText>
            </AccountChip>
          ))}
      </ButtonsContainer>
    </HeaderContainer>
  );
};

export default Header;

const formatNotificationTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getHeaderTitle = (t, segments, accountType) => {
  const lastSegment = segments[segments.length - 1] || "";
  const previousSegment = segments[segments.length - 2] || "";
  const isNumericSegment = /^\d+$/.test(lastSegment);

  if (accountType === ROLE_IMPORTER && lastSegment === "DeclareDevices") {
    return t("Header_MyDeclarations");
  }

  if (accountType === ROLE_USER && lastSegment === "DeclareDevices") {
    return t("Header_MyDeclarations");
  }

  if (
    (accountType === ROLE_CUSTOMS || accountType === ROLE_TELECOM) &&
    lastSegment === "Declaration"
  ) {
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
    case ROLE_TELECOM:
      return t("RoleBadge_TelecomOfficer");
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

const DEFAULT_HEADER_THEME = {
  accent: "#436c4d",
  background: "linear-gradient(135deg, #f5f8f5 0%, #f5f6fa 72%)",
  border: "#e4ebdf",
  pillBackground: "rgba(67, 108, 77, 0.12)",
  pillColor: "#436c4d",
  chipBackground: "#20232c",
};

const getHeaderTheme = (accountType) => {
  switch (accountType) {
    case ROLE_ADMIN:
      return {
        accent: "#8a5a12",
        background: "linear-gradient(135deg, #fff7e9 0%, #f5f6fa 72%)",
        border: "#f0dfbd",
        pillBackground: "rgba(138, 90, 18, 0.14)",
        pillColor: "#8a5a12",
        chipBackground: "#2c2519",
      };
    case ROLE_CUSTOMS:
      return {
        accent: "#436c4d",
        background: "linear-gradient(135deg, #f0f8f2 0%, #f5f6fa 72%)",
        border: "#dce9df",
        pillBackground: "rgba(67, 108, 77, 0.14)",
        pillColor: "#365f40",
        chipBackground: "#1f2a23",
      };
    case ROLE_TELECOM:
      return {
        accent: "#0f6e8c",
        background: "linear-gradient(135deg, #e9f6fb 0%, #f5f6fa 72%)",
        border: "#cfe7f0",
        pillBackground: "rgba(15, 110, 140, 0.14)",
        pillColor: "#0f6e8c",
        chipBackground: "#16313a",
      };
    case ROLE_IMPORTER:
      return {
        accent: "#225fb8",
        background: "linear-gradient(135deg, #edf5ff 0%, #f5f6fa 72%)",
        border: "#d7e5f8",
        pillBackground: "rgba(34, 95, 184, 0.12)",
        pillColor: "#225fb8",
        chipBackground: "#1d2638",
      };
    case ROLE_USER:
      return {
        accent: "#7a4d9c",
        background: "linear-gradient(135deg, #f8f1ff 0%, #f5f6fa 72%)",
        border: "#eadcf5",
        pillBackground: "rgba(122, 77, 156, 0.13)",
        pillColor: "#6d438f",
        chipBackground: "#282133",
      };
    default:
      return DEFAULT_HEADER_THEME;
  }
};

const getSupportPath = (accountType) => {
  switch (accountType) {
    case ROLE_ADMIN:
      return "/profile/role_admin/Help";
    case ROLE_CUSTOMS:
    case ROLE_TELECOM:
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
    case ROLE_TELECOM:
      return "/profile/role_customs/Profile";
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
  background: ${({ $theme }) => $theme.background};
  border-bottom: 1px solid ${({ $theme }) => $theme.border};
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

const WorkspacePill = styled.span`
  flex: 0 0 auto;
  padding: 6px 11px;
  border-radius: 999px;
  background: ${({ $theme }) => $theme.pillBackground};
  color: ${({ $theme }) => $theme.pillColor};
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.01em;
  white-space: nowrap;
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

const NotificationMenu = styled.div`
  position: relative;
  display: inline-flex;
`;

const NotificationButton = styled.button`
  position: relative;
  display: inline-flex;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(32, 41, 76, 0.12);
  }
`;

const NotificationIcon = styled.img`
  width: 28px;
  height: 28px;
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: -3px;
  right: -3px;
  min-width: 17px;
  height: 17px;
  padding: 0 5px;
  border-radius: 999px;
  background: #d53f3f;
  color: #fff;
  border: 2px solid #f5f6fa;
  font-size: 10px;
  font-weight: 800;
  line-height: 13px;
`;

const NotificationDropdown = styled.div`
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 50;
  width: min(360px, calc(100vw - 32px));
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid #e5e8f0;
  background: #fff;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.18);
`;

const NotificationHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #eef1f6;
`;

const NotificationTitle = styled.h3`
  font-size: 14px;
  font-weight: 800;
  color: #20294c;
`;

const MarkAllButton = styled.button`
  border: none;
  background: transparent;
  color: #436c4d;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
`;

const NotificationList = styled.div`
  max-height: 340px;
  overflow-y: auto;
`;

const NotificationItem = styled.button`
  width: 100%;
  border: none;
  border-bottom: 1px solid #eef1f6;
  background: ${({ $unread }) => ($unread ? "#f7fbf8" : "#fff")};
  padding: 13px 16px;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: #f5f6fa;
  }
`;

const NotificationItemTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const NotificationItemTitle = styled.div`
  color: #20294c;
  font-size: 13px;
  font-weight: 800;
`;

const NotificationStatus = styled.span`
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 3px 8px;
  color: ${({ $read }) => ($read ? "#6f7895" : "#1e8d4d")};
  background: ${({ $read }) => ($read ? "#f1f3f7" : "rgba(30, 141, 77, 0.1)")};
  font-size: 10px;
  font-weight: 800;
`;

const NotificationMessage = styled.p`
  margin-top: 5px;
  color: #5f6b88;
  font-size: 12px;
  line-height: 1.45;
`;

const NotificationTime = styled.span`
  display: inline-block;
  margin-top: 8px;
  color: #8a95b5;
  font-size: 11px;
  font-weight: 600;
`;

const NotificationEmpty = styled.div`
  padding: 28px 18px;
  color: #7b849d;
  text-align: center;
  font-size: 13px;
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
  gap: 10px;
  min-width: 0;
  padding: 9px 16px 9px 10px;
  border-radius: 999px;
  background: ${({ $theme }) => $theme.chipBackground};
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
  line-height: 1.15;
`;

const AccountName = styled.span`
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
`;
