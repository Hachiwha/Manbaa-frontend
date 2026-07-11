import type { SourceType } from "./types";

/**
 * MIME types accepted for local import (aligned with API `AllowedMimeType` in `lib/api/types.ts`).
 */
export const ACCEPTED_SOURCE_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "audio/mpeg", // mp3
  "audio/wav", // wav
  "audio/x-wav", // fallback wav
  "audio/mp4", // m4a (souvent utilisé)
  "audio/x-matroska", // mkv (audio/video container)
] as const;

export type AcceptedSourceMime = (typeof ACCEPTED_SOURCE_MIME_TYPES)[number];

/** `accept` attribute for `<input type="file" />`. */
// On Windows, file pickers filter better by extension, so we include both.
export const ACCEPT_ATTRIBUTE = [
  ...ACCEPTED_SOURCE_MIME_TYPES,
  ".mp3",
  ".wav",
  ".m4a",
  ".ogg",
].join(",");

export function mimeToWorkspaceSourceType(mime: string): SourceType | null {
  if (mime === "application/pdf") return "pdf";

  if (mime === "image/png" || mime === "image/jpeg" || mime === "image/webp")
    return "image";

  if (mime === "text/plain" || mime === "text/markdown") return "text";

  if (
    mime ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "doc";

  // 👇 NOUVEAU
  if (
    mime.startsWith("audio/") ||
    mime === "video/x-matroska" || // mkv fallback
    mime === "audio/x-matroska"
  )
    return "audio";

  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(bytes < 10_240 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isAcceptedMime(mime: string): mime is AcceptedSourceMime {
  return (ACCEPTED_SOURCE_MIME_TYPES as readonly string[]).includes(mime);
}
