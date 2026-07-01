import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Inquiry } from "@/models/Inquiry";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    await Inquiry.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Inquiry deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to delete inquiry" },
      { status: 500 }
    );
  }
}