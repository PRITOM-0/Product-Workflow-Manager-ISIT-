export const WORKFLOW_STEPS = [
  {
    key: "ecfRaise",
    label: "ECF Raise",
  },
  {
    key: "approve",
    label: "Approve",
    adminOnly: true,
  },
  {
    key: "csApprove",
    label: "CS Approve",
    adminOnly: true,
  },
  {
    key: "workOrder",
    label: "Work Order",
  },
  {
    key: "productInhouse",
    label: "Product Inhouse",
  },
  {
    key: "assetCodeRequest",
    label: "Asset Code Request",
  },
  {
    key: "documentUpdate",
    label: "Document Update",
  },
  {
    key: "productDelivery",
    label: "Product Delivery",
  },
  {
    key: "userAcknowledgement",
    label: "User Acknowledgement",
  },
];

export const getStepLabel = (key) => {
  return (
    WORKFLOW_STEPS.find((step) => step.key === key)?.label || key
  );
};

export const getStepIndex = (key) => {
  return WORKFLOW_STEPS.findIndex((step) => step.key === key);
};

export const canPerformStep = (key, role) => {
  const step = WORKFLOW_STEPS.find((item) => item.key === key);

  if (!step) return false;

  if (step.adminOnly && role !== "admin") {
    return false;
  }

  return true;
};

export const getNextStep = (key) => {
  const index = getStepIndex(key);

  if (index === -1 || index === WORKFLOW_STEPS.length - 1) {
    return null;
  }

  return WORKFLOW_STEPS[index + 1];
};

export const isWorkflowComplete = (workflow) => {
  return workflow?.userAcknowledgement?.status === "completed";
};