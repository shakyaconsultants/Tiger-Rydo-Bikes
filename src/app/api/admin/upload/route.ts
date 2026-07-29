import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { isCloudinaryConfigured, uploadImage } from "@/lib/cloudinary";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(request: Request) {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Image upload is not configured on the server" },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const filesField = formData.getAll("files");
    const file = formData.get("file");
    const folder = formData.get("folder");
    const files = filesField.filter((item): item is File => item instanceof File);

    if (files.length === 0 && file instanceof File) {
      files.push(file);
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No image files provided" }, { status: 400 });
    }

    for (const item of files) {
      if (!ALLOWED_TYPES.has(item.type)) {
        return NextResponse.json(
          { error: `Unsupported format for "${item.name}". Only JPEG, PNG, WebP, and GIF are allowed` },
          { status: 400 }
        );
      }

      if (item.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Image "${item.name}" must be 5 MB or smaller` },
          { status: 400 }
        );
      }
    }

    const targetFolder = typeof folder === "string" && folder.trim() ? folder.trim() : "tiger-rydo";
    const urls = await Promise.all(
      files.map(async (item) => {
        const buffer = Buffer.from(await item.arrayBuffer());
        return uploadImage(buffer, { folder: targetFolder });
      })
    );

    return NextResponse.json({ success: true, url: urls[0], urls });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
