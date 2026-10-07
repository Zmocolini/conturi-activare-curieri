import { NextResponse } from "next/server";
import { getApplications, saveApplication, saveBase64Image } from "@/lib/storage";
import { Application, ApplicationSubmission, TicketType } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Neautorizat. Te rugăm să te autentifici." },
        { status: 401 }
      );
    }

    // If admin, return ALL applications. If recruiter, return only their own.
    const recruiterFilter = user.role === "admin" ? undefined : user.username;
    const list = await getApplications(recruiterFilter);
    return NextResponse.json({
      success: true,
      recruiter: user.username,
      displayName: user.displayName,
      role: user.role,
      count: list.length,
      applications: list,
    });
  } catch (error) {
    console.error("GET /api/applications error:", error);
    return NextResponse.json(
      { success: false, message: "Eroare la preluarea cererilor." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Trebuie să fii autentificat pentru a adăuga date." },
        { status: 401 }
      );
    }

    const body: ApplicationSubmission = await req.json();
    const ticketType: TicketType = body.ticketType || "activare_cont";

    if (!body.fullName || !body.fullName.trim()) {
      return NextResponse.json(
        { success: false, message: "Numele și prenumele sunt obligatorii." },
        { status: 400 }
      );
    }

    if (!body.platforms || body.platforms.length === 0) {
      return NextResponse.json(
        { success: false, message: "Alege cel puțin o platformă (Glovo sau Wolt)." },
        { status: 400 }
      );
    }

    // Specific validation per ticket type
    if (ticketType === "activare_cont") {
      if (!body.phone || !body.email || !body.vehicleType) {
        return NextResponse.json(
          { success: false, message: "Te rugăm să completezi telefonul, emailul și tipul de vehicul." },
          { status: 400 }
        );
      }
      if (!body.idCardPhoto) {
        return NextResponse.json(
          { success: false, message: "Poza sau fișierul PDF de buletin este obligatoriu." },
          { status: 400 }
        );
      }
      if (!body.selfiePhoto) {
        return NextResponse.json(
          { success: false, message: "Selfie-ul cu buletinul în mână este obligatoriu." },
          { status: 400 }
        );
      }
    } else if (ticketType === "schimbare_vehicul") {
      if (!body.phone || !body.oldVehicleType || !body.vehicleType) {
        return NextResponse.json(
          { success: false, message: "Completează numărul de telefon, vehiculul actual și vehiculul nou." },
          { status: 400 }
        );
      }
    } else if (ticketType === "schimbare_telefon") {
      if (!body.phone || !body.newPhone || !body.newPhone.trim()) {
        return NextResponse.json(
          { success: false, message: "Completează numărul vechi de telefon și noul număr de telefon." },
          { status: 400 }
        );
      }
    }

    // Assigned strictly to the recruiter, or chosen recruiter if admin
    const assignedRecruiter = user.role === "admin" ? (body.recruiter || "glovowolt") : user.username;

    // Save images if present
    const idCardPhotoUrl = body.idCardPhoto ? await saveBase64Image(body.idCardPhoto, "buletin") : "";
    const selfiePhotoUrl = body.selfiePhoto ? await saveBase64Image(body.selfiePhoto, "selfie") : "";

    const newApp: Application = {
      id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      recruiter: assignedRecruiter,
      ticketType,
      fullName: body.fullName.trim(),
      phone: body.phone.trim(),
      newPhone: body.newPhone?.trim(),
      email: body.email?.trim() || "",
      city: body.city?.trim() || "",
      platforms: body.platforms,
      vehicleType: body.vehicleType || "masina",
      oldVehicleType: body.oldVehicleType,
      idCardPhotoUrl,
      selfiePhotoUrl,
      status: "nou",
      notes: body.notes?.trim() || "",
      createdAt: new Date().toISOString(),
    };

    await saveApplication(newApp);

    return NextResponse.json({
      success: true,
      message: "Tichetul a fost creat cu succes!",
      application: newApp,
    });
  } catch (error) {
    console.error("POST /api/applications error:", error);
    return NextResponse.json(
      { success: false, message: "A apărut o eroare la salvarea tichetului." },
      { status: 500 }
    );
  }
}
