function createDatabase({ pool: suppliedPool } = {}) {
let mysql = null;
let mysqlLoadError = null;
function mysqlConfigPresent() {
  return Boolean(process.env.MYSQL_URL || process.env.MYSQL_HOST || process.env.DB_HOST);
}

function mysqlDriver() {
  if (!mysqlConfigPresent()) return null;
  if (mysql) return mysql;
  if (mysqlLoadError) return null;
  try {
    mysql = require("mysql2/promise");
    return mysql;
  } catch (error) {
    mysqlLoadError = error;
    return null;
  }
}

function createPool() {
  const driver = mysqlDriver();
  if (!driver) return null;
  if (process.env.MYSQL_URL) return driver.createPool(process.env.MYSQL_URL);
  return driver.createPool({
    host: process.env.MYSQL_HOST || process.env.DB_HOST,
    port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQL_USER || process.env.DB_USER,
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || "mva_procurement_uat",
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || process.env.DB_CONNECTION_LIMIT || 10),
  });
}
const pool = suppliedPool === undefined ? createPool() : suppliedPool;
async function healthStatus() {
  if (!pool) return { status: 200, payload: { ok: true, db: "memory-fallback" } };
  try {
    await pool.query("SELECT 1 AS ok");
    return { status: 200, payload: { ok: true, db: "mysql" } };
  } catch {
    return { status: 503, payload: { ok: false, db: "mysql", error: "Database health check failed" } };
  }
}
return { pool, mysqlConfigPresent, healthStatus };
}
module.exports = { createDatabase };
