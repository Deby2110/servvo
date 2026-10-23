import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { ApiError } from './errors.js';

const bucket = 'uploads';
let client;

function getClient() {
  if (client) return client;

  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ENDPOINT_URL_S3, AWS_REGION } = process.env;
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_ENDPOINT_URL_S3 || !AWS_REGION) {
    throw new Error('Konfigurasi Neon Object Storage belum lengkap (AWS_* environment variables).');
  }

  client = new S3Client({
    region: AWS_REGION,
    endpoint: AWS_ENDPOINT_URL_S3,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });
  return client;
}

function validateKey(key) {
  const value = String(key || '');
  if (
    !value ||
    value.includes('\\') ||
    value.split('/').some((segment) => segment === '.' || segment === '..')
  ) {
    throw new ApiError(400, 'Path file tidak valid.');
  }
  return value;
}

export function getUploadKey(url) {
  if (typeof url !== 'string' || !url.startsWith('/uploads/')) {
    throw new ApiError(400, 'URL file tidak valid.');
  }
  return validateKey(url.slice('/uploads/'.length));
}

export async function storeUpload(file, prefix = '') {
  if (!file?.buffer) throw new ApiError(400, 'Tidak ada file yang diunggah.');
  const extension = path.extname(file.originalname).toLowerCase();
  const key = validateKey(`${prefix}${Date.now()}-${randomUUID()}${extension}`);
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype || 'application/octet-stream',
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
  return `/uploads/${key}`;
}

export async function getUpload(key) {
  const safeKey = validateKey(key);
  try {
    return await getClient().send(new GetObjectCommand({ Bucket: bucket, Key: safeKey }));
  } catch (error) {
    if (error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404) return null;
    throw error;
  }
}

export async function deleteUpload(url) {
  if (!url || !url.startsWith('/uploads/')) return;
  const key = getUploadKey(url);
  await getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function listUploads() {
  const files = [];
  let continuationToken;
  do {
    const response = await getClient().send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
      })
    );
    for (const object of response.Contents || []) {
      if (!object.Key) continue;
      files.push({
        name: path.posix.basename(object.Key),
        url: `/uploads/${object.Key}`,
        size: object.Size || 0,
        modifiedAt: object.LastModified || new Date(0),
      });
    }
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);
  return files.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
}
