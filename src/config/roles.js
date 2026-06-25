export const ROLE_ADMIN = "ROLE_ADMIN";
export const ROLE_CUSTOMS = "ROLE_CUSTOMS";
export const ROLE_TELECOM = "ROLE_TELECOM";
export const ROLE_IMPORTER = "ROLE_IMPORTER";
export const ROLE_USER = "ROLE_USER";

export const MANAGEABLE_ROLE_OPTIONS = [
  { value: ROLE_USER, label: "Individual" },
  { value: ROLE_IMPORTER, label: "Importer" },
  { value: ROLE_CUSTOMS, label: "Customs Officer" },
  { value: ROLE_TELECOM, label: "Telecom Officer" },
];

export const getRoleDisplayName = (role) => {
  switch (role) {
    case ROLE_ADMIN:
      return "Administrator";
    case ROLE_CUSTOMS:
      return "Customs Officer";
    case ROLE_TELECOM:
      return "Telecom Officer";
    case ROLE_IMPORTER:
      return "Importer";
    case ROLE_USER:
      return "Individual";
    default:
      return "Unknown";
  }
};

// Customs and Telecom officers share the same review workspace (same screens
// and URL prefix). Telecom is the approver; Customs is view-only.
export const isCustomsWorkspaceRole = (role) =>
  role === ROLE_CUSTOMS || role === ROLE_TELECOM;

export const getPrimaryRole = (roles) => {
  if (Array.isArray(roles)) {
    return roles[0] || "";
  }
  return roles || "";
};
