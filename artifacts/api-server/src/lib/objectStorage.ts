import { randomUUID } from "node:crypto";
import { File, Storage } from "@google-cloud/storage";

const SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
  }
}

function splitBucketPath(path: string): { bucketName: string; objectName: string } {
  const [bucketName, ...objectSegments] = path.split("/").filter(Boolean);
  if (!bucketName || objectSegments.length === 0) {
    throw new Error("Invalid object storage path");
  }
  return { bucketName, objectName: objectSegments.join("/") };
}

function privateObjectDirectory(): string {
  const directory = process.env.PRIVATE_OBJECT_DIR?.trim();
  if (!directory) throw new Error("PRIVATE_OBJECT_DIR is not configured");
  return directory.replace(/\/+$/, "");
}

export async function createMemberImageUpload(): Promise<{
  uploadURL: string;
  objectPath: string;
}> {
  const objectId = randomUUID();
  const objectName = `uploads/${objectId}`;
  const { bucketName, objectName: storageName } = splitBucketPath(
    `${privateObjectDirectory()}/${objectName}`,
  );
  const response = await fetch(`${SIDECAR_ENDPOINT}/object-storage/signed-object-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket_name: bucketName,
      object_name: storageName,
      method: "PUT",
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`Could not create signed upload URL (${response.status})`);
  }
  const result: unknown = await response.json();
  if (
    typeof result !== "object" ||
    result === null ||
    !("signed_url" in result) ||
    typeof result.signed_url !== "string"
  ) {
    throw new Error("Storage service returned an invalid signed URL");
  }
  return {
    uploadURL: result.signed_url,
    objectPath: `/objects/${objectName}`,
  };
}

export async function getUploadedMemberImage(path: string): Promise<File> {
  const match = /^\/objects\/uploads\/([a-f0-9-]{36})$/i.exec(path);
  if (!match) throw new ObjectNotFoundError();
  const { bucketName, objectName } = splitBucketPath(
    `${privateObjectDirectory()}/${path.slice("/objects/".length)}`,
  );
  const file = objectStorageClient.bucket(bucketName).file(objectName);
  const [exists] = await file.exists();
  if (!exists) throw new ObjectNotFoundError();
  return file;
}

export async function getPublicAsset(path: string): Promise<File | null> {
  if (!path || path.split("/").some((segment) => segment === "." || segment === "..")) {
    return null;
  }
  const roots = (process.env.PUBLIC_OBJECT_SEARCH_PATHS ?? "")
    .split(",")
    .map((root) => root.trim())
    .filter(Boolean);
  for (const root of roots) {
    const { bucketName, objectName } = splitBucketPath(`${root.replace(/\/+$/, "")}/${path}`);
    const file = objectStorageClient.bucket(bucketName).file(objectName);
    const [exists] = await file.exists();
    if (exists) return file;
  }
  return null;
}

export async function streamStoredFile(
  file: File,
  res: import("express").Response,
  options: { publicCache: boolean; imageOnly?: boolean },
  onStreamError: (error: Error) => void,
): Promise<boolean> {
  const [metadata] = await file.getMetadata();
  const contentType = metadata.contentType ?? "application/octet-stream";
  if (options.imageOnly && !ALLOWED_IMAGE_TYPES.has(contentType)) return false;
  if (
    options.imageOnly &&
    metadata.size !== undefined &&
    Number(metadata.size) > MAX_IMAGE_BYTES
  ) {
    return false;
  }

  res.setHeader("Content-Type", contentType);
  res.setHeader(
    "Cache-Control",
    options.publicCache ? "public, max-age=3600" : "no-store",
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (metadata.size !== undefined) {
    res.setHeader("Content-Length", String(metadata.size));
  }
  const stream = file.createReadStream();
  stream.on("error", (error: Error) => {
    onStreamError(error);
    if (!res.headersSent) res.status(500).end();
    else res.destroy(error);
  });
  stream.pipe(res);
  return true;
}