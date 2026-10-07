// session/login-enhancer: authoritative source; see docs/module-map.md.
import {
  syncOmOperatorField
} from "../om/assignment.js";
import {
  roleProfiles
} from "./config.js";
import {
  currentRequesterPersona,
  requesterPersonas
} from "./persona.js";
import {
  syncLoginAccountForRole
} from "./session.js";
import {
  currentRequesterPersonaId,
  currentRole,
  currentSessionUser,
  replaceCurrentRequesterPersonaIdBinding
} from "./state.js";
import {
  showToast
} from "../shell/dialogs.js";
import {
  applyRole,
  replaceApplyRoleBinding
} from "../shell/navigation.js";
import {
  DRI_CONTACT_MASTER
} from "../sourcing/config.js";

// @legacy-unit 1905 26433
export function initializeStep1905() {
(() => {
  const SIMPLIFIED_LOGIN_ROLES = [
    { value: "requester", label: "Requester" },
    { value: "dri", label: "Dept DRI" },
    { value: "omLeader", label: "OM Leader (Mai)" },
    { value: "omMember", label: "OM Purchasing (Giang / Linh)" },
    { value: "manager", label: "Cost Manager" },
    { value: "projectDri", label: "Budget Approver" },
    { value: "buyer", label: "Buyer Handoff" },
    { value: "admin", label: "Admin" }
  ];
  const CONTACT_WORKBOOK_ROWS = [
    { department: "IT", leader: "Csaba Varga(FUSHAN_IT) <csaba.varga@fih-foxconn.com>;", dri: "Anh Bui Thi Tu(FUSHAN_IT) <anhbtt@fih-foxconn.com>;" },
    { department: "GA", leader: "Tra Nguyen Thi Thu(DMS_GA) <tra.nguyen-thi-thu@fih-foxconn.com>;", dri: "Duy Trinh Tien Ngoc(FUSHAN_GA) <duy.trinh-tien-ngoc@fih-foxconn.com>; Phuong Tran Thi(FUSHAN_GA) <phuong.tran-thi@fih-foxconn.com>; Chi Nguyen Thi Le(DMS_GA) <chintl@fih-foxconn.com>;" },
    { department: "MFG_G", leader: "Binh Nguyen Nam(DMS_PRO) <binhnn1@fih-foxconn.com>;", dri: "Anh To Thi Phuong(DMS_PRO) <anhttp@fih-foxconn.com>; Hai Nguyen Duy(DMS_PRO) <haind@fih-foxconn.com>;" },
    { department: "ENG1", leader: "Quan Do Duc(DMS) <quandd@fih-foxconn.com>;", dri: "Thu Nguyen Thi Hang(DMS_ENG1) <thunth1@fih-foxconn.com>; Thanh Hoang Sy(DMS_ENG1) <thanhhs@fih-foxconn.com>;" },
    { department: "ENG2", leader: "Charlie Liu(DMS_ENG2) <Charlie.Liu@fih-foxconn.com>;", dri: "Pham Thi Lan Anh-Lily (DMS_ENG2) <anhptl@fih-foxconn.com>; Hue Nguyen Thi(DMS_ENG2) <huent1@fih-foxconn.com>;" },
    { department: "ENG3", leader: "David.Dai(戴夢林) <David.Dai@fih-foxconn.com>;", dri: "Xuan Nguyen Thi(DMS_ENG3) <xuannt14@fih-foxconn.com>; tinhvd@fih-foxconn.com" },
    { department: "REL", leader: "Theu Nguyen Thi-Erica(DMS_REL-LAB) <theunt@fih-foxconn.com>;", dri: "Quy Duong Kim(DMS_RL) <quydk@fih-foxconn.com>; Quen Trieu Mai (DMS_REL) <quen.trieu-mai@fih-foxconn.com>; Thong Vo Huy(DMS_RL) <thongvh@fih-foxconn.com>;" },
    { department: "EHS", leader: "Thuy Vu Van(FUSHAN_EHS) <thuyvv@fih-foxconn.com>;", dri: "Ngoan Dinh Thi(FUSHAN_EHS) <ngoan.dinh-thi@fih-foxconn.com>;" },
    { department: "FAC/REF", leader: "Quang Dao Van(DMS_REF) <quangdv1@fih-foxconn.com>;", dri: "Ha Le Trung(FUSHAN_REF) <halt1@fih-foxconn.com>; Hien Nguyen Ba(FUSHAN_REF) <hiennb1@fih-foxconn.com>; Nguyen Pham Van(FUSHAN_REF) <nguyenpv@fih-foxconn.com>;" },
    { department: "MFG_NonG", leader: "Cong Dinh Van(EMSVN_AO) <congdv1@fih-foxconn.com>;", dri: "Ban Dang Thi(DMS_PRO_NonG) <bandt1@fih-foxconn.com>;" },
    { department: "ENG_Ensky", leader: "Tuan Hoang Minh(ENSKYVN_ENG) <tuanhm@fih-foxconn.com>;", dri: "Thu Nguyen Anh(ENSKY_VN) <thuna@fih-foxconn.com>;" },
    { department: "ENG_NonG", leader: "Anh Nguyen Viet(DMS-ENG) <anhnv@fih-foxconn.com>;", dri: "Xuyen Nguyen Thi(DMS_ENG_Nong) <xuyennt1@fih-foxconn.com>;" },
    { department: "PD lab", leader: "HornerWu(吳宏振) <HornerWu@fih-foxconn.com>;", dri: "Nam Vu Hai(DMS_ENG) <namvh@fih-foxconn.com>;" },
    { department: "R&D", leader: "", dri: "Quang Nguyen Van(DMS_Eng) <quangnv3@fih-foxconn.com>; Dung Nguyen Tien(DMS_R&D) <dungnt7@fih-foxconn.com>;" },
    { department: "Antenna lab", leader: "", dri: "Phuc Nguyen Nhu(DMS_ANTENG) <phucnn@fih-foxconn.com>;" },
    { department: "WH", leader: "QING-PENG.SHI(史慶朋) <QING-PENG.SHI@fih-foxconn.com>;", dri: "vietnt@fih-foxconn.com; lichlt@fih-foxconn.com" },
    { department: "FATP_9YI4", leader: "Hai Tran Dinh(DMS_VNO) <haitd1@fih-foxconn.com>;", dri: "Hang Luong Thi(DMS_PRO) <hanglt1@fih-foxconn.com>;" },
    { department: "QA_GG", leader: "FelixWang@fih-foxconn.com", dri: "anhmt1@fih-foxconn.com" },
    { department: "QA_NonG", leader: "howardhhcheng@fih-foxconn.com", dri: "Thanh.Le-Van@fih-foxconn.com; manttb@fih-foxconn.com; Anh.nguyen-thi-van@fih-foxconn.com" },
    { department: "TE_GG", leader: "", dri: "kiennt1@fih-foxconn.com" },
    { department: "TE_nonG", leader: "", dri: "quylv@fih-foxconn.com" }
  ];
  const CONTACT_DEPARTMENT_ALIAS_MAP = {
    "mfg_g": "MFG",
    "mfg_nong": "MFG NONG",
    "mfg_nongg": "MFG NONG",
    "eng_nong": "ENG NONG",
    "eng_ensky": "ENG ENSKY",
    "fac/ref": "FAC",
    "qa_gg": "QA G-PQC",
    "qa_nong": "QA NONG",
    "te_gg": "TE",
    "te_nong": "TE NONG",
    "pd lab": "Q-LAB",
    "antenna lab": "Q-LAB",
    "gg-wh": "WH",
    "wh": "WH"
  };
  let contactPopupText = "";

  function normalizeTextValue(value) {
    return String(value || "").trim();
  }

  function normalizeDepartmentName(value) {
    const trimmed = normalizeTextValue(value);
    if (!trimmed) return "";
    const aliasKey = trimmed.toLowerCase().replace(/\s+/g, " ");
    return CONTACT_DEPARTMENT_ALIAS_MAP[aliasKey] || CONTACT_DEPARTMENT_ALIAS_MAP[aliasKey.replace(/\s/g, "")] || trimmed;
  }

  function normalizeEmailValue(value) {
    return normalizeTextValue(value).toLowerCase();
  }

  function escapeHtmlSafe(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safePersonaList() {
    try {
      return Array.isArray(requesterPersonas?.()) ? requesterPersonas() : [];
    } catch (error) {
      return [];
    }
  }

	  function findRequesterPersonaByEmail(email) {
	    const normalizedEmail = normalizeEmailValue(email);
	    if (!normalizedEmail) return null;
	    return safePersonaList().find((persona) => normalizeEmailValue(persona?.email) === normalizedEmail) || null;
	  }

	  function findRequesterPersonaByLogin(login) {
	    const normalizedLogin = normalizeTextValue(login).toLowerCase();
	    if (!normalizedLogin) return null;
	    return safePersonaList().find((persona) => {
	      return [persona?.employeeId, persona?.email, persona?.id, persona?.name]
	        .some((value) => normalizeTextValue(value).toLowerCase() === normalizedLogin);
	    }) || findRequesterPersonaByEmail(login);
	  }

  function parseWorkbookContactRaw(rawText, department, contactType, projectType) {
    const raw = normalizeTextValue(rawText);
    if (!raw) return [];
    return raw
      .split(/[\n;]+/)
      .map((chunk) => normalizeTextValue(chunk))
      .filter(Boolean)
      .map((chunk, index) => {
        const match = chunk.match(/^(.*?)<([^>]+)>$/);
        const email = normalizeEmailValue(match ? match[2] : chunk);
        const name = normalizeTextValue(match ? match[1] : "");
        return {
          id: `workbook-${department}-${contactType}-${index}-${email || name || "contact"}`,
          department: normalizeDepartmentName(department),
          contactType,
          name: name || email || "-",
          email,
          phone: "",
          employeeId: "",
          projectType,
          source: "DRI & Leaders Excel",
          status: "Active"
        };
      });
  }

  function workbookDepartmentSeedRecords() {
    return CONTACT_WORKBOOK_ROWS.flatMap((row) => {
      const projectType = row.department.toLowerCase().includes("nong") ? "Non-G" : "G";
      const department = normalizeDepartmentName(row.department);
      const fallbackSlot = {
        id: `dept-seed-${department}`,
        department,
        contactType: "Department Slot",
        name: "",
        email: "",
        phone: "",
        employeeId: "",
        projectType,
        source: "DRI & Leaders Excel",
        status: "Active"
      };
      const leaderRecords = parseWorkbookContactRaw(row.leader, row.department, "Leader", projectType);
      const driRecords = parseWorkbookContactRaw(row.dri, row.department, "DRI", projectType);
      return leaderRecords.length || driRecords.length ? [...leaderRecords, ...driRecords] : [fallbackSlot];
    });
  }

  function driMasterContactRecords() {
    const list = Array.isArray(typeof DRI_CONTACT_MASTER !== "undefined" ? DRI_CONTACT_MASTER : []) ? DRI_CONTACT_MASTER : [];
    return list.map((contact, index) => ({
      id: `dri-master-${index}`,
      department: normalizeDepartmentName(contact?.department),
      contactType: "DRI",
      name: normalizeTextValue(contact?.name),
      email: normalizeEmailValue(contact?.email),
      phone: normalizeTextValue(contact?.phone),
      employeeId: normalizeTextValue(contact?.employeeId),
      projectType: normalizeTextValue(contact?.projectType) || "Mixed",
      source: "System DRI Master",
      status: "Active"
    }));
  }

	  function requesterDirectoryRecords() {
	    return safePersonaList().map((persona) => ({
	      id: `requester-${normalizeTextValue(persona?.id || persona?.name)}`,
	      department: normalizeDepartmentName(persona?.department || persona?.dept),
	      contactType: "Requester",
	      name: normalizeTextValue(persona?.name),
	      email: normalizeEmailValue(persona?.email),
	      phone: normalizeTextValue(persona?.phone),
	      employeeId: normalizeTextValue(persona?.employeeId),
	      projectType: normalizeTextValue(persona?.projectType) || "Mixed",
	      project: normalizeTextValue((persona?.projects || [persona?.project]).filter(Boolean).join(", ")),
	      budgetApprover: normalizeTextValue(persona?.budgetApprover),
	      source: "Requester Persona",
	      status: "Active"
	    }));
	  }

  function mergedContactDirectoryRecords() {
    const mergedMap = new Map();
    const seedOrder = [...workbookDepartmentSeedRecords(), ...driMasterContactRecords(), ...requesterDirectoryRecords()];
    seedOrder.forEach((record) => {
      const department = normalizeDepartmentName(record?.department);
      const email = normalizeEmailValue(record?.email);
      const name = normalizeTextValue(record?.name);
      const type = normalizeTextValue(record?.contactType) || "Contact";
      const key = `${department}::${type}::${email || name || record?.id}`;
      const existing = mergedMap.get(key);
      if (!existing) {
        mergedMap.set(key, {
          ...record,
          department,
          email,
          name,
          source: normalizeTextValue(record?.source) || "Imported",
          status: "Active"
        });
        return;
      }
      mergedMap.set(key, {
        ...existing,
        ...record,
        department: existing.department || department,
        name: existing.name || name,
        email: existing.email || email,
        phone: existing.phone || normalizeTextValue(record?.phone),
        employeeId: existing.employeeId || normalizeTextValue(record?.employeeId),
        projectType: existing.projectType || normalizeTextValue(record?.projectType),
        source: existing.source === "DRI & Leaders Excel" && record?.source ? record.source : existing.source
      });
    });
    return Array.from(mergedMap.values())
      .filter((record) => record.department || record.name || record.email)
      .sort((left, right) => {
        const departmentCompare = String(left.department || "").localeCompare(String(right.department || ""));
        if (departmentCompare) return departmentCompare;
        const typeCompare = String(left.contactType || "").localeCompare(String(right.contactType || ""));
        if (typeCompare) return typeCompare;
        return String(left.name || left.email || "").localeCompare(String(right.name || right.email || ""));
      });
  }

	  function currentDisplayContact() {
	    const profile = roleProfiles?.[currentRole] || {};
	    const persona = currentRole === "requester" ? currentRequesterPersona?.() : null;
	    const session = currentSessionUser || {};
	    return {
	      contactType: "Current User",
	      name: normalizeTextValue(persona?.name || session.name || profile.name || "Current User"),
	      email: normalizeEmailValue(persona?.email || session.email),
	      phone: normalizeTextValue(persona?.phone),
	      department: normalizeDepartmentName(persona?.department || persona?.dept || session.department || profile.dept),
	      employeeId: normalizeTextValue(persona?.employeeId || session.employeeId || session.employee_id),
	      projectType: normalizeTextValue(persona?.projectType || session.project_family),
	      project: normalizeTextValue((persona?.projects || [persona?.project || session.project_codes]).filter(Boolean).join(", ")),
	      budgetApprover: normalizeTextValue(persona?.budgetApprover),
	      source: "Login Profile"
	    };
	  }

  function contactPopupRecords() {
	    const current = currentDisplayContact();
	    const currentDept = normalizeDepartmentName(current.department);
	    const currentFamily = normalizeTextValue(current.projectType);
	    const currentProjects = normalizeTextValue(current.project).split(",").map((item) => item.trim()).filter(Boolean);
	    const core = mergedContactDirectoryRecords().filter((record) => {
	      const recordProjects = normalizeTextValue(record.project).split(",").map((item) => item.trim()).filter(Boolean);
	      const sameProject = !currentProjects.length || !recordProjects.length || recordProjects.some((project) => currentProjects.includes(project));
	      if (record.contactType === "Requester" && currentRole === "requester") {
	        return record.employeeId === current.employeeId || (record.department === currentDept && (!currentFamily || record.projectType === currentFamily) && sameProject);
	      }
	      if (["DRI", "Leader"].includes(record.contactType) && record.department === currentDept) return true;
	      if (["MFG", "OM", "Operations", "WH"].includes(record.department)) return ["DRI", "Leader"].includes(record.contactType);
	      return false;
    });
    const records = [current, ...core];
    const seen = new Set();
    return records.filter((record) => {
      const key = `${record.contactType}::${record.department}::${record.email || record.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 10);
  }

  function contactCardHtml(record) {
    return `
      <article class="contact-popup-cardlet">
        <h4>${escapeHtmlSafe(record.contactType || "Contact")}</h4>
	        <div class="contact-popup-row"><span>Name</span><strong>${escapeHtmlSafe(record.name || "-")}</strong></div>
	        <div class="contact-popup-row"><span>Employee ID</span><strong>${escapeHtmlSafe(record.employeeId || "-")}</strong></div>
	        <div class="contact-popup-row"><span>Email</span>${record.email ? `<a href="mailto:${escapeHtmlSafe(record.email)}">${escapeHtmlSafe(record.email)}</a>` : "<strong>-</strong>"}</div>
	        <div class="contact-popup-row"><span>Dept</span><strong>${escapeHtmlSafe(record.department || "-")}</strong></div>
	        <div class="contact-popup-row"><span>Scope</span><strong>${escapeHtmlSafe([record.projectType, record.project].filter(Boolean).join(" / ") || "-")}</strong></div>
	        <div class="contact-popup-row"><span>Budget approver</span><strong>${escapeHtmlSafe(record.budgetApprover || "-")}</strong></div>
	        <div class="contact-popup-row"><span>Phone</span><strong>${escapeHtmlSafe(record.phone || "-")}</strong></div>
	      </article>
	    `;
  }

  function contactText(records) {
    return records.map((record) => [
      `[${record.contactType || "Contact"}]`,
      `Name: ${record.name || "-"}`,
      `Email: ${record.email || "-"}`,
      `Dept: ${record.department || "-"}`,
	      `Phone: ${record.phone || "-"}`,
	      `Employee ID: ${record.employeeId || "-"}`,
	      `Project Scope: ${[record.projectType, record.project].filter(Boolean).join(" / ") || "-"}`,
	      `Budget Approver: ${record.budgetApprover || "-"}`,
	      `Source: ${record.source || "-"}`
	    ].join("\n")).join("\n\n");
	  }

  function openContactPopup() {
    const modal = document.getElementById("contactPopupModal");
    const body = document.getElementById("contactPopupContent");
    if (!modal || !body) return;
    const records = contactPopupRecords();
    contactPopupText = contactText(records);
    body.innerHTML = `
      <div class="contact-popup-grid">${records.map(contactCardHtml).join("")}</div>
      <label>
        Copy Preview
        <textarea class="contact-copy-buffer" readonly>${escapeHtmlSafe(contactPopupText)}</textarea>
      </label>
    `;
    modal.hidden = false;
  }

  function closeContactPopup() {
    const modal = document.getElementById("contactPopupModal");
    if (modal) modal.hidden = true;
  }

  function copyContactPopupText() {
    const text = contactPopupText || contactText(contactPopupRecords());
    const fallback = () => {
      const buffer = document.querySelector("#contactPopupModal .contact-copy-buffer");
      if (!buffer) return false;
      buffer.focus();
      buffer.select();
      return document.execCommand?.("copy");
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => showToast?.("Contact text copied.", "success"))
        .catch(() => {
          const copied = fallback();
          showToast?.(copied ? "Contact text copied." : "Contact text is ready to copy.", copied ? "success" : "info");
        });
      return;
    }
    const copied = fallback();
    showToast?.(copied ? "Contact text copied." : "Contact text is ready to copy.", copied ? "success" : "info");
  }

  window.openContactPopup = openContactPopup;
  window.closeContactPopup = closeContactPopup;
  window.copyContactPopupText = copyContactPopupText;

  function ensureSimplifiedLogin() {
	    const accountInput = document.getElementById("loginAccountInput") || document.querySelector('#loginForm input[type="text"]') || document.querySelector('#loginForm input[type="email"]');
	    if (accountInput && !accountInput.id) accountInput.id = "loginAccountInput";
	    if (accountInput) {
	      accountInput.type = "text";
	      accountInput.autocomplete = "username";
	    }
	    const passwordInput = document.querySelector('#loginForm input[type="password"]');
	    if (passwordInput && (!passwordInput.value || passwordInput.value === "password")) passwordInput.value = "123";
    const roleSelect = document.getElementById("roleSelect");
    if (roleSelect) {
      roleSelect.innerHTML = SIMPLIFIED_LOGIN_ROLES.map((role) => `<option value="${role.value}">${role.label}</option>`).join("");
      syncLoginAccountForRole(roleSelect.value || "requester");
    }
    syncOmOperatorField(roleSelect?.value || "requester");
    const requesterField = document.getElementById("requesterPersonaField");
    if (requesterField) {
      requesterField.hidden = true;
      requesterField.style.display = "none";
    }
  }

  function bootstrapContactPopupAndLogin() {
    if (typeof roleProfiles === "object" && roleProfiles?.requester) {
      roleProfiles.requester.name = "Requester";
      roleProfiles.requester.functionName = "Requester";
    }
    ensureSimplifiedLogin();
  }

  const originalApplyRole = typeof applyRole === "function" ? applyRole : null;
  if (originalApplyRole) {
    replaceApplyRoleBinding(function patchedApplyRole(role, ...args) {
	      const accountInput = document.getElementById("loginAccountInput") || document.getElementById("loginEmailInput") || document.querySelector('#loginForm input[type="text"]') || document.querySelector('#loginForm input[type="email"]');
	      if (role === "requester") {
	        const matchedPersona = findRequesterPersonaByLogin(accountInput?.value || "");
	        const fallbackPersona = safePersonaList()[0] || null;
        const nextPersonaId = matchedPersona?.id || fallbackPersona?.id || "";
        if (nextPersonaId) replaceCurrentRequesterPersonaIdBinding(nextPersonaId);
        const personaSelect = document.getElementById("requesterPersonaSelect");
        if (personaSelect && nextPersonaId) {
          if (!Array.from(personaSelect.options).some((option) => option.value === nextPersonaId)) {
            const option = document.createElement("option");
            option.value = nextPersonaId;
            option.textContent = matchedPersona?.name || fallbackPersona?.name || "Auto requester";
            personaSelect.appendChild(option);
          }
          personaSelect.value = nextPersonaId;
        }
      }
      const result = originalApplyRole.call(this, role, ...args);
      return result;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrapContactPopupAndLogin, { once: true });
  } else {
    bootstrapContactPopupAndLogin();
  }
})();
}
// @end-legacy-unit 1905
