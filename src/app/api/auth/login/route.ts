import { NextResponse } from "next/server";
import { RECRUITERS, createToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Te rugăm să introduci utilizatorul și parola." },
        { status: 400 }
      );
    }

    const trimmedUser = username.trim().toLowerCase();
    const targetUser = RECRUITERS.find(
      (u) => u.username.toLowerCase() === trimmedUser && u.password === password
    );

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "Utilizator sau parolă incorectă." },
        { status: 401 }
      );
    }

    const token = createToken(targetUser.username);
    const response = NextResponse.json({
      success: true,
      user: {
        username: targetUser.username,
        displayName: targetUser.displayName,
        role: targetUser.role,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: req.url.startsWith("https://"),
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "A apărut o eroare la autentificare." },
      { status: 500 }
    );
  }
}
