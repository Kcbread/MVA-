// session/events-forms.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  apiModeEnabled
} from "../infrastructure/api.js";
import {
  replaceSelectedOmOperatorIdBinding,
  selectedOmOperatorId
} from "../om/state.js";
import {
  showToast
} from "../shell/dialogs.js";
import {
  applyRole,
  setScreen
} from "../shell/navigation.js";
import {
  applyRequesterPersonaContext,
  findRequesterPersonaByIdentifier,
  requesterPersonas
} from "./persona.js";
import {
  loginWithApi,
  syncLoginAccountForRole
} from "./session.js";
import {
  replaceCurrentRequesterPersonaIdBinding
} from "./state.js";

// @legacy-unit 1877 25134
export function initializeStep1877() {
document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const selectedRole = document.getElementById("roleSelect")?.value || "requester";
  const identifier = apiModeEnabled()
    ? syncLoginAccountForRole(selectedRole)
    : document.getElementById("loginAccountInput")?.value || document.getElementById("loginEmailInput")?.value || document.querySelector('#loginForm input[type="text"]')?.value || document.querySelector('#loginForm input[type="email"]')?.value || "";
  const password = document.querySelector('#loginForm input[type="password"]')?.value || "";
  try {
    if (apiModeEnabled()) {
      const user = await loginWithApi(identifier, password, selectedRole);
      setScreen("workspace");
      if (user.role === "omMember" && user.id) replaceSelectedOmOperatorIdBinding(user.id);
      applyRole(user.role);
      showToast(`Signed in as ${user.name}.`, "success");
      return;
    }
    setScreen("workspace");
    if (selectedRole === "requester") {
      const persona = findRequesterPersonaByIdentifier(identifier) || requesterPersonas()[0] || null;
      if (persona) applyRequesterPersonaContext(persona);
    }
    applyRole(selectedRole);
  } catch (error) {
    showToast(`Login failed: ${error.message}`, "error");
  }
});
}
// @end-legacy-unit 1877

// @legacy-unit 1878 25161
export function initializeStep1878() {
document.getElementById("requesterPersonaSelect")?.addEventListener("change", (event) => {
  replaceCurrentRequesterPersonaIdBinding(event.target.value || "");
});
}
// @end-legacy-unit 1878

// @legacy-unit 1879 25165
export function initializeStep1879() {
document.getElementById("roleSelect")?.addEventListener("change", (event) => {
  const personaField = document.getElementById("requesterPersonaField");
  if (personaField) personaField.hidden = event.target.value !== "requester";
  syncLoginAccountForRole(event.target.value);
});
}
// @end-legacy-unit 1879

// @legacy-unit 1880 25171
export function initializeStep1880() {
document.getElementById("omOperatorSelect")?.addEventListener("change", (event) => {
  replaceSelectedOmOperatorIdBinding(event.target.value || selectedOmOperatorId);
  syncLoginAccountForRole(document.getElementById("roleSelect")?.value || "requester");
});
}
// @end-legacy-unit 1880
