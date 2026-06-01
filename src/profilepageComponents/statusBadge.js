import React from "react";
import styled from "styled-components";

export const STATUS_STYLES = {
  SUBMITTED: {
    background: "#eef5ff",
    color: "#1f78d8",
  },
  UNDER_REVIEW: {
    background: "#fff5e8",
    color: "#ff9800",
  },
  PENDING_APPROVAL: {
    background: "#fff5e8",
    color: "#ff9800",
  },
  APPROVED: {
    background: "#ebf9ef",
    color: "#0da44b",
  },
  DECLINED: {
    background: "#ffecee",
    color: "#ef3d35",
  },
  AWAITING_PAYMENT: {
    background: "#fff5e8",
    color: "#ff9800",
    icon: "flag",
    iconColor: "#ff9800",
  },
  PAID: {
    background: "#ebf9ef",
    color: "#0da44b",
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
      <StatusSvg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M4 2.5V13.5"
          stroke={iconColor}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M5.2 3.2H11.7C12.05 3.2 12.34 3.48 12.34 3.84C12.34 3.95 12.31 4.07 12.25 4.17L10.95 6.34C10.8 6.59 10.8 6.91 10.95 7.16L12.25 9.33C12.43 9.63 12.33 10.02 12.03 10.2C11.93 10.26 11.82 10.29 11.7 10.29H5.2V3.2Z"
          fill={iconColor}
        />
      </StatusSvg>
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
