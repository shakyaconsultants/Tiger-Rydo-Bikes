import { connectDB } from "@/lib/mongodb";
import { Inquiry } from "@/models/Inquiry";
import { NextResponse } from "next/server";
import { Product } from "@/models/Product";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, scooter, scooterName, message, type = "contact" } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    await connectDB();
    const product = await Product.findOne({ slug: scooter });
    const inquiry = await Inquiry.create({
      name,
      email,
      phone,
      scooter,
      scooterName: product?.name || "",
      message,
      type,
    });

    return NextResponse.json(
      { success: true, id: inquiry._id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Inquiry error:", error);
    return NextResponse.json(
      { error: "Failed to submit inquiry. Please try again." },
      { status: 500 }
    );
  }
}
