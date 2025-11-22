import type { ReadableStream } from "stream/web";
import type express from "express";
export type { express };

export type BlobData = ReadableStream<Uint8Array>;

type DefaultMetadata = {
  name: string;
  mimeType?: string;
  lastModified?: Date;
  size?: number;
};

export type BlobMetadata = Record<string, any> & DefaultMetadata;

export interface BlobStorage {
  generateId: (metadata: BlobMetadata) => Promise<string> | string;
  info: (id: string) => Promise<BlobMetadata | null>;
  exists: (id: string) => Promise<boolean>;
  get: (id: string) => Promise<{
    data: BlobData;
    metadata: BlobMetadata;
  } | null>;
  create: (
    data: BlobData,
    metadata: Omit<BlobMetadata, "lastModified" | "size">,
  ) => Promise<{ id: string }>;
  put: (
    id: string,
    data: BlobData,
    metadata: Omit<BlobMetadata, "lastModified" | "size">,
  ) => Promise<void>;
  delete: (id: string) => Promise<void>;
}
