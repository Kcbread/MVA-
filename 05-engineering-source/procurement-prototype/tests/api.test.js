const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

process.env.UPLOAD_ROOT ||= path.join(__dirname, "..", "test-artifacts", "uploads");

const { createServer, memoryStore } = require("../server");

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve(`http://127.0.0.1:${server.address().port}`);
    });
  });
}

async function request(baseUrl, path, { method = "GET", body, cookie } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json();
  return { response, json, cookie: response.headers.get("set-cookie") || cookie || "" };
}

async function login(baseUrl, identifier, password = "123", extra = {}) {
  return request(baseUrl, "/api/login", { method: "POST", body: { identifier, password, ...extra } });
}

async function uploadFile(baseUrl, pathName, { cookie, fields = {}, file }) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => form.append(key, typeof value === "object" ? JSON.stringify(value) : String(value)));
  form.append("file", new Blob([file.content], { type: file.type || "application/octet-stream" }), file.name);
  const response = await fetch(`${baseUrl}${pathName}`, {
    method: "POST",
    headers: cookie ? { Cookie: cookie } : {},
    body: form,
  });
  const json = await response.json();
  return { response, json };
}

test("auth session returns server-authoritative role", async () => {
  const server = createServer();
  const baseUrl = await listen(server);
  try {
    const loginResult = await login(baseUrl, "maint5");
    assert.equal(loginResult.response.status, 200);
    assert.equal(loginResult.json.user.role, "omLeader");
    assert.equal(loginResult.json.user.employee_id, "maint5");
    const me = await request(baseUrl, "/api/me", { cookie: loginResult.cookie });
    assert.equal(me.response.status, 200);
    assert.equal(me.json.user.email, "maint5@fih-foxconn.com");
    assert.equal(me.json.user.role, "omLeader");
	    const logout = await request(baseUrl, "/api/logout", { method: "POST", cookie: loginResult.cookie });
	    assert.equal(logout.response.status, 200);
	    const afterLogout = await request(baseUrl, "/api/me", { cookie: loginResult.cookie });
	    assert.equal(afterLogout.response.status, 401);
	  } finally {
	    server.close();
	  }
});

test("test login role creates the selected server session", async () => {
  const server = createServer();
  const baseUrl = await listen(server);
  try {
    const result = await request(baseUrl, "/api/login", {
      method: "POST",
      body: { identifier: "V1524505", role: "buyer", loginRole: "buyer", password: "123" },
    });
    assert.equal(result.response.status, 200);
    assert.equal(result.json.user.role, "buyer");
    assert.equal(result.json.user.employee_id, "buyer-handoff");

    const me = await request(baseUrl, "/api/me", { cookie: result.cookie });
    assert.equal(me.response.status, 200);
    assert.equal(me.json.user.role, "buyer");
  } finally {
    server.close();
  }
});

test("OM Purchasing login role can switch between Giang and Linh operators", async () => {
  const server = createServer();
  const baseUrl = await listen(server);
  try {
    const giang = await request(baseUrl, "/api/login", {
      method: "POST",
      body: { identifier: "V1524505", role: "omMember", loginRole: "omMember", operatorEmployeeId: "giangth1", password: "123" },
    });
    assert.equal(giang.response.status, 200);
    assert.equal(giang.json.user.employee_id, "giangth1");

    const linh = await request(baseUrl, "/api/login", {
      method: "POST",
      body: { identifier: "V1524505", role: "omMember", loginRole: "omMember", operatorEmployeeId: "linhnp", password: "123" },
    });
    assert.equal(linh.response.status, 200);
    assert.equal(linh.json.user.employee_id, "linhnp");
  } finally {
    server.close();
  }
});

test("invalid login fails and does not create a session", async () => {
  const server = createServer();
  const baseUrl = await listen(server);
  try {
    const result = await login(baseUrl, "maint5", "wrong");
    assert.equal(result.response.status, 401);
    assert.equal(result.json.error, "Invalid account or password");
  } finally {
    server.close();
  }
});

test("workflow review rows require review role and return a stable rows payload", async () => {
  const server = createServer();
  const baseUrl = await listen(server);
  try {
    const anonymous = await request(baseUrl, "/api/workflow/review-rows");
    assert.equal(anonymous.response.status, 401);
    const requester = await login(baseUrl, "V1524505");
    const blocked = await request(baseUrl, "/api/workflow/review-rows", { cookie: requester.cookie });
    assert.equal(blocked.response.status, 403);
    assert.equal(blocked.json.error, "Workflow review role required");

    const deptDri = await login(baseUrl, "dept-dri");
    const reviewRows = await request(baseUrl, "/api/workflow/review-rows", { cookie: deptDri.cookie });
    assert.equal(reviewRows.response.status, 200);
    assert.equal(Array.isArray(reviewRows.json.rows), true);
  } finally {
    server.close();
  }
});

test("Lv123 taxonomy API returns the canonical Excel-derived taxonomy", async () => {
  const server = createServer();
  const baseUrl = await listen(server);
  try {
    const result = await request(baseUrl, "/api/taxonomy/lv123");
    assert.equal(result.response.status, 200);
    assert.equal(result.json.taxonomy.length, 102);
    assert.ok(result.json.taxonomy.some((row) =>
      row.lv1 === "生產設備與工具"
      && row.lv2 === "設備配件"
      && row.lv3 === "設備零組件"));
    assert.ok(result.json.tree["生產設備與工具"]["設備配件"].includes("設備零組件"));
  } finally {
    server.close();
  }
});

test("Requester catalog API exposes Lv123 but hides internal material identity", async () => {
  const server = createServer();
  const baseUrl = await listen(server);
  try {
    const requester = await login(baseUrl, "V1524505");
    const result = await request(baseUrl, "/api/catalog/items?limit=5", { cookie: requester.cookie });
    assert.equal(result.response.status, 200);
    assert.equal(result.json.items.length > 0, true);
    const item = result.json.items[0];
    assert.ok(item.lv1);
    assert.ok(item.lv2);
    assert.ok(item.lv3);
    assert.equal(Object.hasOwn(item, "factoryMaterialNo"), false);
    assert.equal(Object.hasOwn(item, "pkMaterialNo"), false);
    assert.equal(Object.hasOwn(item, "sapMaterialNo"), false);
    assert.equal(Object.hasOwn(item, "ftvCode"), false);
  } finally {
    server.close();
  }
});

test("static server only exposes browser runtime assets", async () => {
  const server = createServer();
  const baseUrl = await listen(server);
  try {
    const index = await fetch(`${baseUrl}/index.html`);
    assert.equal(index.status, 200);
    assert.match(await index.text(), /Purchasing System/);

    const module = await fetch(`${baseUrl}/app-modules/quote-validity.js`);
    assert.equal(module.status, 200);
    assert.match(await module.text(), /quote/i);

    for (const pathName of ["/server.js", "/db/schema.sql", "/package.json", "/tests/api.test.js"]) {
      const blocked = await fetch(`${baseUrl}${pathName}`);
      assert.equal(blocked.status, 404, `${pathName} should not be public`);
    }
  } finally {
    server.close();
  }
});

test("Admin can create, deactivate, and audit lifecycle-managed users", async () => {
  const server = createServer();
  const baseUrl = await listen(server);
  try {
    const admin = await login(baseUrl, "admin");
    const created = await request(baseUrl, "/api/admin/users", {
      method: "POST",
      cookie: admin.cookie,
      body: {
        employeeId: "EMP-ADMIN-001",
        name: "Dept Head Seed",
        email: "dept-head-seed@fih-foxconn.com",
        department: "MFG",
        role_key: "requester",
        scopeType: "department",
        scopeValue: "MFG",
      },
    });
    assert.equal(created.response.status, 201);
    assert.equal(created.json.user.employee_id, "EMP-ADMIN-001");

    const createdLogin = await login(baseUrl, "EMP-ADMIN-001");
    assert.equal(createdLogin.response.status, 200);

    const deactivated = await request(baseUrl, `/api/admin/users/${encodeURIComponent(created.json.user.id)}/status`, {
      method: "PATCH",
      cookie: admin.cookie,
      body: { status: "inactive" },
    });
    assert.equal(deactivated.response.status, 200);
    assert.equal(deactivated.json.user.status, "inactive");

    const createdAfterDeactivate = await request(baseUrl, "/api/me", { cookie: createdLogin.cookie });
    assert.equal(createdAfterDeactivate.response.status, 401);

    const failedLogin = await login(baseUrl, "EMP-ADMIN-001");
    assert.equal(failedLogin.response.status, 401);

    const audit = await request(baseUrl, "/api/admin/audit-events", { cookie: admin.cookie });
    assert.equal(audit.response.status, 200);
    assert.equal(audit.json.events.some((event) => event.event_type === "admin.user_created"), true);
    assert.equal(audit.json.events.some((event) => event.event_type === "admin.user_deactivated"), true);
  } finally {
    server.close();
  }
});

test("Admin can manage roles, permissions, field visibility, and exports", async () => {
  const server = createServer();
  const baseUrl = await listen(server);
  try {
    const admin = await login(baseUrl, "admin");

    const roleCreated = await request(baseUrl, "/api/admin/roles", {
      method: "POST",
      cookie: admin.cookie,
      body: { role_key: "deptHead", role_name: "Dept Head", role_level: "governance" },
    });
    assert.equal(roleCreated.response.status, 201);
    assert.equal(roleCreated.json.role.role_key, "deptHead");

    const permissionUpdated = await request(baseUrl, "/api/admin/roles/deptHead/permissions", {
      method: "PATCH",
      cookie: admin.cookie,
      body: {
        permissions: {
          "admin.users": {
            canCreate: true,
            canUpdate: true,
            canDelete: false,
            canView: true,
            canExport: false,
          },
        },
      },
    });
    assert.equal(permissionUpdated.response.status, 200);
    assert.equal(permissionUpdated.json.permissions["admin.users"].can_create, 1);

    const fieldsUpdated = await request(baseUrl, "/api/admin/field-visibility", {
      method: "PATCH",
      cookie: admin.cookie,
      body: { rules: [{ fieldKey: "vendor", roleKey: "deptHead", visibility: "visible" }] },
    });
    assert.equal(fieldsUpdated.response.status, 200);
    assert.equal(fieldsUpdated.json.rules.find((row) => row.field_key === "vendor").visibility_by_role.deptHead, "visible");

    const usersExport = await fetch(`${baseUrl}/api/admin/users/export?format=csv`, {
      headers: { Cookie: admin.cookie },
    });
    assert.equal(usersExport.status, 200);
    const usersCsv = await usersExport.text();
    assert.match(usersCsv, /employee_id,name,email/);

    const auditExport = await fetch(`${baseUrl}/api/admin/audit-events/export`, {
      headers: { Cookie: admin.cookie },
    });
    assert.equal(auditExport.status, 200);
    const auditCsv = await auditExport.text();
    assert.match(auditCsv, /created_at,event_type,actor_user_id/);
  } finally {
    server.close();
  }
});

test("OM Leader can assign rows; OM Purchasing member cannot assign rows", async () => {
  memoryStore.assignments.clear();
  const server = createServer();
  const baseUrl = await listen(server);
  try {
    const mai = await login(baseUrl, "maint5");
    const giang = await login(baseUrl, "giangth1");

    const leaderAssign = await request(baseUrl, "/api/om/requests/REQ-OM-001/assign", {
      method: "POST",
      cookie: mai.cookie,
      body: { assignedToUserId: "om-member-giang", note: "PAS demand no owner" },
    });
    assert.equal(leaderAssign.response.status, 200);
    assert.equal(leaderAssign.json.assignment.assignedToUserId, "om-member-giang");

    const memberAssign = await request(baseUrl, "/api/om/requests/REQ-OM-002/assign", {
      method: "POST",
      cookie: giang.cookie,
      body: { assignedToUserId: "om-member-linh" },
    });
    assert.equal(memberAssign.response.status, 403);

    const assignments = await request(baseUrl, "/api/om/assignments", { cookie: mai.cookie });
    assert.equal(assignments.response.status, 200);
    assert.equal(assignments.json.assignments.length, 1);
    assert.equal(assignments.json.assignments[0].requestId, "REQ-OM-001");
  } finally {
    server.close();
  }
});

test("Admin can manage OM assignment rules and OM can read them", async () => {
  memoryStore.omAssignmentRules = [
    {
      id: "om-rule-p27-f27-linh",
      name: "P27/F27 -> Linh",
      active: true,
      priority: 10,
      projectCodes: ["P27", "F27"],
      projectFamilies: [],
      departmentScopes: [],
      assigneeUserId: "om-member-linh",
      isFallback: false,
      note: "seed",
    },
    {
      id: "om-rule-fallback-giang",
      name: "Fallback -> Giang",
      active: true,
      priority: 999,
      projectCodes: [],
      projectFamilies: [],
      departmentScopes: [],
      assigneeUserId: "om-member-giang",
      isFallback: true,
      note: "seed fallback",
    },
  ];
  const server = createServer();
  const baseUrl = await listen(server);
  try {
    const admin = await login(baseUrl, "admin");
    const giang = await login(baseUrl, "giangth1");

    const created = await request(baseUrl, "/api/admin/om-assignment-rules", {
      method: "POST",
      cookie: admin.cookie,
      body: {
        name: "IT -> Linh",
        active: true,
        priority: 30,
        projectCodes: [],
        projectFamilies: ["Non-G"],
        departmentScopes: ["IT"],
        assigneeUserId: "om-member-linh",
        isFallback: false,
        note: "non-g it",
      },
    });
    assert.equal(created.response.status, 201);
    assert.equal(created.json.rule.assigneeUserId, "om-member-linh");

    const updated = await request(baseUrl, `/api/admin/om-assignment-rules/${created.json.rule.id}`, {
      method: "PATCH",
      cookie: admin.cookie,
      body: {
        priority: 25,
        note: "updated",
      },
    });
    assert.equal(updated.response.status, 200);
    assert.equal(updated.json.rule.priority, 25);
    assert.equal(updated.json.rule.note, "updated");

    const adminList = await request(baseUrl, "/api/admin/om-assignment-rules", { cookie: admin.cookie });
    assert.equal(adminList.response.status, 200);
    assert.ok(adminList.json.rules.some((rule) => rule.id === created.json.rule.id));

    const omList = await request(baseUrl, "/api/om/assignment-rules", { cookie: giang.cookie });
    assert.equal(omList.response.status, 200);
    assert.ok(omList.json.rules.some((rule) => rule.id === created.json.rule.id));
  } finally {
    server.close();
  }
});

test("Requester can sign in with employee ID and receives responsibility scope", async () => {
  const server = createServer();
  const baseUrl = await listen(server);
  try {
    const result = await login(baseUrl, "V1524505");
    assert.equal(result.response.status, 200);
    assert.equal(result.json.user.role, "requester");
    assert.equal(result.json.user.employee_id, "V1524505");
    assert.equal(result.json.user.project_family, "G");
    assert.match(result.json.user.project_codes, /P26/);
  } finally {
    server.close();
  }
});




test("attachments persist metadata, download bytes, and guard OM-internal files", async () => {
  memoryStore.attachments.clear();
  memoryStore.auditEvents.length = 0;
  fs.rmSync(process.env.UPLOAD_ROOT, { recursive: true, force: true });
  const server = createServer();
  const baseUrl = await listen(server);
  try {
    const requester = await login(baseUrl, "V1524505");
    const giang = await login(baseUrl, "giangth1");
    const omUpload = await uploadFile(baseUrl, "/api/attachments", {
      cookie: giang.cookie,
      fields: {
        linkedEntityType: "om_quote",
        linkedEntityId: "REQ-OM-ATTACH-001",
        attachmentKind: "om_quote_excel",
        visibilityScope: "om_internal",
      },
      file: { name: "quote.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", content: "quote excel bytes" },
    });
    assert.equal(omUpload.response.status, 201);

    const blocked = await fetch(`${baseUrl}${omUpload.json.attachment.downloadUrl}`, {
      headers: { Cookie: requester.cookie },
    });
    assert.equal(blocked.status, 403);

    const omDownload = await fetch(`${baseUrl}${omUpload.json.attachment.downloadUrl}`, {
      headers: { Cookie: giang.cookie },
    });
    assert.equal(omDownload.status, 200);
    assert.equal(await omDownload.text(), "quote excel bytes");

    assert.ok(memoryStore.auditEvents.some((event) => event.event_type === "attachment.uploaded"));
    assert.ok(memoryStore.auditEvents.some((event) => event.event_type === "attachment.downloaded"));
    assert.ok(memoryStore.auditEvents.some((event) => event.event_type === "attachment.download_blocked"));
  } finally {
    server.close();
  }
});
