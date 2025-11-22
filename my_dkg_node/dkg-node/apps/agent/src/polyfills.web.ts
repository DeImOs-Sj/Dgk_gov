// Keep this file.
import { sha256 } from "js-sha256";

// Polyfill crypto.subtle for non-secure contexts (HTTP)
// This is needed because crypto.subtle is only available in secure contexts (HTTPS or localhost)
if (
  typeof window !== "undefined" &&
  (!window.crypto || !window.crypto.subtle)
) {
  console.warn(
    "⚠️  crypto.subtle is not available (non-secure context). Using polyfill for PKCE.",
  );

  const cryptoPolyfill = {
    getRandomValues: (array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
    subtle: {
      digest: async (algorithm: string, data: BufferSource) => {
        if (algorithm === "SHA-256") {
          const bytes = new Uint8Array(data as ArrayBuffer);
          const hash = sha256.create();
          hash.update(bytes);
          return hash.arrayBuffer();
        }
        throw new Error(`Unsupported algorithm: ${algorithm}`);
      },
    },
  };

  if (!window.crypto) {
    (window as any).crypto = cryptoPolyfill;
  } else if (!window.crypto.subtle) {
    (window.crypto as any).subtle = cryptoPolyfill.subtle;
  }
}
