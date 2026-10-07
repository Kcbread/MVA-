(function startFactoryUat(window) {
  const uat = window.FihUat;
  let state = uat.loadState(window.localStorage);
  let session = uat.loadSession(window.localStorage);

  function activeRole() { return session?.role || ""; }
  function persist(next, notice) {
    state = next;
    if (notice) state.notices = [notice];
    uat.saveState(window.localStorage, state);
    uat.renderApp(state, session);
  }
  function success(message) { return { type: "success", message }; }
  function warning(message) { return { type: "warning", message }; }
  function payload(form) { return Object.fromEntries(new window.FormData(form).entries()); }
  function attempt(work) { try { work(); } catch (error) { persist(state, warning(error.message)); } }
  function accountForRole(role) { return uat.LOGIN_PROFILES[role]?.account || ""; }

  function syncLoginIdentity(role) {
    const operatorField = window.document.getElementById("omOperatorField");
    const operatorSelect = window.document.getElementById("omOperatorSelect");
    const accountInput = window.document.getElementById("loginAccountInput");
    operatorField.hidden = role !== "omMember";
    accountInput.value = role === "omMember" ? operatorSelect.value : accountForRole(role);
    window.document.getElementById("loginError").textContent = "";
  }

  window.document.getElementById("loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      session = uat.signIn(window.localStorage, {
        role: window.document.getElementById("roleSelect").value,
        account: window.document.getElementById("loginAccountInput").value,
        password: window.document.getElementById("loginPasswordInput").value,
      });
      state.notices = [success(`Signed in as ${session.name}. Browser-local procurement data is unchanged.`)];
      uat.renderApp(state, session);
    } catch (error) {
      window.document.getElementById("loginError").textContent = error.message;
    }
  });
  window.document.getElementById("roleSelect").addEventListener("change", (event) => syncLoginIdentity(event.target.value));
  window.document.getElementById("omOperatorSelect").addEventListener("change", (event) => { window.document.getElementById("loginAccountInput").value = event.target.value; });
  window.document.querySelector(".login-row a").addEventListener("click", (event) => { event.preventDefault(); window.document.getElementById("loginError").textContent = "DEMO password: 123"; });
  window.document.getElementById("logoutButton").addEventListener("click", () => {
    uat.signOut(window.localStorage);
    session = null;
    state.notices = [];
    uat.renderApp(state, session);
  });

  window.document.addEventListener("change", (event) => {
    if (!session) return;
    const target = event.target;
    if (target.dataset.view) return;
    if (target.dataset.filter) {
      const next = { ...state, page: 1, notices: [] };
      if (target.dataset.filter === "search") next.search = target.value;
      else next.scope = { ...state.scope, [target.dataset.filter]: target.value };
      return persist(next);
    }
    if (target.dataset.demandField) attempt(() => persist(uat.updateDemand(state, target.dataset.demandId, { [target.dataset.demandField]: target.value }, activeRole()), success(`${target.dataset.demandId} draft updated.`)));
  });
  window.document.addEventListener("input", (event) => { if (session && event.target.dataset.filter === "search") state.search = event.target.value; });
  window.document.addEventListener("click", (event) => {
    if (!session) return;
    const target = event.target.closest("button");
    if (!target || target.id === "logoutButton") return;
    if (target.dataset.view) return persist({ ...state, activeView: { ...state.activeView, [activeRole()]: target.dataset.view }, page: 1, notices: [] });
    if (target.dataset.page) return persist({ ...state, page: Number(target.dataset.page), notices: [] });
    if (target.dataset.demandId && !target.dataset.action) return persist({ ...state, activeDemandId: target.dataset.demandId, notices: [] });
    const action = target.dataset.action;
    if (action === "RESET_DEMO") { if (window.confirm("Reset all 1,248+ browser-local DEMO rows and settings?")) persist(uat.resetState(window.localStorage), success("Factory DEMO data reset.")); return; }
    if (action === "ADD_DEMAND") return attempt(() => persist(uat.addDemand(state, activeRole()), success("New DEMO demand row added to the current scope.")));
    if (action === "SAVE_DRAFT") return persist(state, success("Current browser-local draft state saved."));
    if (action === "SHOW_ERRORS") return persist({ ...state, search: "Missing", page: 1 }, warning("Rows with validation messages are highlighted in red; clear Search to show all."));
    if (action === "SUBMIT_SCOPE") return attempt(() => { const result = uat.submitScope(state, state.scope, activeRole()); persist(result.state, result.invalid.length ? warning(`${result.submitted} rows submitted; ${result.invalid.length} invalid rows remain Draft.`) : success(`${result.submitted} rows submitted to Dept DRI.`)); });
  });
  window.document.addEventListener("submit", (event) => {
    if (event.target.id === "loginForm") return;
    event.preventDefault();
    if (!session) return;
    const form = event.target, data = payload(form), action = event.submitter?.dataset.action;
    if (form.matches("[data-workflow-form]")) return attempt(() => { const next = uat.transitionDemand(state, form.dataset.demandId, action, data, activeRole()); persist(next, success(`${action.replace(/_/g, " ")} completed for ${form.dataset.demandId}.`)); });
    if (form.matches("[data-stage-calendar]")) return attempt(() => persist(uat.updateStageCalendar(state, data.project, data.phase, data.date, activeRole()), success(`${data.project} ${data.phase} Line Open Date saved.`)));
    if (form.matches("[data-admin-setting]")) return attempt(() => { let next = state; for (const [key, value] of Object.entries(data)) next = uat.updateAdminSetting(next, key, value, activeRole()); persist(next, success("Admin configuration saved in browser-local DEMO state.")); });
  });

  syncLoginIdentity(window.document.getElementById("roleSelect").value);
  uat.renderApp(state, session);
})(window);
