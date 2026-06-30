import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Dealer } from "@/models/Dealer";
import { createDealerToken, COOKIE_NAME } from "@/lib/auth";
import { DEMO_ADMIN, PORTAL_CREDENTIALS } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const { email: emailRaw, password: passwordRaw } = await request.json();

    const email = String(emailRaw ?? "").trim().toLowerCase();
    const password = String(passwordRaw ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    let session = null;

    if (email === PORTAL_CREDENTIALS.email) {
      const valid = await bcrypt.compare(password, PORTAL_CREDENTIALS.passwordHash);
      if (valid) session = DEMO_ADMIN.session;
    }

    if (!session) {
      try {
        await connectDB();
        const dealer = await Dealer.findOne({ email, isActive: true });
        if (dealer) {
          const valid = await bcrypt.compare(password, dealer.password);
          if (valid) {
            session = {
              id: String(dealer._id),
              name: dealer.name,
              email: dealer.email,
              city: dealer.city,
              role: "dealer" as const,
            };
          }
        }
      } catch {
        // MongoDB unavailable
      }
    }

    if (!session) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = await createDealerToken(session);
    const response = NextResponse.json({ success: true, dealer: session });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
