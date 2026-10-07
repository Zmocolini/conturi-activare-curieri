import fs from "fs";
import path from "path";
import { createClient, Client } from "@libsql/client";
import { Application, ApplicationStatus, PlatformType, TicketType, VehicleType } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const APPLICATIONS_FILE = path.join(DATA_DIR, "applications.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// Memory store fallback
let memoryStore: Application[] = [];

// Turso client instance
let dbClient: Client | null = null;
let dbInitialized = false;

function getClient(): Client | null {
  if (dbClient) return dbClient;
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url) {
    try {
      dbClient = createClient({
        url,
        ...(authToken ? { authToken } : {}),
      });
      return dbClient;
    } catch (err) {
      console.warn("Failed to create Turso client:", err);
      return null;
    }
  }
  return null;
}

async function ensureDbTable(client: Client): Promise<void> {
  if (dbInitialized) return;
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        recruiter TEXT NOT NULL,
        ticket_type TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        new_phone TEXT,
        email TEXT,
        city TEXT,
        platforms TEXT NOT NULL,
        vehicle_type TEXT,
        old_vehicle_type TEXT,
        id_card_photo_url TEXT,
        selfie_photo_url TEXT,
        status TEXT NOT NULL,
        rejection_reason TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT
      )
    `);
    dbInitialized = true;
  } catch (err) {
    console.error("Failed to ensure applications table in Turso:", err);
  }
}

function rowToApplication(row: any): Application {
  let platforms: PlatformType[] = [];
  try {
    platforms = typeof row.platforms === "string" ? JSON.parse(row.platforms) : row.platforms || [];
  } catch {
    platforms = [];
  }
  return {
    id: String(row.id),
    recruiter: String(row.recruiter || "glovowolt"),
    ticketType: (row.ticket_type || "activare_cont") as TicketType,
    fullName: String(row.full_name || ""),
    phone: String(row.phone || ""),
    newPhone: row.new_phone ? String(row.new_phone) : undefined,
    email: row.email ? String(row.email) : undefined,
    city: row.city ? String(row.city) : undefined,
    platforms,
    vehicleType: row.vehicle_type ? (row.vehicle_type as VehicleType) : undefined,
    oldVehicleType: row.old_vehicle_type ? (row.old_vehicle_type as VehicleType) : undefined,
    idCardPhotoUrl: row.id_card_photo_url ? String(row.id_card_photo_url) : undefined,
    selfiePhotoUrl: row.selfie_photo_url ? String(row.selfie_photo_url) : undefined,
    status: (row.status || "nou") as ApplicationStatus,
    rejectionReason: row.rejection_reason ? String(row.rejection_reason) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function ensureDirectories() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn("Could not create local directories (expected on serverless):", err);
  }
}

export async function getApplications(recruiter?: string): Promise<Application[]> {
  const client = getClient();
  if (client) {
    try {
      await ensureDbTable(client);
      let rs;
      if (recruiter) {
        rs = await client.execute({
          sql: "SELECT * FROM applications WHERE recruiter = ? ORDER BY created_at DESC",
          args: [recruiter],
        });
      } else {
        rs = await client.execute("SELECT * FROM applications ORDER BY created_at DESC");
      }
      return rs.rows.map(rowToApplication);
    } catch (err) {
      console.error("Turso getApplications error, falling back to local storage:", err);
    }
  }

  // Fallback to local file / memory
  let all: Application[] = [];
  try {
    ensureDirectories();
    if (fs.existsSync(APPLICATIONS_FILE)) {
      const data = fs.readFileSync(APPLICATIONS_FILE, "utf-8");
      all = JSON.parse(data) as Application[];
    } else {
      all = [...memoryStore];
    }
  } catch {
    all = [...memoryStore];
  }

  all = all.map((app) => ({
    ...app,
    recruiter: app.recruiter || "glovowolt",
  }));

  if (recruiter) {
    all = all.filter((app) => app.recruiter === recruiter);
  }

  return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function saveApplication(app: Application): Promise<void> {
  const normalizedApp = {
    ...app,
    recruiter: app.recruiter || "glovowolt",
  };

  const client = getClient();
  if (client) {
    try {
      await ensureDbTable(client);
      await client.execute({
        sql: `
          INSERT INTO applications (
            id, recruiter, ticket_type, full_name, phone, new_phone, email, city,
            platforms, vehicle_type, old_vehicle_type, id_card_photo_url, selfie_photo_url,
            status, rejection_reason, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          normalizedApp.id,
          normalizedApp.recruiter,
          normalizedApp.ticketType,
          normalizedApp.fullName,
          normalizedApp.phone,
          normalizedApp.newPhone || null,
          normalizedApp.email || null,
          normalizedApp.city || null,
          JSON.stringify(normalizedApp.platforms),
          normalizedApp.vehicleType || null,
          normalizedApp.oldVehicleType || null,
          normalizedApp.idCardPhotoUrl || null,
          normalizedApp.selfiePhotoUrl || null,
          normalizedApp.status,
          normalizedApp.rejectionReason || null,
          normalizedApp.notes || null,
          normalizedApp.createdAt,
          normalizedApp.updatedAt || null,
        ],
      });
      return;
    } catch (err) {
      console.error("Turso saveApplication error, falling back to local storage:", err);
    }
  }

  // Local storage fallback
  memoryStore.unshift(normalizedApp);
  try {
    ensureDirectories();
    let currentList: Application[] = [];
    if (fs.existsSync(APPLICATIONS_FILE)) {
      const data = fs.readFileSync(APPLICATIONS_FILE, "utf-8");
      try {
        currentList = JSON.parse(data);
      } catch {
        currentList = [];
      }
    }
    currentList.unshift(normalizedApp);
    fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify(currentList, null, 2), "utf-8");
  } catch (err) {
    console.warn("Saving to file system failed:", err);
  }
}

export async function updateApplication(
  id: string,
  updates: {
    status?: ApplicationStatus;
    rejectionReason?: string;
    phone?: string;
    vehicleType?: VehicleType;
    notes?: string;
    idCardPhotoUrl?: string;
    selfiePhotoUrl?: string;
  },
  recruiter?: string
): Promise<Application | null> {
  const client = getClient();
  if (client) {
    try {
      await ensureDbTable(client);
      const existingRes = await client.execute({
        sql: "SELECT * FROM applications WHERE id = ?",
        args: [id],
      });
      if (existingRes.rows.length === 0) return null;
      const current = rowToApplication(existingRes.rows[0]);

      if (recruiter && current.recruiter !== recruiter) {
        return null;
      }

      const newStatus = updates.status !== undefined ? updates.status : current.status;
      const newRejection = updates.rejectionReason !== undefined ? updates.rejectionReason : current.rejectionReason;
      const newPhone = updates.phone !== undefined && updates.phone.trim() ? updates.phone.trim() : current.phone;
      const newVehicle = updates.vehicleType !== undefined ? updates.vehicleType : current.vehicleType;
      const newNotes = updates.notes !== undefined ? updates.notes : current.notes;
      const newIdPhoto = updates.idCardPhotoUrl !== undefined ? updates.idCardPhotoUrl : current.idCardPhotoUrl;
      const newSelfie = updates.selfiePhotoUrl !== undefined ? updates.selfiePhotoUrl : current.selfiePhotoUrl;
      const newUpdatedAt = new Date().toISOString();

      await client.execute({
        sql: `
          UPDATE applications SET
            status = ?,
            rejection_reason = ?,
            phone = ?,
            vehicle_type = ?,
            notes = ?,
            id_card_photo_url = ?,
            selfie_photo_url = ?,
            updated_at = ?
          WHERE id = ?
        `,
        args: [
          newStatus,
          newRejection || null,
          newPhone,
          newVehicle || null,
          newNotes || null,
          newIdPhoto || null,
          newSelfie || null,
          newUpdatedAt,
          id,
        ],
      });

      return {
        ...current,
        status: newStatus,
        rejectionReason: newRejection,
        phone: newPhone,
        vehicleType: newVehicle,
        notes: newNotes,
        idCardPhotoUrl: newIdPhoto,
        selfiePhotoUrl: newSelfie,
        updatedAt: newUpdatedAt,
      };
    } catch (err) {
      console.error("Turso updateApplication error, falling back to local storage:", err);
    }
  }

  // Local fallback
  let all: Application[] = [];
  try {
    ensureDirectories();
    if (fs.existsSync(APPLICATIONS_FILE)) {
      const data = fs.readFileSync(APPLICATIONS_FILE, "utf-8");
      all = JSON.parse(data);
    } else {
      all = [...memoryStore];
    }
  } catch {
    all = [...memoryStore];
  }

  const target = all.find((item) => item.id === id);
  if (!target) return null;

  if (recruiter && (target.recruiter || "glovowolt") !== recruiter) {
    return null;
  }

  if (updates.status !== undefined) target.status = updates.status;
  if (updates.rejectionReason !== undefined) target.rejectionReason = updates.rejectionReason;
  if (updates.phone !== undefined && updates.phone.trim()) target.phone = updates.phone.trim();
  if (updates.vehicleType !== undefined) target.vehicleType = updates.vehicleType;
  if (updates.notes !== undefined) target.notes = updates.notes;
  if (updates.idCardPhotoUrl !== undefined) target.idCardPhotoUrl = updates.idCardPhotoUrl;
  if (updates.selfiePhotoUrl !== undefined) target.selfiePhotoUrl = updates.selfiePhotoUrl;
  target.updatedAt = new Date().toISOString();

  try {
    ensureDirectories();
    fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify(all, null, 2), "utf-8");
  } catch {}

  memoryStore = all;
  return target;
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  recruiter?: string,
  notes?: string,
  rejectionReason?: string
): Promise<Application | null> {
  return updateApplication(id, { status, notes, rejectionReason }, recruiter);
}

export async function deleteApplication(id: string, recruiter?: string): Promise<boolean> {
  const client = getClient();
  if (client) {
    try {
      await ensureDbTable(client);
      if (recruiter) {
        const checkRes = await client.execute({
          sql: "SELECT recruiter FROM applications WHERE id = ?",
          args: [id],
        });
        if (checkRes.rows.length === 0) return false;
        if (String(checkRes.rows[0].recruiter || "glovowolt") !== recruiter) return false;
      }
      const res = await client.execute({
        sql: "DELETE FROM applications WHERE id = ?",
        args: [id],
      });
      return (res.rowsAffected ?? 1) > 0;
    } catch (err) {
      console.error("Turso deleteApplication error:", err);
    }
  }

  // Local fallback
  let all: Application[] = [];
  try {
    ensureDirectories();
    if (fs.existsSync(APPLICATIONS_FILE)) {
      const data = fs.readFileSync(APPLICATIONS_FILE, "utf-8");
      all = JSON.parse(data);
    } else {
      all = [...memoryStore];
    }
  } catch {
    all = [...memoryStore];
  }

  const target = all.find((item) => item.id === id);
  if (!target) return false;

  if (recruiter && (target.recruiter || "glovowolt") !== recruiter) {
    return false;
  }

  const filtered = all.filter((item) => item.id !== id);
  try {
    ensureDirectories();
    fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  } catch {}

  memoryStore = filtered;
  return true;
}

export async function saveBase64Image(dataUrlOrBase64: string, prefix: string): Promise<string> {
  if (!dataUrlOrBase64) return "";

  if (dataUrlOrBase64.startsWith("http://") || dataUrlOrBase64.startsWith("https://") || dataUrlOrBase64.startsWith("/uploads/")) {
    return dataUrlOrBase64;
  }

  // If running in cloud / Vercel or with Turso DB, store base64 / dataUrl directly in DB column so it's 100% durable!
  if (process.env.TURSO_DATABASE_URL || process.env.VERCEL) {
    if (dataUrlOrBase64.startsWith("data:")) {
      return dataUrlOrBase64;
    }
    return `data:image/jpeg;base64,${dataUrlOrBase64}`;
  }

  // Local development file fallback
  try {
    ensureDirectories();
    const matches = dataUrlOrBase64.match(/^data:([^;]+);base64,(.+)$/);
    let extension = "jpg";
    let buffer: Buffer;

    if (matches && matches.length === 3) {
      const mime = matches[1].toLowerCase();
      if (mime.includes("pdf")) extension = "pdf";
      else if (mime.includes("png")) extension = "png";
      else if (mime.includes("webp")) extension = "webp";
      else if (mime.includes("gif")) extension = "gif";
      else extension = "jpg";
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(dataUrlOrBase64, "base64");
    }

    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(filePath, buffer);
    return `/uploads/${filename}`;
  } catch (err) {
    console.warn("Saving image to disk failed, falling back to data URL directly:", err);
    return dataUrlOrBase64;
  }
}
