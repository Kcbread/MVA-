const test = require("node:test");
const assert = require("node:assert/strict");
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

async function login(baseUrl, identifier, password = "123") {
  return request(baseUrl, "/api/login", { method: "POST", body: { identifier, password } });
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
