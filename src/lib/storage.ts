import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const endpoint = process.env.STORAGE_ENDPOINT || "http://127.0.0.1:54321/storage/v1/s3";
const region = process.env.STORAGE_REGION || "local";
const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID || "625729a08b95bf1b7ff351a663f3a23c";
const secretAccessKey =
  process.env.STORAGE_SECRET_ACCESS_KEY ||
  "850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907";
const bucket = process.env.STORAGE_BUCKET || "product-images";
const publicBaseUrl =
  process.env.STORAGE_PUBLIC_BASE_URL ||
  "http://127.0.0.1:54321/storage/v1/object/public/product-images/";

const s3Client = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
});

/**
 * Returns public URL for a storage key or existing full URL.
 */
export function publicUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.startsWith("http://") || key.startsWith("https://")) {
    return key;
  }
  const cleanBase = publicBaseUrl.endsWith("/") ? publicBaseUrl : `${publicBaseUrl}/`;
  const cleanKey = key.startsWith("/") ? key.slice(1) : key;
  return `${cleanBase}${cleanKey}`;
}

/**
 * Uploads an image object to S3 storage bucket.
 * Returns the stored object key.
 */
export async function uploadImage(
  key: string,
  buffer: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return key;
}

/**
 * Deletes an image object from S3 storage bucket.
 */
export async function deleteImage(key: string): Promise<void> {
  if (!key) return;
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await s3Client.send(command);
}
