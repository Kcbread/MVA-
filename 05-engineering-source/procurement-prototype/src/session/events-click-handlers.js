// session/events-click-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  setScreen
} from "../shell/navigation.js";
import {
  openDriContact
} from "./contacts.js";
import {
  logoutWithApi
} from "./session.js";

export function handleClickLogout(action) {
  if (action === "logout") {
    logoutWithApi().finally(() => setScreen("login"));
  }
}

export function handleClickContactDriButton(contactDriButton) {
  if (contactDriButton) openDriContact(contactDriButton.dataset.contactDri);
}
