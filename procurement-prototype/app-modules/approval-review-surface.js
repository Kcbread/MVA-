(function registerApprovalReviewSurfaceModule(root) {
  const REVIEW_HISTORY_TABS = ["pending", "history"];

  // ApprovalReviewRoleConfig is the single contract for role-specific review UI.
  const ROLE_CONFIGS = {
    dri: {
      roleKey: "dri",
      entryLabel: "Dept Review",
      viewKey: "priceReview",
      stateKey: "priceReview",
      shellMode: "inline",
      defaultTab: "pending",
      defaultQueue: "submission",
      tabs: REVIEW_HISTORY_TABS,
      tabLabels: {
        pending: "Dept Review",
        history: "Review History",
      },
      queueDefinitions: [
        { id: "submission", label: "Submission Review", actionLabel: "Approve / Reject", nextStage: "Cost Manager final authorization" },
        { id: "exception", label: "Price Exception Review", actionLabel: "Approve / Reject", nextStage: "Budget Approver" },
        { id: "stock", label: "Stock / Carryover Review", actionLabel: "Approve / Reject", nextStage: "Locked / applied evidence" },
      ],
      decisionActions: {
        approve: "Approve",
        reject: "Reject",
      },
      emptyStateCopy: "No Dept DRI rows are waiting in this queue.",
      historyScope: "Dept DRI submission and price decisions",
    },
    manager: {
      roleKey: "manager",
      entryLabel: "Cost Review",
      viewKey: "manager",
      stateKey: "manager",
      shellMode: "managerAuthorized",
      defaultTab: "pending",
      defaultQueue: "authorization",
      tabs: ["pending", "history"],
      tabLabels: {
        pending: "Cost Review",
        projectReview: "Quantity Review",
        history: "Review History",
      },
      queueDefinitions: [
        { id: "authorization", label: "Final Authorization", actionLabel: "Authorize / Reject", nextStage: "OM Leader intake / assignment" },
      ],
      decisionActions: {
        approve: "Authorize",
        reject: "Reject",
      },
      emptyStateCopy: "No Cost Manager rows match the selected filters.",
      historyScope: "Cost Manager authorization decisions",
    },
    projectDri: {
      roleKey: "projectDri",
      entryLabel: "Budget Review",
      viewKey: "priceReview",
      stateKey: "priceReview",
      shellMode: "inline",
      defaultTab: "pending",
      defaultQueue: "budget",
      tabs: REVIEW_HISTORY_TABS,
      tabLabels: {
        pending: "Budget Review",
        history: "Review History",
      },
      queueDefinitions: [
        { id: "budget", label: "Budget Exception Approval", actionLabel: "Final Approve / Reject", nextStage: "OM Export Package" },
      ],
      decisionActions: {
        approve: "Final Approve",
        reject: "Reject",
      },
      emptyStateCopy: "No budget exceptions are waiting for final approval.",
      historyScope: "Budget Approver final exception decisions",
    },
  };

  const DEFAULT_STATE = {
    activeTab: "pending",
    activeQueue: "",
    selectedRowId: "",
    selectedProject: "",
    quantityTab: "dashboard",
  };

  const approvalReviewState = Object.keys(ROLE_CONFIGS).reduce((acc, roleKey) => {
    acc[roleKey] = {
      ...DEFAULT_STATE,
      activeQueue: ROLE_CONFIGS[roleKey].defaultQueue,
      activeTab: ROLE_CONFIGS[roleKey].defaultTab,
    };
    return acc;
  }, {});

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function configForRole(role = "") {
    return ROLE_CONFIGS[role] || null;
  }

  function configs() {
    return clone(ROLE_CONFIGS);
  }

  function stateForRole(role = "") {
    const config = configForRole(role);
    if (!config) return clone(DEFAULT_STATE);
    approvalReviewState[role] = approvalReviewState[role] || {
      ...DEFAULT_STATE,
      activeQueue: config.defaultQueue,
      activeTab: config.defaultTab,
    };
    return approvalReviewState[role];
  }

  function updateState(role = "", patch = {}) {
    const config = configForRole(role);
    if (!config) return clone(DEFAULT_STATE);
    const current = stateForRole(role);
    approvalReviewState[role] = { ...current, ...patch };
    return approvalReviewState[role];
  }

  function tabsForRole(role = "") {
    const config = configForRole(role);
    return config ? [...config.tabs] : [];
  }

  function tabLabel(role = "", tabId = "", fallback = "") {
    const config = configForRole(role);
    return config?.tabLabels?.[tabId] || fallback || tabId;
  }

  function queueDefinitions(role = "") {
    const config = configForRole(role);
    return config ? clone(config.queueDefinitions) : [];
  }

  function queueDefinition(role = "", queueId = "") {
    return queueDefinitions(role).find((queue) => queue.id === queueId) || null;
  }

  function queueLabel(role = "", queueId = "", fallback = "") {
    return queueDefinition(role, queueId)?.label || fallback || queueId;
  }

  function workspaceConfig(role = "") {
    const config = configForRole(role);
    if (!config) return {};
    if (role === "manager") {
      return {
        mainViews: ["manager"],
        defaultManagerTab: "review",
        managerTabs: ["review", "history"],
        managerTabLabels: {
          review: config.tabLabels.pending,
          history: config.tabLabels.history,
        },
      };
    }
    return {
      mainViews: [config.viewKey],
      defaultPriceReviewTab: config.defaultTab,
      priceReviewTabs: [...config.tabs],
      priceReviewTabLabels: { ...config.tabLabels },
    };
  }

  const api = {
    configForRole,
    configs,
    stateForRole,
    updateState,
    tabsForRole,
    tabLabel,
    queueDefinitions,
    queueDefinition,
    queueLabel,
    workspaceConfig,
    approvalReviewState,
  };

  root.ProcurementApp = root.ProcurementApp || {};
  root.ProcurementApp.modules = root.ProcurementApp.modules || {};
  root.ProcurementApp.modules.approvalReviewSurface = api;

  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
