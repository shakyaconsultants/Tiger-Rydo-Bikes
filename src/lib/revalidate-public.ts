import { revalidatePath, revalidateTag } from "next/cache";

export const PUBLIC_CONTENT_TAG = "public-content";

export function revalidatePublicContent() {
  revalidateTag(PUBLIC_CONTENT_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/products", "layout");
  revalidatePath("/dealers", "layout");
}
