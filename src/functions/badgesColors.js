const statusColors = {
  READY_TO_PROCESS: { color: "#00953F", bg: "rgba(0, 149, 63, 0.07)" }, // green
  Approved: { color: "#00953F", bg: "rgba(0, 149, 63, 0.07)" },
  Registered: { color: "#00953F", bg: "rgba(0, 149, 63, 0.07)" },

  PENDING: { color: "#9b8504", bg: "rgba(220, 215, 9,0.42)" }, // yellow
  "Waiting Approval": { color: "#9b8504", bg: "rgba(220, 215, 9,0.42)" },

  PROCESSED: { color: "#084298", bg: "#cfe2ff" }, // blue

  COUNTERFEIT: { color: "#EC011A", bg: "rgba(236, 1, 26, 0.07)" }, // red
  DUPLICATE: { color: "#EC011A", bg: "rgba(236, 1, 26, 0.07)" },
  MISSING_INFORMATION: { color: "#EC011A", bg: "rgba(236, 1, 26, 0.07)" },
  ALREADY_REGISTERED: { color: "#EC011A", bg: "rgba(236, 1, 26, 0.07)" },
  INVALID: { color: "#EC011A", bg: "rgba(236, 1, 26, 0.07)" },
  Rejected: { color: "#EC011A", bg: "rgba(236, 1, 26, 0.07)" },
  Disabled: { color: "#EC011A", bg: "rgba(236, 1, 26, 0.07)" }
}

export { statusColors }