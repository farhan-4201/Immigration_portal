/**
 * ============================================================
 *  MongoDB Atlas → MySQL (cPanel VPS) Migration Script
 *  For: Immigration Portal (Westbury Law)
 *  Schema: Prisma (users, companies, cases, client_inquiries,
 *          audit_logs, notifications)
 * ============================================================
 *
 *  BEFORE RUNNING:
 *  1. npm install mongodb mysql2 dotenv
 *  2. Fill in the .env values (see .env.migration.example)
 *  3. node migrate.js
 * ============================================================
 */

require("dotenv").config({ path: ".env.migration" });
const { MongoClient, ObjectId } = require("mongodb");
const mysql = require("mysql2/promise");

// ── helpers ──────────────────────────────────────────────────
const safeJson = (v) => (v ? JSON.stringify(v) : null);
const safeDate = (v) => (v ? new Date(v) : null);
const cuid = () =>
  "c" +
  Math.random().toString(36).slice(2, 11) +
  Date.now().toString(36);

// Map MongoDB _id (ObjectId or string) → stable string id
const idMap = new Map();
const mapId = (mongoId) => {
  const key = mongoId?.toString();
  if (!key) return null;
  if (!idMap.has(key)) idMap.set(key, cuid());
  return idMap.get(key);
};

// ── connect ───────────────────────────────────────────────────
async function connect() {
  console.log("🔌 Connecting to MongoDB Atlas …");
  const mongo = new MongoClient(process.env.MONGO_URI);
  await mongo.connect();
  const mongoDb = mongo.db(process.env.MONGO_DB_NAME);
  console.log("✅ MongoDB connected");

  console.log("🔌 Connecting to MySQL (cPanel VPS) …");
  const sql = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT || "3306"),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    ssl: process.env.MYSQL_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    multipleStatements: true,
  });
  console.log("✅ MySQL connected\n");

  return { mongo, mongoDb, sql };
}

// ── migrate companies ─────────────────────────────────────────
async function migrateCompanies(mongoDb, sql) {
  console.log("📦 Migrating companies …");
  const col = mongoDb.collection("companies");
  const docs = await col.find({}).toArray();

  if (!docs.length) {
    console.log("   ℹ️  No companies found – skipping");
    return;
  }

  let ok = 0, skip = 0;
  for (const doc of docs) {
    const id = mapId(doc._id);
    try {
      await sql.execute(
        `INSERT IGNORE INTO companies
           (id, name, domain, licenseNumber, address, contactEmail,
            contactPerson, contactNumber, website, shift, createdAt, updatedAt)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          id,
          doc.name ?? "Unknown",
          doc.domain ?? null,
          doc.licenseNumber ?? null,
          doc.address ?? null,
          doc.contactEmail ?? null,
          doc.contactPerson ?? null,
          doc.contactNumber ?? null,
          doc.website ?? null,
          doc.shift ?? "Morning",
          safeDate(doc.createdAt) ?? new Date(),
          safeDate(doc.updatedAt) ?? new Date(),
        ]
      );
      ok++;
    } catch (e) {
      console.warn(`   ⚠️  Company ${doc.name}: ${e.message}`);
      skip++;
    }
  }
  console.log(`   ✅ ${ok} inserted, ${skip} skipped\n`);
}

// ── migrate users ─────────────────────────────────────────────
async function migrateUsers(mongoDb, sql) {
  console.log("👤 Migrating users …");
  const col = mongoDb.collection("users");
  const docs = await col.find({}).toArray();

  if (!docs.length) {
    console.log("   ℹ️  No users found – skipping");
    return;
  }

  let ok = 0, skip = 0;
  for (const doc of docs) {
    const id = mapId(doc._id);
    const companyId = doc.companyId ? mapId(doc.companyId) : null;
    try {
      await sql.execute(
        `INSERT IGNORE INTO users
           (id, name, email, password, role, status, lastLogin,
            loginAttempts, lockUntil, companyId, createdAt, updatedAt)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          id,
          doc.name ?? "",
          doc.email ?? "",
          doc.password ?? "",
          doc.role ?? "Case Worker",
          doc.status ?? "Active",
          safeDate(doc.lastLogin),
          doc.loginAttempts ?? 0,
          safeDate(doc.lockUntil),
          companyId,
          safeDate(doc.createdAt) ?? new Date(),
          safeDate(doc.updatedAt) ?? new Date(),
        ]
      );
      ok++;
    } catch (e) {
      console.warn(`   ⚠️  User ${doc.email}: ${e.message}`);
      skip++;
    }
  }
  console.log(`   ✅ ${ok} inserted, ${skip} skipped\n`);
}

// ── migrate client_inquiries ──────────────────────────────────
async function migrateInquiries(mongoDb, sql) {
  console.log("📋 Migrating client inquiries …");
  const col = mongoDb.collection("clientinquiries"); // adjust collection name if different
  const docs = await col.find({}).toArray();

  if (!docs.length) {
    console.log("   ℹ️  No inquiries found – skipping");
    return;
  }

  let ok = 0, skip = 0;
  for (const doc of docs) {
    const id = mapId(doc._id);
    const capturedById = mapId(doc.capturedById ?? doc.capturedBy);
    const assignedToId = doc.assignedToId ? mapId(doc.assignedToId) : null;
    try {
      await sql.execute(
        `INSERT IGNORE INTO client_inquiries
           (id, caseNumber, name, nationality, domain, idDocuments,
            immigrationStatus, immigrationHistory, relationshipStatus,
            residentialAddress, capturedById, staffType, assignedToId,
            email, phoneNumber, dob, deadlines, status, createdAt, updatedAt)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          id,
          doc.caseNumber ?? `INQ-${id.slice(0, 8)}`,
          doc.name ?? "",
          doc.nationality ?? "",
          doc.domain ?? null,
          safeJson(doc.idDocuments ?? doc.documents),
          doc.immigrationStatus ?? "",
          doc.immigrationHistory ?? "",
          doc.relationshipStatus ?? doc.clientRelStatus ?? "",
          doc.residentialAddress ?? doc.clientAddress ?? "",
          capturedById,
          doc.staffType ?? "Admin",
          assignedToId,
          doc.email ?? "",
          doc.phoneNumber ?? doc.clientPhone ?? "",
          safeDate(doc.dob ?? doc.clientDob) ?? new Date("1990-01-01"),
          safeJson(doc.deadlines),
          doc.status ?? "Inquiry",
          safeDate(doc.createdAt) ?? new Date(),
          safeDate(doc.updatedAt) ?? new Date(),
        ]
      );
      ok++;
    } catch (e) {
      console.warn(`   ⚠️  Inquiry ${doc.caseNumber}: ${e.message}`);
      skip++;
    }
  }
  console.log(`   ✅ ${ok} inserted, ${skip} skipped\n`);
}

// ── migrate cases ─────────────────────────────────────────────
async function migrateCases(mongoDb, sql) {
  console.log("📁 Migrating cases (most critical) …");
  const col = mongoDb.collection("cases");
  const docs = await col.find({}).toArray();

  if (!docs.length) {
    console.log("   ℹ️  No cases found – skipping");
    return;
  }

  let ok = 0, skip = 0;
  for (const doc of docs) {
    const id = mapId(doc._id);

    // MongoDB stores assignedTo / createdBy as plain ObjectId strings
    const assignedToId = doc.assignedTo ? mapId(doc.assignedTo) : null;
    const createdById  = mapId(doc.createdBy);
    const inquiryId    = doc.inquiryId ? mapId(doc.inquiryId) : null;

    // ── Nested objects from old schema ───────────────────────
    // client: { name, nationality, relationshipStatus, address, email, phoneNumber, dob }
    const client = doc.client ?? {};
    // immigration: { status, history }
    const imm = doc.immigration ?? {};

    // followups contain nested createdBy ObjectIds — keep as JSON
    // but normalise each item's createdBy to a string so it's readable
    const followups = (doc.followups ?? []).map((f) => ({
      ...f,
      _id:       f._id?.toString(),
      createdBy: f.createdBy?.toString(),
    }));

    try {
      await sql.execute(
        `INSERT IGNORE INTO cases
           (id, caseNumber, clientName, clientNationality, clientRelStatus,
            clientAddress, clientEmail, clientPhone, clientDob, immigStatus,
            immigHistory, documents, deadlines, followups, status,
            caseworkerNote, assignedToId, createdById, adminAdvice,
            adviceUpdatedAt, hasNewAdvice, lastUpdatedByCaseworker,
            inquiryId, createdAt, updatedAt)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          id,
          doc.caseNumber                   ?? `CASE-${id.slice(0, 8)}`,
          client.name                      ?? "",
          client.nationality               ?? "",
          client.relationshipStatus        ?? "",
          client.address                   ?? "",
          client.email                     ?? "",
          client.phoneNumber               ?? "",
          safeDate(client.dob)             ?? new Date("1990-01-01"),
          imm.status                       ?? "",
          imm.history                      ?? "",
          safeJson(doc.documents),
          safeJson(doc.deadlines),
          safeJson(followups),
          doc.status                       ?? "New",
          doc.caseworkerNote               ?? null,
          assignedToId,
          createdById,
          doc.adminAdvice                  ?? null,
          safeDate(doc.adviceUpdatedAt),
          doc.hasNewAdvice                 ? 1 : 0,
          doc.lastUpdatedByCaseworker      ? 1 : 0,
          inquiryId,
          safeDate(doc.createdAt)          ?? new Date(),
          safeDate(doc.updatedAt)          ?? new Date(),
        ]
      );
      ok++;
    } catch (e) {
      console.warn(`   ⚠️  Case ${doc.caseNumber}: ${e.message}`);
      skip++;
    }
  }
  console.log(`   ✅ ${ok} inserted, ${skip} skipped\n`);
}

// ── migrate audit_logs ────────────────────────────────────────
async function migrateAuditLogs(mongoDb, sql) {
  console.log("🔍 Migrating audit logs …");
  const col = mongoDb.collection("auditlogs");
  const docs = await col.find({}).toArray();

  if (!docs.length) {
    console.log("   ℹ️  No audit logs found – skipping");
    return;
  }

  let ok = 0, skip = 0;
  for (const doc of docs) {
    const id = mapId(doc._id);
    try {
      await sql.execute(
        `INSERT IGNORE INTO audit_logs
           (id, eventType, userId, actorId, details, ipAddress, timestamp)
         VALUES (?,?,?,?,?,?,?)`,
        [
          id,
          doc.eventType ?? "UNKNOWN",
          doc.userId ? mapId(doc.userId) : null,
          doc.actorId ? mapId(doc.actorId) : null,
          typeof doc.details === "object"
            ? JSON.stringify(doc.details)
            : doc.details ?? "",
          doc.ipAddress ?? null,
          safeDate(doc.timestamp ?? doc.createdAt) ?? new Date(),
        ]
      );
      ok++;
    } catch (e) {
      console.warn(`   ⚠️  AuditLog ${id}: ${e.message}`);
      skip++;
    }
  }
  console.log(`   ✅ ${ok} inserted, ${skip} skipped\n`);
}

// ── migrate notifications ─────────────────────────────────────
async function migrateNotifications(mongoDb, sql) {
  console.log("🔔 Migrating notifications …");
  const col = mongoDb.collection("notifications");
  const docs = await col.find({}).toArray();

  if (!docs.length) {
    console.log("   ℹ️  No notifications found – skipping");
    return;
  }

  let ok = 0, skip = 0;
  for (const doc of docs) {
    const id = mapId(doc._id);
    try {
      await sql.execute(
        `INSERT IGNORE INTO notifications
           (id, recipient, type, title, message, link, isRead,
            caseId, createdAt, updatedAt)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          id,
          doc.recipient ?? "",
          doc.type ?? "System",
          doc.title ?? "",
          doc.message ?? "",
          doc.link ?? null,
          doc.isRead ? 1 : 0,
          doc.caseId ? mapId(doc.caseId) : null,
          safeDate(doc.createdAt) ?? new Date(),
          safeDate(doc.updatedAt) ?? new Date(),
        ]
      );
      ok++;
    } catch (e) {
      console.warn(`   ⚠️  Notification ${id}: ${e.message}`);
      skip++;
    }
  }
  console.log(`   ✅ ${ok} inserted, ${skip} skipped\n`);
}

// ── verify counts ─────────────────────────────────────────────
async function verifyCounts(mongoDb, sql) {
  console.log("🔎 Verifying row counts …\n");
  const tables = [
    ["companies", "companies"],
    ["users", "users"],
    ["clientinquiries", "client_inquiries"],
    ["cases", "cases"],
    ["auditlogs", "audit_logs"],
    ["notifications", "notifications"],
  ];

  console.log(
    "Collection / Table".padEnd(30) + "MongoDB".padEnd(12) + "MySQL"
  );
  console.log("─".repeat(55));

  for (const [mongoCol, mysqlTable] of tables) {
    const mongoCount = await mongoDb
      .collection(mongoCol)
      .countDocuments();
    const [rows] = await sql.execute(
      `SELECT COUNT(*) as c FROM \`${mysqlTable}\``
    );
    const mysqlCount = rows[0].c;
    const match = mongoCount === mysqlCount ? "✅" : "⚠️ ";
    console.log(
      `${match} ${mongoCol.padEnd(28)} ${String(mongoCount).padEnd(12)} ${mysqlCount}`
    );
  }
  console.log();
}

// ── main ──────────────────────────────────────────────────────
async function main() {
  const { mongo, mongoDb, sql } = await connect();

  try {
    // Order matters — respect FK constraints
    await migrateCompanies(mongoDb, sql);
    await migrateUsers(mongoDb, sql);
    await migrateInquiries(mongoDb, sql);
    await migrateCases(mongoDb, sql);
    await migrateAuditLogs(mongoDb, sql);
    await migrateNotifications(mongoDb, sql);
    await verifyCounts(mongoDb, sql);

    console.log("🎉 Migration complete!");
  } catch (err) {
    console.error("❌ Fatal error:", err);
    process.exit(1);
  } finally {
    await mongo.close();
    await sql.end();
  }
}

main();