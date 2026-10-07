import { NextResponse } from "next/server";
import { updateApplication, deleteApplication } from "@/lib/storage";
import { ApplicationStatus, VehicleType } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Neautorizat" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, notes, rejectionReason, phone, vehicleType } = body;

    const validStatuses: ApplicationStatus[] = ["nou", "in_lucru", "activat", "respins"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ success: false, message: "Status invalid" }, { status: 400 });
    }

    const validVehicles: VehicleType[] = ["masina", "scuter", "bicicleta"];
    if (vehicleType && !validVehicles.includes(vehicleType)) {
      return NextResponse.json({ success: false, message: "Vehicul invalid" }, { status: 400 });
    }

    // If admin, can update any; if recruiter, only their own
    const recruiterCheck = user.role === "admin" ? undefined : user.username;
    const updated = await updateApplication(
      id,
      {
        status,
        notes,
        rejectionReason,
        phone,
        vehicleType,
      },
      recruiterCheck
    );
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Cererea nu a fost găsită sau nu ai permisiunea necesară." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, application: updated });
  } catch (error) {
    console.error("PATCH /api/applications/[id] error:", error);
    return NextResponse.json({ success: false, message: "Eroare la actualizarea cererii" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Neautorizat" }, { status: 401 });
    }

    const { id } = await params;
    // If admin, can delete any; if recruiter, only their own
    const recruiterCheck = user.role === "admin" ? undefined : user.username;
    const ok = await deleteApplication(id, recruiterCheck);
    if (!ok) {
      return NextResponse.json(
        { success: false, message: "Cererea nu a fost găsită sau nu ai permisiunea necesară." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "Cererea a fost ștearsă" });
  } catch (error) {
    console.error("DELETE /api/applications/[id] error:", error);
    return NextResponse.json({ success: false, message: "Eroare la ștergerea cererii" }, { status: 500 });
  }
}
