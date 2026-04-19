/**
 * Storage abstraction layer — supports Backblaze B2 (S3-compatible), Cloudflare R2, or Supabase.
 * Provider is controlled by STORAGE_PROVIDER env variable.
 * All providers expose the same uploadToStorage() function.
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import env from '../config/env.js';

let s3Client = null;

function getS3Client() {
  if (s3Client) return s3Client;

  const { endpoint, keyId, appKey, provider } = env.storage;

  if (!keyId || !appKey || !endpoint) {
    throw new Error(
      'Storage not configured. Set STORAGE_KEY_ID, STORAGE_APP_KEY, STORAGE_ENDPOINT in .env'
    );
  }

  s3Client = new S3Client({
    endpoint: endpoint.startsWith('http') ? endpoint : `https://${endpoint}`,
    region: 'auto',
    credentials: { accessKeyId: keyId, secretAccessKey: appKey },
    forcePathStyle: provider === 'backblaze',
  });

  return s3Client;
}

/**
 * Upload a buffer to storage and return the public URL.
 * @param {{ buffer: Buffer, key: string, contentType: string }} options
 * @returns {Promise<string>} public URL
 */
export async function uploadToStorage({ buffer, key, contentType }) {
  const client = getS3Client();
  const bucket = env.storage.bucketName;

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  }));

  const baseUrl = env.storage.baseUrl.replace(/\/$/, '');
  return `${baseUrl}/${key}`;
}

/**
 * Check if storage is configured (non-throwing).
 */
export function isStorageConfigured() {
  const { keyId, appKey, endpoint } = env.storage;
  return Boolean(keyId && appKey && endpoint);
}
