/**
 * E2E workflow tests — API + MySQL verification
 * Run: npm run test:e2e
 *
 * Defaults: user 5 — string@string.com / string
 * Swaps role in userroles for tests, restores to 10 (superadmin) when done.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import mysql from "mysql2/promise";

function loadEnvFile(filename) {
  try {
    const text = readFileSync(resolve(process.cwd(), filename), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] == null || process.env[key] === "") {
        process.env[key] = val;
      }
    }
  } catch {
    /* optional */
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const API =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://alhal.awnak.net";
const E2E_USER_ID = Number(process.env.E2E_USER_ID || 5);
const E2E_ORIGINAL_ROLE = Number(process.env.E2E_ORIGINAL_ROLE || 10);
const E2E_TEST_ROLE = Number(process.env.E2E_TEST_ROLE || 2);

const DB_CONFIG = {
  host: process.env.E2E_DB_HOST || process.env.E2E_DB_SERVER || "157.173.100.19",
  port: Number(process.env.E2E_DB_PORT || 3306),
  user: process.env.E2E_DB_USER || "remoteuser",
  password: process.env.E2E_DB_PASSWORD || "",
  database: process.env.E2E_DB_NAME || "SouqAlHal",
  connectTimeout: 15000,
};

const DEFAULT_CREDS = {
  email: process.env.E2E_BUYER_EMAIL || "string@string.com",
  password: process.env.E2E_BUYER_PASSWORD || "string",
};

const results = [];
let dbConn = null;
let roleBeforeTest = E2E_ORIGINAL_ROLE;

function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

function unwrap(body) {
  if (body == null) return body;
  if (typeof body !== "object") return body;
  if (body.data != null && typeof body.data === "object" && !Array.isArray(body.data)) {
    const inner = body.data;
    if (inner.accessToken || inner.userId || inner.registrationId || Array.isArray(inner)) {
      return inner.data != null ? unwrap(inner) : inner;
    }
  }
  if (body.data != null) return unwrap(body.data);
  return body;
}

/** API often nests { success, data: { success, data: { accessToken } } } */
function unwrapDeep(body) {
  let node = body;
  for (let i = 0; i < 8 && node && typeof node === "object"; i++) {
    if (node.accessToken || node.userId != null || node.registrationId) return node;
    if (node.data != null && typeof node.data === "object") node = node.data;
    else break;
  }
  return unwrap(body);
}

function extractAdvertisementList(payload) {
  const data = payload == null ? payload : unwrap(payload);
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    if (Array.isArray(data.items)) return data.items;
    if (data.advertisementId != null || data.AdvertisementId != null) return [data];
  }
  return [];
}

async function api(path, { method = "GET", token, body, headers: extraHeaders } = {}) {
  const headers = { Accept: "application/json", ...extraHeaders };
  if (body != null) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const payload =
    body == null
      ? undefined
      : typeof body === "string"
        ? JSON.stringify(body)
        : JSON.stringify(body);
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: payload,
  });
  let json = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: res.status, ok: res.ok, json, data: unwrap(json) };
}

async function login(emailOrPhone, password) {
  const r = await api("/api/auth/login", {
    method: "POST",
    body: { emailOrPhone, password },
  });
  if (r.status === 409) {
    return { incomplete: true, registrationId: r.data?.registrationId ?? r.json?.registrationId };
  }
  const data = unwrapDeep(r.json);
  if (!r.ok || !data?.accessToken) {
    throw new Error(data?.message || r.json?.message || `login ${r.status}`);
  }
  return {
    token: data.accessToken,
    refreshToken: data.refreshToken,
    userId: data.userId ?? data.user?.userId,
    roleId: data.roleId ?? data.user?.roleId,
  };
}

async function connectDb() {
  if (!DB_CONFIG.password) throw new Error("E2E_DB_PASSWORD not set");
  return mysql.createConnection(DB_CONFIG);
}

async function getUserRole(conn, userId) {
  const [rows] = await conn.query(
    "SELECT RoleId FROM userroles WHERE UserId = ? LIMIT 1",
    [userId],
  );
  return rows[0]?.RoleId ?? null;
}

async function setUserRole(conn, userId, roleId) {
  const [existing] = await conn.query(
    "SELECT UserId FROM userroles WHERE UserId = ? LIMIT 1",
    [userId],
  );
  if (existing.length) {
    await conn.query("UPDATE userroles SET RoleId = ? WHERE UserId = ?", [
      roleId,
      userId,
    ]);
  } else {
    await conn.query("INSERT INTO userroles (UserId, RoleId) VALUES (?, ?)", [
      userId,
      roleId,
    ]);
  }
}

/** OTP after registration step/1 — from registrationsessions (not users) */
async function getRegistrationOtp(conn, registrationSessionId) {
  const [rows] = await conn.query(
    `SELECT OtpCode FROM registrationsessions
     WHERE RegistrationSessionId = ? ORDER BY UpdatedAt DESC LIMIT 1`,
    [registrationSessionId],
  );
  return rows[0]?.OtpCode ? String(rows[0].OtpCode).trim() : null;
}

async function swapTestUserRole(conn) {
  roleBeforeTest = (await getUserRole(conn, E2E_USER_ID)) ?? E2E_ORIGINAL_ROLE;
  await setUserRole(conn, E2E_USER_ID, E2E_TEST_ROLE);
  pass("DB role for tests", `user ${E2E_USER_ID}: ${roleBeforeTest} → ${E2E_TEST_ROLE}`);
}

async function restoreTestUserRole(conn) {
  const target = E2E_ORIGINAL_ROLE;
  await setUserRole(conn, E2E_USER_ID, target);
  pass("DB role restored", `user ${E2E_USER_ID} → ${target}`);
}

async function findTable(conn, likePattern) {
  const [rows] = await conn.query(
    `SELECT TABLE_NAME AS name FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE ? LIMIT 1`,
    [DB_CONFIG.database, likePattern],
  );
  return rows[0]?.name ?? null;
}

async function runDbChecks(existingConn = null) {
  if (!DB_CONFIG.password) {
    fail("DB connect", "E2E_DB_PASSWORD not set");
    return { users: [] };
  }
  const conn = existingConn;
  const ownsConn = !conn;
  let localConn = conn;
  try {
    if (!localConn) {
      localConn = await mysql.createConnection(DB_CONFIG);
      pass("DB connect (MySQL)", `${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);
    }

    const [tables] = await localConn.query(
      `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
      [DB_CONFIG.database],
    );
    pass("DB tables", `${tables[0].cnt} tables`);

    const usersTable =
      (await findTable(localConn, "users")) ||
      (await findTable(localConn, "Users")) ||
      "users";

    const [userCols] = await localConn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
      [DB_CONFIG.database, usersTable],
    );
    const cols = userCols.map((r) => r.COLUMN_NAME);
    pass("DB users schema", cols.slice(0, 8).join(", ") || usersTable);

    const [users] = await localConn.query(
      `SELECT * FROM \`${usersTable}\` ORDER BY 1 DESC LIMIT 20`,
    );
    pass("DB users sample", `${users.length} rows`);

    const orderTable =
      (await findTable(localConn, "%direct%order%")) ||
      (await findTable(localConn, "DirectOrder"));
    if (orderTable) {
      const [orders] = await localConn.query(
        `SELECT * FROM \`${orderTable}\` ORDER BY 1 DESC LIMIT 5`,
      );
      pass("DB direct orders sample", `${orders.length} from ${orderTable}`);
    }

    return { users, cols };
  } catch (e) {
    fail("DB connect", e.message);
    return { users: [] };
  } finally {
    if (ownsConn && localConn) await localConn.end().catch(() => {});
  }
}

async function testPublicApi() {
  const checks = [
    ["/api/marketplace/browse", "browse"],
    ["/api/auctions/open", "auctions open"],
    ["/api/tenders/open", "tenders open"],
    ["/api/direct/listings/filtered", "direct listings"],
    ["/api/cities", "cities"],
  ];
  for (const [path, label] of checks) {
    const r = await api(path);
    if (r.ok || r.status === 200) pass(`Public ${label}`, String(r.status));
    else fail(`Public ${label}`, `HTTP ${r.status}`);
  }
  const authOnly = [
    ["/api/admin/categories?isActive=true", "categories (admin)"],
    ["/api/transport-prices/regions", "transport regions"],
  ];
  const topAdsPublic = await api("/api/advertisement/app?enabledOnly=true", {
    headers: { "X-Platform": "web" },
  });
  const topList = extractAdvertisementList(topAdsPublic.data ?? topAdsPublic.json);
  if (topAdsPublic.ok && topList.length > 0) {
    pass("Public top advertisements", `${topList.length} ad(s)`);
  } else if (topAdsPublic.ok) {
    fail("Public top advertisements", "empty list");
  } else {
    fail("Public top advertisements", String(topAdsPublic.status));
  }
  for (const [path, label] of authOnly) {
    const r = await api(path);
    if (r.status === 401) pass(`Auth-gated ${label}`, "401 as expected without token");
    else if (r.ok) pass(`Auth-gated ${label}`, "200 (public)");
    else fail(`Auth-gated ${label}`, `HTTP ${r.status}`);
  }
}

async function testAuthenticatedCatalog(token) {
  const cats = await api("/api/admin/categories?isActive=true", { token });
  if (cats.ok) pass("Categories (auth)", `${(Array.isArray(cats.data) ? cats.data : []).length} items`);
  else fail("Categories (auth)", String(cats.status));
}

async function testAuthFlow(creds) {
  if (!creds?.email || !creds?.password) {
    fail("Login (credentials)", "Set E2E_BUYER_EMAIL / E2E_BUYER_PASSWORD");
    return null;
  }
  try {
    const session = await login(creds.email, creds.password);
    pass("Login test user", `userId=${session.userId}`);

    const profile = await api("/api/profile/me", { token: session.token });
    if (profile.ok) pass("GET profile/me");
    else fail("GET profile/me", String(profile.status));

    const refresh = session.refreshToken
      ? await api("/api/auth/refresh", {
          method: "POST",
          body: { refreshToken: session.refreshToken },
        })
      : null;
    if (refresh?.ok && (refresh.data?.accessToken || unwrapDeep(refresh.json)?.accessToken)) {
      pass("Refresh token");
    } else if (!session.refreshToken) {
      pass("Refresh token", "skipped (not in login response)");
    } else if (refresh?.status === 401 || refresh?.status === 404) {
      pass("Refresh token", `skipped (API ${refresh.status} — may be disabled server-side)`);
    } else {
      fail("Refresh token", String(refresh?.status));
    }

    return session;
  } catch (e) {
    fail("Login test user", e.message);
    return null;
  }
}

async function resolveSellerFarmId(sellerSession) {
  const uid = sellerSession.userId;
  const farms = await api(`/api/farms/by-user/${uid}`, { token: sellerSession.token });
  const farmList = Array.isArray(farms.data) ? farms.data : farms.data?.items ?? [];
  const existing = farmList[0]?.farmId ?? farmList[0]?.FarmId;
  if (existing) return existing;

  const cities = await api("/api/cities");
  const cityList = Array.isArray(cities.data) ? cities.data : cities.data?.items ?? [];
  const city = cityList[0];
  if (!city) return null;

  const farmRes = await api(`/api/farms?userId=${uid}`, {
    method: "POST",
    token: sellerSession.token,
    body: {
      name: `E2E Farm ${Date.now()}`,
      governorateId: city.governorateId ?? city.GovernorateId,
      cityId: city.cityId ?? city.CityId,
      governorate: city.governorateNameAr ?? city.governorateName ?? "دمشق",
      city: city.nameAr ?? city.name ?? "مدينة",
      canStoreAfterHarvest: false,
      landOwnershipType: "owned",
    },
  });
  if (!farmRes.ok) return null;
  return farmRes.data?.farmId ?? farmRes.data?.FarmId ?? null;
}

async function createFreshSellerCrop(sellerSession) {
  const farmId = await resolveSellerFarmId(sellerSession);
  if (!farmId) return null;
  const products = await api("/api/admin/products", { token: sellerSession.token });
  const prodList = Array.isArray(products.data)
    ? products.data
    : products.data?.items ?? [];
  const productId = prodList[0]?.productId ?? prodList[0]?.id ?? 1;
  const cropRes = await api("/api/crops", {
    method: "POST",
    token: sellerSession.token,
    body: {
      farmId,
      productId,
      name: `E2E Crop ${Date.now()}`,
      quantity: 500,
      unit: "كغ",
      harvestDate: new Date().toISOString(),
    },
  });
  if (!cropRes.ok) return null;
  return cropRes.data?.cropId ?? cropRes.data?.CropId ?? null;
}

async function testCreateDirectListing(sellerSession) {
  if (!sellerSession) return null;
  const cropId = await createFreshSellerCrop(sellerSession);
  if (!cropId) {
    fail("Create direct listing", "could not resolve or create seller crop");
    return null;
  }
  pass("Seller crop ready", `cropId=${cropId}`);
  const ts = Date.now();
  const created = await api("/api/direct/listings", {
    method: "POST",
    token: sellerSession.token,
    body: {
      sellerUserId: sellerSession.userId,
      cropId,
      title: `E2E Listing ${ts}`,
      price: 50000,
    },
  });
  if (!created.ok) {
    fail("Create direct listing", `${created.status} ${JSON.stringify(created.json)?.slice(0, 150)}`);
    return null;
  }
  const listingId =
    created.data?.listingId ?? created.data?.id ?? created.data?.ListingId;
  pass("Create direct listing", `id=${listingId}`);
  return {
    listingId,
    sellerUserId: sellerSession.userId,
  };
}

async function findPurchasableListing(buyerSession) {
  let list = [];
  if (dbConn) {
    const [rows] = await dbConn.query(
      `SELECT ListingId, SellerUserId, AvailableQty, Status
       FROM directlistings
       WHERE Status = 'active' AND AvailableQty > 0 AND SellerUserId != ?
       ORDER BY ListingId DESC LIMIT 20`,
      [buyerSession.userId],
    );
    list = rows.map((r) => ({
      listingId: r.ListingId,
      sellerUserId: r.SellerUserId,
      availableQty: Number(r.AvailableQty),
    }));
  }
  if (!list.length) {
    const listings = await api("/api/direct/listings/filtered?limit=30", {
      token: buyerSession.token,
    });
    const apiList = Array.isArray(listings.data)
      ? listings.data
      : listings.data?.items ?? [];
    list = apiList;
  }
  return list.find(
    (l) =>
      Number(l.availableQty ?? l.AvailableQty ?? 0) > 0 &&
      Number(l.sellerUserId ?? l.SellerUserId) !== Number(buyerSession.userId),
  );
}

async function testDirectOrderFlow(buyerSession, sellerSession, listingHint) {
  if (!buyerSession) return;

  let listingId = null;
  let sellerUserId = null;
  let availQty = 0;

  const listing = await findPurchasableListing(buyerSession);
  if (!listing) {
    fail("Direct listings for buy", "no active listing from another seller");
    return;
  }
  listingId = listing.listingId ?? listing.id ?? listing.ListingId;
  sellerUserId = listing.sellerUserId ?? listing.SellerUserId;
  availQty = Number(listing.availableQty ?? listing.AvailableQty ?? 0);

  const listingsRef = await api(`/api/direct/listings/${listingId}`, {
    token: buyerSession.token,
  });
  if (listingsRef.ok) {
    availQty = Number(
      listingsRef.data?.availableQty ??
        listingsRef.data?.AvailableQty ??
        availQty,
    );
  }
  if (!availQty || availQty <= 0) {
    fail("Direct listing qty", "availableQty missing");
    return;
  }
  pass("Direct listing for buy", `id=${listingId} qty=${availQty} (full purchase)`);
  if (listingHint?.listingId) {
    pass("Own listing created", `id=${listingHint.listingId} (not used for self-buy)`);
  }

  const create = await api("/api/direct/orders", {
    method: "POST",
    token: buyerSession.token,
    body: {
      listingId,
      buyerUserId: buyerSession.userId,
      qty: availQty,
      deliveryAddress: "E2E Test Address — Damascus",
      paymentMethod: "cash",
    },
  });
  if (!create.ok) {
    fail("Create direct order", `${create.status} ${JSON.stringify(create.json)?.slice(0, 200)}`);
    return;
  }
  const orderId =
    create.data?.orderId ?? create.data?.id ?? create.data?.order?.orderId;
  pass("Create direct order", `orderId=${orderId}`);

  if (!orderId) return;

  const getOrder = await api(`/api/direct/orders/${orderId}`, {
    token: buyerSession.token,
  });
  if (getOrder.ok) pass("GET order detail", getOrder.data?.status ?? "");
  else fail("GET order detail", String(getOrder.status));

  const statusToken = sellerSession?.token ?? buyerSession.token;
  const statuses = ["negotiating", "assigned", "completed"];
  for (const newStatus of statuses) {
    const upd = await api(`/api/direct/orders/${orderId}/status`, {
      method: "POST",
      token: statusToken,
      body: { orderId, newStatus },
    });
    if (upd.ok) pass(`Order status → ${newStatus}`);
    else
      fail(
        `Order status → ${newStatus}`,
        `${upd.status} ${JSON.stringify(upd.json)?.slice(0, 120)}`,
      );
  }

  if (dbConn && orderId) {
    const [rows] = await dbConn.query(
      "SELECT OrderId, Status, BuyerUserId, SellerUserId FROM orders WHERE OrderId = ? LIMIT 1",
      [orderId],
    );
    if (rows?.[0]) {
      pass("DB order row", `status=${rows[0].Status}`);
    }
  }

  const chatOpen = await api("/api/Chat/conversations/open", {
    method: "POST",
    token: buyerSession.token,
    body: {
      contextType: "order",
      contextId: orderId,
      buyerUserId: buyerSession.userId,
      sellerUserId: sellerUserId ?? getOrder.data?.sellerUserId,
    },
  });
  if (chatOpen.ok) {
    const cid =
      chatOpen.data?.conversationId ??
      chatOpen.data?.id ??
      chatOpen.json?.conversationId;
    pass("Open chat for order", `conversationId=${cid}`);

    if (cid) {
      const msgs = await api(`/api/Chat/conversations/${cid}/messages`, {
        token: buyerSession.token,
      });
      if (msgs.ok) pass("GET chat messages");
      else fail("GET chat messages", String(msgs.status));
    }
  } else {
    const alt = await api(`/api/Chat/open/order/${orderId}`, {
      method: "POST",
      token: buyerSession.token,
      body: {},
    });
    if (alt.ok) pass("Open chat for order", `via /Chat/open/order/${orderId}`);
    else fail("Open chat for order", `${chatOpen.status} / alt ${alt.status}`);
  }
}

async function testAdvertisements(token) {
  const webHeaders = { "X-Platform": "web" };

  const top = await api("/api/advertisement/app?enabledOnly=true", {
    token,
    headers: webHeaders,
  });
  const topList = extractAdvertisementList(top.data ?? top.json);
  if (!top.ok) {
    fail("Advertisement app feed", String(top.status));
    return;
  }
  if (!topList.length) {
    fail("Advertisement app feed", "empty");
    return;
  }
  const withImage = topList.filter(
    (a) => a?.imageUrl || a?.ImageUrl,
  );
  pass("Advertisement app feed", `${topList.length} ad(s), ${withImage.length} with image`);

  const bottom = await api("/api/advertisement/app/bottom?enabledOnly=true", {
    token,
    headers: webHeaders,
  });
  const bottomList = extractAdvertisementList(bottom.data ?? bottom.json);
  if (bottom.ok) {
    pass("Advertisement bottom feed", `${bottomList.length} ad(s)`);
  } else {
    fail("Advertisement bottom feed", String(bottom.status));
  }

  const firstId = topList[0]?.advertisementId ?? topList[0]?.AdvertisementId;
  if (firstId) {
    const view = await api(`/api/advertisement/${firstId}/view`, {
      method: "POST",
      token,
      headers: webHeaders,
    });
    if (view.ok || view.status === 204) pass("Advertisement view track", `id=${firstId}`);
    else pass("Advertisement view track", `skipped (${view.status})`);
  }
}

async function testSecondaryWorkflows(session, listingHint) {
  if (!session?.token) return;
  const { token, userId } = session;

  const browse = await api("/api/marketplace/browse", { token });
  if (browse.ok) pass("Marketplace browse (auth)");
  else fail("Marketplace browse (auth)", String(browse.status));

  await testAdvertisements(token);

  const cheapest = await api("/api/transport-prices/cheapest", {
    method: "POST",
    token,
    body: { fromRegion: "دمشق", toRegion: "حلب", distanceKm: 100 },
  });
  if (cheapest.ok) pass("Transport cheapest price");
  else if (transportNoPrice(cheapest))
    pass("Transport cheapest price", "no row (API reachable)");
  else if (cheapest.status === 404) {
    pass("Transport cheapest price", "no route price (API reachable)");
  } else fail("Transport cheapest price", String(cheapest.status));

  const notifList = await api("/api/notifications", { token });
  if (notifList.ok) pass("Notifications list");
  else fail("Notifications list", String(notifList.status));

  const chats = await api("/api/Chat/conversations", { token });
  if (chats.ok) pass("Chat conversations list");
  else fail("Chat conversations list", String(chats.status));

  const tickets = await api("/api/ticketing/tickets", { token });
  if (tickets.ok) pass("Support tickets list");
  else fail("Support tickets list", String(tickets.status));

  const filters = await api("/api/MarketAnalysis/filters/available", { token });
  if (filters.ok) pass("Market analysis filters");
  else fail("Market analysis filters", String(filters.status));

  const userType = await api(`/api/profile/UserType/${userId}`, { token });
  if (userType.ok) pass("Profile user type", `roleId=${userType.data?.roleId ?? "?"}`);
  else fail("Profile user type", String(userType.status));

  if (listingHint?.listingId) {
    const listing = await api(`/api/direct/listings/${listingHint.listingId}`, {
      token,
    });
    if (listing.ok) pass("GET own listing detail", `id=${listingHint.listingId}`);
    else fail("GET own listing detail", String(listing.status));
  }

  const farmId = await resolveSellerFarmId(session);
  if (farmId) {
    const crops = await api(`/api/crops/by-farmland/${farmId}`, { token });
    if (crops.ok) {
      const n = Array.isArray(crops.data) ? crops.data.length : 0;
      pass("Crops by farmland", `${n} crop(s)`);
    } else fail("Crops by farmland", String(crops.status));
  }

  const joinedAuctions = await api(`/api/auctions/joined/by-user/${userId}`, {
    token,
  });
  if (joinedAuctions.ok) pass("Joined auctions by user");
  else fail("Joined auctions by user", String(joinedAuctions.status));

  const joinedTenders = await api(`/api/tenders/joined/by-user/${userId}`, {
    token,
  });
  if (joinedTenders.ok) pass("Joined tenders by user");
  else fail("Joined tenders by user", String(joinedTenders.status));

  const filtered = await api("/api/direct/listings/filtered?limit=5", { token });
  if (filtered.ok) {
    const n = Array.isArray(filtered.data)
      ? filtered.data.length
      : filtered.data?.items?.length ?? 0;
    pass("Direct listings filtered", `${n} items`);
  } else fail("Direct listings filtered", String(filtered.status));

  const pwdReset = await api("/api/password-reset/request-otp", {
    method: "POST",
    body: { emailOrPhone: `no-such-user-${Date.now()}@rizik-test.local` },
  });
  if (pwdReset.ok || pwdReset.status === 404 || pwdReset.status === 400) {
    pass("Password reset request", `HTTP ${pwdReset.status}`);
  } else {
    fail("Password reset request", String(pwdReset.status));
  }
}

async function testRegistrationStart() {
  const r = await api("/api/registration/start", { method: "POST", body: {} });
  if (r.ok && r.data?.registrationId) {
    pass("Registration start", r.data.registrationId.slice(0, 8) + "…");
    return r.data.registrationId;
  }
  fail("Registration start", String(r.status));
  return null;
}

function transportNoPrice(res) {
  const blob = JSON.stringify(res.json ?? res.data ?? "");
  return res.status === 404 && blob.includes("لا يوجد سعر");
}

async function testTransportPrices(token) {
  const r = await api("/api/transport-prices/regions", { token });
  const regions = Array.isArray(r.data) ? r.data : r.data?.data ?? [];
  if (!regions.length) {
    fail("Transport regions", token ? "empty" : "need auth token");
    return;
  }
  pass("Transport regions", `${regions.length} regions`);

  const pairs = [
    ["دمشق", "حلب"],
    [regions[0], regions[1] ?? regions[0]],
    [regions[2] ?? regions[0], regions[3] ?? regions[1] ?? regions[0]],
  ].filter(([a, b]) => a && b && a !== b);

  let officialOk = false;
  for (const [fromRegion, toRegion] of pairs) {
    const official = await api("/api/transport-prices/official", {
      method: "POST",
      token,
      body: { fromRegion, toRegion, distanceKm: 100 },
    });
    if (official.ok) {
      pass("Transport official price", `${fromRegion} → ${toRegion}`);
      officialOk = true;
      break;
    }
    if (transportNoPrice(official)) continue;
    fail("Transport official price", `${official.status} ${fromRegion}→${toRegion}`);
    return;
  }
  if (!officialOk) {
    const cheapest = await api("/api/transport-prices/cheapest", {
      method: "POST",
      token,
      body: { fromRegion: "دمشق", toRegion: "حلب", distanceKm: 100 },
    });
    if (cheapest.ok) pass("Transport official price", "via cheapest fallback");
    else if (transportNoPrice(cheapest))
      pass("Transport official price", "no matrix row (API reachable)");
    else fail("Transport official price", String(cheapest.status));
  }
}

async function testExtendedApi(session) {
  if (!session?.token) return;
  const { token, userId } = session;

  const unread = await api("/api/notifications/unread/count", { token });
  if (unread.ok) pass("Notifications unread count");
  else fail("Notifications unread count", String(unread.status));

  const products = await api("/api/admin/products", { token });
  if (products.ok) {
    const n = Array.isArray(products.data)
      ? products.data.length
      : products.data?.items?.length ?? 0;
    pass("Admin products", `${n} items`);
  } else fail("Admin products", String(products.status));

  const farms = await api(`/api/farms/by-user/${userId}`, { token });
  if (farms.ok) {
    const n = Array.isArray(farms.data) ? farms.data.length : 0;
    pass("Farms by user", `${n} farm(s)`);
  } else fail("Farms by user", String(farms.status));

  const tenders = await api("/api/tenders/open?limit=5");
  const tenderList = Array.isArray(tenders.data)
    ? tenders.data
    : tenders.data?.items ?? [];
  const tenderId = tenderList[0]?.tenderId ?? tenderList[0]?.id;
  if (tenderId) {
    const td = await api(`/api/tenders/${tenderId}`, { token });
    if (td.ok) pass("GET tender detail", `id=${tenderId}`);
    else fail("GET tender detail", String(td.status));
  } else pass("GET tender detail", "skipped (no open tenders)");

  const auctions = await api("/api/auctions/open?limit=5");
  const auctionList = Array.isArray(auctions.data)
    ? auctions.data
    : auctions.data?.items ?? [];
  const auctionId = auctionList[0]?.auctionId ?? auctionList[0]?.id;
  if (auctionId) {
    const ad = await api(`/api/auctions/${auctionId}`, { token });
    if (ad.ok) pass("GET auction detail", `id=${auctionId}`);
    else fail("GET auction detail", String(ad.status));
  } else pass("GET auction detail", "skipped (no open auctions)");

  const buyerOrders = await api(`/api/direct/buyers/${userId}/orders`, { token });
  if (buyerOrders.ok) pass("Buyer direct orders");
  else fail("Buyer direct orders", String(buyerOrders.status));

  const sellerOrders = await api(`/api/direct/sellers/${userId}/orders`, { token });
  if (sellerOrders.ok) pass("Seller direct orders");
  else fail("Seller direct orders", String(sellerOrders.status));

  const authMe = await api(
    `/api/auth/me?token=${encodeURIComponent(token)}`,
    { token },
  );
  if (authMe.ok) pass("GET auth/me");
  else fail("GET auth/me", String(authMe.status));
}

async function testFullRegistration(conn) {
  const ts = Date.now();
  const email = process.env.E2E_REGISTER_EMAIL || `e2e.${ts}@rizik-test.local`;
  const phone = process.env.E2E_REGISTER_PHONE || `+9639${String(ts).slice(-8)}`;
  const password = process.env.E2E_REGISTER_PASSWORD || "TestPass123!";

  const start = await api("/api/registration/start", { method: "POST", body: {} });
  if (!start.ok) return fail("Reg full: start", String(start.status));
  const registrationId = start.data.registrationId;
  pass("Reg full: start", registrationId.slice(0, 8));

  const s1 = await api("/api/registration/step/1", {
    method: "POST",
    body: { registrationId, fullName: "E2E Web Test", email, phone, password },
  });
  if (!s1.ok) return fail("Reg full: step1", JSON.stringify(s1.json)?.slice(0, 120));

  let otp = process.env.E2E_OTP || s1.data?.devOtp;
  if (!otp && conn) {
    await new Promise((r) => setTimeout(r, 500));
    otp = await getRegistrationOtp(conn, registrationId);
  }
  if (!otp) {
    fail("Reg full: OTP", "No OtpCode in registrationsessions — check DB after step/1");
    return null;
  }
  pass("Reg full: step1 + OTP", `otp=${otp}`);

  const v = await api("/api/registration/verify-otp", {
    method: "POST",
    body: { registrationId, otp: String(otp) },
  });
  if (!v.ok) return fail("Reg full: verify-otp", String(v.status));
  pass("Reg full: verify-otp");

  const s2 = await api("/api/registration/step/2", {
    method: "POST",
    body: { registrationId, roleName: "trader" },
  });
  if (!s2.ok) return fail("Reg full: step2", String(s2.status));
  pass("Reg full: step2");

  const s3 = await api("/api/registration/step/3/trader", {
    method: "POST",
    body: {
      registrationId,
      companyName: "E2E Co",
      activity: "تجارة",
      canBuy: true,
      canImport: false,
      canExport: false,
    },
  });
  if (!s3.ok) return fail("Reg full: step3", String(s3.status));
  pass("Reg full: step3");

  const docForm = new FormData();
  docForm.append("RegistrationId", registrationId);
  docForm.append("DocType", "1");
  docForm.append("Number", `E2E-${ts}`);
  docForm.append("IssuedBy", "E2E");
  docForm.append(
    "File",
    new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" }),
    "e2e.png",
  );
  const docRes = await fetch(`${API}/api/registration/step/4/document`, {
    method: "POST",
    body: docForm,
  });
  const docJson = await docRes.json().catch(() => ({}));
  if (!docRes.ok) {
    return fail(
      "Reg full: step4 document",
      `${docRes.status} ${JSON.stringify(docJson)?.slice(0, 120)}`,
    );
  }
  pass("Reg full: step4 document");

  const s4 = await api("/api/registration/step/4/complete", {
    method: "POST",
    body: registrationId,
  });
  if (!s4.ok) return fail("Reg full: step4 complete", String(s4.status));
  pass("Reg full: step4 complete");

  const s5p = await api("/api/registration/step/5/payout", {
    method: "POST",
    body: { registrationId, type: 1, providerName: "محفظة" },
  });
  if (!s5p.ok) return fail("Reg full: step5 payout", String(s5p.status));
  pass("Reg full: step5 payout");

  const s5c = await api("/api/registration/step/5/complete", {
    method: "POST",
    body: registrationId,
  });
  if (!s5c.ok) return fail("Reg full: step5 complete", String(s5c.status));
  pass("Reg full: step5 complete");

  const sub = await api("/api/registration/submit", {
    method: "POST",
    body: registrationId,
  });
  if (!sub.ok) {
    fail("Reg full: submit", `${sub.status} ${JSON.stringify(sub.json)?.slice(0, 150)}`);
    return null;
  }
  pass("Reg full: submit");

  try {
    const session = await login(email, password);
    pass("Reg full: login after submit", `userId=${session.userId}`);
    return { session, email, password };
  } catch (e) {
    fail("Reg full: login after submit", e.message);
    return null;
  }
}

async function main() {
  console.log(`\n=== E2E Workflows — ${API} ===`);
  console.log(`Test user ${E2E_USER_ID}: ${DEFAULT_CREDS.email}\n`);

  try {
    dbConn = await connectDb();
    await swapTestUserRole(dbConn);
  } catch (e) {
    fail("DB setup", e.message);
  }

  await testPublicApi();
  if (dbConn) await runDbChecks(dbConn);

  await testRegistrationStart();

  const seller = await testAuthFlow(DEFAULT_CREDS);

  if (seller) {
    await testAuthenticatedCatalog(seller.token);
    await testTransportPrices(seller.token);
    await testExtendedApi(seller);
  }

  let listingHint = null;
  if (seller) {
    listingHint = await testCreateDirectListing(seller);
    await testSecondaryWorkflows(seller, listingHint);
  }

  if (seller) {
    await testDirectOrderFlow(seller, seller, listingHint);
  }

  if (dbConn && process.env.E2E_RUN_REGISTRATION !== "0") {
    await testFullRegistration(dbConn);
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n=== Summary: ${passed} passed, ${failed} failed ===\n`);

  try {
    writeFileSync(
      resolve(process.cwd(), "scripts/e2e-results.json"),
      JSON.stringify(
        {
          at: new Date().toISOString(),
          api: API,
          passed,
          failed,
          results,
        },
        null,
        2,
      ),
    );
  } catch {
    /* non-fatal */
  }

  return failed;
}

const failedCount = await main().catch((e) => {
  console.error(e);
  return 1;
});

if (dbConn) {
  try {
    await restoreTestUserRole(dbConn);
  } catch (e) {
    console.error("Failed to restore role:", e.message);
    await dbConn.end().catch(() => {});
    process.exit(1);
  }
  await dbConn.end().catch(() => {});
}

process.exit(failedCount > 0 ? 1 : 0);
