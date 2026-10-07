export type VehicleType = "masina" | "scuter" | "bicicleta";

export type PlatformType = "glovo" | "wolt";

export type ApplicationStatus = "nou" | "in_lucru" | "activat" | "respins";

export type TicketType = "activare_cont" | "schimbare_vehicul" | "schimbare_telefon";

export interface Application {
  id: string;
  recruiter: string; // "glovowolt" (Husein) or "ionutvarga" (Ionut Varga)
  ticketType: TicketType; // "activare_cont" | "schimbare_vehicul" | "schimbare_telefon"
  fullName: string;
  phone: string;
  newPhone?: string; // used when ticketType === "schimbare_telefon"
  email?: string;
  city?: string;
  platforms: PlatformType[];
  vehicleType?: VehicleType;
  oldVehicleType?: VehicleType; // used when ticketType === "schimbare_vehicul"
  idCardPhotoUrl?: string;
  selfiePhotoUrl?: string;
  status: ApplicationStatus;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ApplicationSubmission {
  recruiter?: string;
  ticketType?: TicketType;
  fullName: string;
  phone: string;
  newPhone?: string;
  email?: string;
  city?: string;
  platforms: PlatformType[];
  vehicleType?: VehicleType;
  oldVehicleType?: VehicleType;
  idCardPhoto?: string;
  selfiePhoto?: string;
  notes?: string;
}

export interface UserAccount {
  username: string;
  password: string;
  displayName: string;
  role: "admin" | "recruiter";
}
