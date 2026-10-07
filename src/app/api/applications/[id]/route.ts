import { NextResponse } from "next/server";
import { updateApplication, deleteApplication, saveBase64Image } from "@/lib/storage";
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
    const { status, notes, rejectionReason, phone, vehicleType, idCardPhoto, selfiePhoto } = body;

    const validStatuses: ApplicationStatus[] = ["nou", "in_lucru", "activat", "respins"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ success: false, message: "Status invalid" }, { status: 400 });
    }

    const validVehicles: VehicleType[] = ["masina", "scuter", "bicicleta"];
    if (vehicleType && !validVehicles.includes(vehicleType)) {
      return NextResponse.json({ success: false, message: "Vehicul invalid" }, { status: 400 });
    }

    let idCardPhotoUrl: string | undefined = undefined;
    if (idCardPhoto) {
      idCardPhotoUrl = await saveBase64Image(idCardPhoto, "buletin_sau_talon");
    }

    let selfiePhotoUrl: string | undefined = undefined;
    if (selfiePhoto) {
      selfiePhotoUrl = await saveBase64Image(selfiePhoto, "selfie_sau_vehicul");
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
        ...(idCardPhotoUrl !== undefined ? { idCardPhotoUrl } : {}),
        ...(selfiePhotoUrl !== undefined ? { selfiePhotoUrl } : {}),
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
