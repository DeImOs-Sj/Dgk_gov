import express from "express";
import { z } from "zod";
import { v4 as uuid_v4 } from "uuid";
import mime from "mime-types";
import type { BlobData, BlobMetadata, BlobStorage } from "./types";

export { express };
export { z };

export const createBlobStorage = (handlers: {
  delete: (id: string) => Promise<void>;
  get: (id: string) => Promise<BlobData | null>;
  put: BlobStorage["put"];
  info: (id: string) => Promise<Omit<BlobMetadata, "name"> | null>;
}): BlobStorage => {
  const getId = (name: string) => `${uuid_v4()}_${name}`;
  const getName = (id: string) => id.substring(37);

  const info = async (id: string) => {
    const metadata = await handlers.info(id);
    if (!metadata) return null;

    const name = getName(id);
    return {
      mimeType: mime.lookup(name) || undefined,
      ...metadata,
      name,
    };
  };

  return {
    generateId: (metadata) => getId(metadata.name),
    info,
    exists: (id) => info(id).then((info) => info !== null),
    put: handlers.put.bind(this),
    create: async (data, metadata) => {
      const id = getId(metadata.name);
      await handlers.put(id, data, metadata);
      return { id };
    },
    get: async (id) => {
      const metadata = await info(id);
      if (!metadata) return null;
      const data = await handlers.get(id);
      if (!data) return null;
      return { data, metadata };
    },
    delete: (id) => handlers.delete(id),
  };
};
