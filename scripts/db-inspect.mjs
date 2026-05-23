import mysql from "mysql2/promise";

const c = await mysql.createConnection({
  host: "157.173.100.19",
  port: 3306,
  user: "remoteuser",
  password: process.env.E2E_DB_PASSWORD || "StrongPassword123!",
  database: "SouqAlHal",
});

const [t] = await c.query(
  `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
   WHERE TABLE_SCHEMA='SouqAlHal' AND (TABLE_NAME LIKE '%direct%' OR TABLE_NAME LIKE '%order%')`,
);
const [role] = await c.query("SELECT RoleId FROM userroles WHERE UserId = 5");
console.log("user 5 role:", role[0]?.RoleId);
console.log(
  "direct tables:",
  t.map((r) => r.TABLE_NAME),
);

for (const name of t.map((r) => r.TABLE_NAME)) {
  const [rows] = await c.query(`SELECT * FROM \`${name}\` LIMIT 2`);
  console.log(name, rows[0] ? Object.keys(rows[0]).join(", ") : "empty");
}

await c.end();
