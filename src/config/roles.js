export const ROLE_ADMIN = "ROLE_ADMIN";
export const ROLE_CUSTOMS = "ROLE_CUSTOMS";
export const ROLE_IMPORTER = "ROLE_IMPORTER";
export const ROLE_USER = "ROLE_USER";

export const MANAGEABLE_ROLE_OPTIONS = [
  { value: ROLE_USER, label: "Individual" },
  { value: ROLE_IMPORTER, label: "Importer" },
  { value: ROLE_CUSTOMS, label: "Customs Officer" },
];

export const getRoleDisplayName = (role) => {
  switch (role) {
    case ROLE_ADMIN:
      return "Administrator";
    case ROLE_CUSTOMS:
      return "Customs Officer";
    case ROLE_IMPORTER:
      return "Importer";
    case ROLE_USER:
      return "Individual";
    default:
      return "Unknown";
  }
};

export const getPrimaryRole = (roles) => {
  if (Array.isArray(roles)) {
    return roles[0] || "";
  }
  return roles || "";
};
