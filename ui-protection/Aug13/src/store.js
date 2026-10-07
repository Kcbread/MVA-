(function initStore(root, factory) {
  const source = typeof module === "object" && module.exports ? require("./scenarios.js") : root.FihUat;
  const api = factory(source);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.FihUat = Object.assign(root.FihUat || {}, api);
})(typeof globalThis !== "undefined" ? globalThis : this, function storeFactory(source) {
  const STORAGE_KEY = "fih.procurement.factory-uat.v2";
  const SESSION_KEY = "fih.procurement.factory-uat.session.v1";
  const LOGIN_PROFILES = {
    requester: { account: "V1524505", name: "Requester User", dept: "Requesting Department", functionName: "Demand Requester" },
    dri: { account: "dept-dri", name: "Dept DRI", dept: "Requesting Department", functionName: "Department Review" },
    manager: { account: "cost-owner", name: "Cost Manager", dept: "Finance", functionName: "Cost Review" },
    projectDri: { account: "budget-approver", name: "Budget Approver", dept: "Project", functionName: "Budget Approval" },
    omLeader: { account: "maint5", name: "Mai", dept: "Operations", functionName: "OM Leader" },
    omMember: { account: "giangth1", name: "Giang", dept: "Operations", functionName: "PAS / Quote / Handoff Operator" },
    buyer: { account: "buyer-handoff", name: "Buyer Handoff", dept: "Purchasing", functionName: "Buyer Handoff" },
    admin: { account: "admin", name: "System Admin", dept: "Administration", functionName: "Access & Approval Setup" },
  };
  function validState(value) { return value && value.version === 2 && Array.isArray(value.demands) && value.demands.length >= 1000; }
  function saveState(storage, state) { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return state; }
  function loadState(storage) {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return source.createSeedState();
    try { const parsed = JSON.parse(raw); if (!validState(parsed)) throw new Error("unsupported"); return parsed; }
    catch { const state = source.createSeedState(); state.notices = [{ type: "warning", message: "Demo data was reset because saved state could not be read." }]; saveState(storage, state); return state; }
  }
  function resetState(storage) { storage.removeItem(STORAGE_KEY); const state = source.createSeedState(); saveState(storage, state); return state; }
  function loadSession(storage) {
    const raw = storage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw);
      return LOGIN_PROFILES[session?.role] && session.account ? session : null;
    } catch { return null; }
  }
  function signIn(storage, credentials = {}) {
    const role = String(credentials.role || "");
    const profile = LOGIN_PROFILES[role];
    const account = String(credentials.account || "").trim();
    if (!profile) throw new Error("Select a valid login role.");
    if (!account) throw new Error("Employee ID / Account is required.");
    if (String(credentials.password || "") !== "123") throw new Error("Invalid DEMO password. Use 123.");
    const operatorName = role === "omMember" && /linh/i.test(account) ? "Linh" : profile.name;
    const session = { role, account, name: operatorName, dept: profile.dept, functionName: profile.functionName };
    storage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }
  function signOut(storage) { storage.removeItem(SESSION_KEY); }
  return { STORAGE_KEY, SESSION_KEY, LOGIN_PROFILES, loadState, saveState, resetState, loadSession, signIn, signOut };
});
