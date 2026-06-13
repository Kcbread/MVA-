(function registerRoleQueueConfigModule(root) {
  const ROLE_META = {
    dri: {
      workbenchTitle: "Review Queue",
      workbenchHelper: "Review requester submissions first, then quoted exceptions or unit-stock evidence only when those queues still need Dept DRI action.",
      pendingTabLabel: "Review Queue",
      queueLabels: {
        submission: "Submission Review",
        exception: "Price Exception Review",
        stock: "Stock / Carryover Review",
      },
    },
    projectDri: {
      workbenchTitle: "Review Queue",
      workbenchHelper: "Review quoted budget exceptions only after Dept DRI approval. Normal requester submissions do not belong here.",
      pendingTabLabel: "Review Queue",
      queueLabels: {
        budget: "Budget Exception Approval",
      },
    },
    manager: {
      workbenchTitle: "Cost Review Workbench",
      workbenchHelper: "Authorize Dept DRI-approved submissions with the same scoped evidence structure as Dept Review.",
    },
  };

  function metaForRole(role = "") {
    const surfaceConfig = root.ProcurementApp?.modules?.approvalReviewSurface?.configForRole?.(role);
    if (surfaceConfig) {
      return {
        workbenchTitle: surfaceConfig.entryLabel,
        workbenchHelper: surfaceConfig.historyScope || "",
        pendingTabLabel: surfaceConfig.tabLabels?.pending || "Review Queue",
        queueLabels: Object.fromEntries((surfaceConfig.queueDefinitions || []).map((queue) => [queue.id, queue.label])),
      };
    }
    return ROLE_META[role] || {};
  }

  function queueLabel(role = "", queueId = "", fallback = "") {
    return metaForRole(role)?.queueLabels?.[queueId] || fallback || queueId;
  }

  const api = {
    metaForRole,
    queueLabel,
  };

  root.ProcurementApp = root.ProcurementApp || {};
  root.ProcurementApp.modules = root.ProcurementApp.modules || {};
  root.ProcurementApp.modules.roleQueueConfig = api;

  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
