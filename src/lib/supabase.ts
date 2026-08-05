import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const BUCKET_CONVENTIONS = {
  PRODUCTS: "products", // products/{productId}/{filename}
  PROOFS: "payment-proofs", // proofs/{orderId}/{filename}
};

export async function uploadFileToSupabase(
  bucket: string,
  path: string,
  file: File | Blob
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
    });

    if (error) {
      return { url: null, error };
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return { url: publicUrlData.publicUrl, error: null };
  } catch (err) {
    return { url: null, error: err as Error };
  }
}
