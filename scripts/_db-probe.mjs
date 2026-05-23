import mysql from "mysql2/promise";

const c = await mysql.createConnection({
  host: process.env.E2E_DB_HOST || "157.173.100.19",
  port: Number(process.env.E2E_DB_PORT || 3306),
  user: process.env.E2E_DB_USER || "remoteuser",
  password: process.env.E2E_DB_PASSWORD,
  database: process.env.E2E_DB_NAME || "SouqAlHal",
});

async function cols(table) {
  const [r] = await c.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = 'SouqAlHal' AND TABLE_NAME = ?`,
    [table],
  );
  return r.map((x) => x.COLUMN_NAME);
}

for (const t of ["crops", "farms", "directlistings"]) {
  console.log(t, (await cols(t)).join(", "));
}

const [anyCrop] = await c.query("SELECT * FROM crops LIMIT 1");
console.log("crop sample keys", anyCrop[0] ? Object.keys(anyCrop[0]) : "empty");

const [listings] = await c.query(
  "SELECT * FROM directlistings WHERE Status = 'active' ORDER BY 1 DESC LIMIT 2",
);
console.log("listing sample", listings[0] ? Object.keys(listings[0]) : "none");

await c.end();
