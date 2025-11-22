import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { fetch } from "expo/fetch";

import { MessageContentComplex } from "@langchain/core/messages";

import { ChatMessage, toContents } from "./chat";

export type FileDefinition = {
  id: string;
  uri: string;
  name?: string;
  mimeType?: string;
};

export const serializeFiles = (
  files: FileDefinition[],
): ChatMessage["content"] => `Uploaded files: ${JSON.stringify(files)}`;

export const parseFilesFromContent = (
  content: MessageContentComplex,
): FileDefinition[] => {
  if (content.type !== "text") return [];

  const [matches] = String(content.text)
    .matchAll(/Uploaded files: (.+)/g)
    .toArray();
  const match = matches?.at(1);
  if (!match) return [];

  try {
    const parsed = JSON.parse(match);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

export const parseFiles = (
  content: ChatMessage["content"],
): FileDefinition[] => {
  const files: FileDefinition[] = [];

  for (const c of toContents(content)) {
    files.push(...parseFilesFromContent(c));
  }

  return files;
};

/**
 * Universal way to upload multiple files to a remote server.
 * Uses expo-file-system under the hood for mobile platforms.
 *
 * @param {URL} location URL of upload route on a remote server
 * @param {{uri: string; name: string; mimeType?: string;}[]} files Array of file URIs.
 * On mobile these should be local file uris and on web these should be base64 encoded data uris
 * @param {FileSystem.FileSystemUploadOptions} options Upload options
 * @returns {Promise<{ successful: any[]; failed: any[] }>} list of successful and failed uploads
 */
export const uploadFiles = async (
  location: URL,
  files: {
    uri: string;
    name: string;
    mimeType?: string;
  }[],
  options: FileSystem.FileSystemUploadOptions,
): Promise<{ successful: any[]; failed: any[] }> => {
  return Promise.allSettled(
    files.map(({ uri, name, mimeType }) =>
      Platform.OS === "web"
        ? fetch(uri) // fetch base64 of the file to get blob
            .then((r) => r.blob())
            .then((blob) =>
              fetch(location.toString(), {
                method: options.httpMethod ?? "POST",
                body:
                  options.uploadType ===
                  FileSystem.FileSystemUploadType.MULTIPART
                    ? (() => {
                        const f = new FormData();
                        const file = new File([blob], name, { type: mimeType });
                        f.append(
                          (options as FileSystem.UploadOptionsMultipart)
                            .fieldName ?? "file",
                          file,
                        );
                        return f;
                      })()
                    : blob,
                headers: options.headers,
              }),
            )
            .then(async (r) => ({
              body: await r.text(),
              status: r.status,
            }))
        : FileSystem.uploadAsync(location.toString(), uri, {
            ...options,
            mimeType,
          }).then((r) => ({
            body: r.body,
            status: r.status,
          })),
    ),
  ).then((settled) => {
    const successful: Omit<FileDefinition, "uri">[] = [];
    const failed: any[] = [];
    for (const p of settled) {
      if (p.status === "fulfilled" && p.value.status < 300) {
        successful.push(JSON.parse(p.value.body));
      } else if (p.status === "rejected") {
        failed.push(p.reason);
      } else {
        failed.push(p);
      }
    }
    return { successful, failed };
  });
};
