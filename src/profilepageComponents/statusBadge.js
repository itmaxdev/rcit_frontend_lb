import React from "react";
import styled from "styled-components";

import flag from "../assets/flag.svg";

export const STATUS_STYLES = {
  SUBMITTED: {
    background: "rgba(22, 114, 192, 0.07)",
    color: "#1672C0",
  },
  UNDER_REVIEW: {
    background: "rgba(255, 149, 0, 0.07)",
    color: "#FF9500",
  },
  APPROVED: {
    background: "rgba(0, 149, 63, 0.07)",
    color: "#00953F",
  },
  DECLINED: {
    background: "rgba(222, 22, 22, 0.07)",
    color: "#DE1616",
  },
  AWAITING_PAYMENT: {
    background: "rgba(222, 22, 22, 0.07)",
    color: "#DE1616",
    icon: "flag",
    iconColor: "#e03d3d",
  },
  PAID: {
    background: "#eef6ef",
    color: "#516275",
  },
  CLOSED: {
    background: "#eef2f8",
    color: "#516275",
    icon: "lock",
    iconColor: "#516275",
  },
};

export const StatusIcon = ({ status }) => {
  const style = STATUS_STYLES[status];
  if (!style?.icon) return null;
  const { icon, iconColor } = style;

  if (icon === "dot") {
    return <StatusDot $color={iconColor} />;
  }

  if (icon === "clock") {
    return (
      <StatusSvg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6" stroke={iconColor} strokeWidth="1.4" />
        <path
          d="M8 4.8V8.2L10.3 9.5"
          stroke={iconColor}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </StatusSvg>
    );
  }

  if (icon === "check") {
    return (
      <StatusSvg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M3.5 8.3L6.5 11.1L12.5 4.9"
          stroke={iconColor}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </StatusSvg>
    );
  }

  if (icon === "cross") {
    return (
      <StatusSvg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M4.5 4.5L11.5 11.5" stroke={iconColor} strokeWidth="1.7" strokeLinecap="round" />
        <path d="M11.5 4.5L4.5 11.5" stroke={iconColor} strokeWidth="1.7" strokeLinecap="round" />
      </StatusSvg>
    );
  }

  if (icon === "flag") {
    return (
      <img src={flag} alt="" />
    );
  }

  if (icon === "lock") {
    return (
      <StatusSvg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="4" y="7" width="8" height="6" rx="1.6" stroke={iconColor} strokeWidth="1.4" />
        <path
          d="M5.8 7V5.8C5.8 4.59 6.79 3.6 8 3.6C9.21 3.6 10.2 4.59 10.2 5.8V7"
          stroke={iconColor}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </StatusSvg>
    );
  }

  return null;
};

export const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  background: ${({ $status }) => STATUS_STYLES[$status]?.background || "rgba(22, 114, 192, 0.07)"};
  color: ${({ $status }) => STATUS_STYLES[$status]?.color || "#1672C0"};
`;

export const StatusDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

export const StatusSvg = styled.svg`
  width: 14px;
  height: 14px;
  flex-shrink: 0;
`;
