import fs from "fs";
import path from "path";
import { Application, ApplicationStatus, VehicleType } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const APPLICATIONS_FILE = path.join(DATA_DIR, "applications.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// In-memory fallback if file system is read-only (e.g. serverless on Vercel without persistent disk)
let memoryStore: Application[] = [];

function ensureDirectories() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn("Could not create local directories (expected on serverless environments):", err);
  }
}

export async function getApplications(recruiter?: string): Promise<Application[]> {
  let all: Application[] = [];
  try {
    ensureDirectories();
    if (fs.existsSync(APPLICATIONS_FILE)) {
      const data = fs.readFileSync(APPLICATIONS_FILE, "utf-8");
      all = JSON.parse(data) as Application[];
    } else {
      all = [...memoryStore];
    }
  } catch (err) {
    console.warn("Reading from file failed, returning memory store:", err);
    all = [...memoryStore];
  }

  // Normalize older entries that might lack recruiter
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
    console.warn("Saving to file system failed (serverless fallback active):", err);
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

  // Recruiter isolation check
  if (recruiter && (target.recruiter || "glovowolt") !== recruiter) {
    return null;
  }

  if (updates.status !== undefined) {
    target.status = updates.status;
  }
  if (updates.rejectionReason !== undefined) {
    target.rejectionReason = updates.rejectionReason;
  }
  if (updates.phone !== undefined && updates.phone.trim()) {
    target.phone = updates.phone.trim();
  }
  if (updates.vehicleType !== undefined) {
    target.vehicleType = updates.vehicleType;
  }
  if (updates.notes !== undefined) {
    target.notes = updates.notes;
  }
  if (updates.idCardPhotoUrl !== undefined) {
    target.idCardPhotoUrl = updates.idCardPhotoUrl;
  }
  if (updates.selfiePhotoUrl !== undefined) {
    target.selfiePhotoUrl = updates.selfiePhotoUrl;
  }
  target.updatedAt = new Date().toISOString();

  try {
    ensureDirectories();
    fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify(all, null, 2), "utf-8");
  } catch (err) {
    console.warn("Updating file failed, updated memory store only:", err);
  }

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

  // Recruiter isolation check
  if (recruiter && (target.recruiter || "glovowolt") !== recruiter) {
    return false;
  }

  const filtered = all.filter((item) => item.id !== id);

  try {
    ensureDirectories();
    fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  } catch (err) {
    console.warn("Deleting from file failed:", err);
  }

  memoryStore = filtered;
  return true;
}

/**
 * Saves a base64 encoded image or file data URL to local disk in /public/uploads/
 * Returns public URL (e.g. /uploads/...) or returns the base64 string directly if filesystem isn't writable.
 */
export async function saveBase64Image(dataUrlOrBase64: string, prefix: string): Promise<string> {
  if (!dataUrlOrBase64) return "";

  // If already a URL, return as is
  if (dataUrlOrBase64.startsWith("http://") || dataUrlOrBase64.startsWith("https://") || dataUrlOrBase64.startsWith("/uploads/")) {
    return dataUrlOrBase64;
  }

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
