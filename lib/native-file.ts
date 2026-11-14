/**
 * Document delivery helpers for the Kapilla Android shell.
 *
 * The shell is a plain Capacitor WebView with no print engine and no download
 * listener: `window.print()` does nothing and `<a download>` / blob URLs are
 * silently ignored. Anything that used to print or download a document has to
 * be handed to Android instead — written to the device with the Filesystem
 * plugin and passed to the share sheet with the Share plugin, so the user can
 * send it on (WhatsApp, email, Drive) or save it to their downloads.
 */

import { useSyncExternalStore } from 'react';

const NATIVE_SHELL_UA = 'KapillaAppShell';

/** True when this page is running inside the Kapilla Android shell. */
export function isNativeShell(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.userAgent.includes(NATIVE_SHELL_UA);
}

const subscribeToNothing = () => () => {};

/**
 * `isNativeShell()` as a hook. The shell never changes while a page is open, so
 * there is nothing to subscribe to — this just renders `false` on the server
 * and re-reads the real value once hydrated.
 */
export function useIsNativeShell(): boolean {
  return useSyncExternalStore(subscribeToNothing, isNativeShell, () => false);
}

/** Capacitor's Filesystem plugin takes base64, so encode the Blob first. */
async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000; // stay well inside the argument-count limit
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += Array.from(bytes.subarray(i, i + chunkSize), (byte) =>
      String.fromCharCode(byte)
    ).join('');
  }
  return btoa(binary);
}

function safeFileName(fileName: string): string {
  return fileName.replace(/[\\/:*?"<>|]+/g, '-');
}

/**
 * Save a document on the device and offer the Android share sheet.
 * Returns false on the web, so callers can keep their browser download path.
 */
export async function saveOrShare(
  data: Blob | string,
  fileName: string,
  dialogTitle = 'Save or share'
): Promise<boolean> {
  if (!isNativeShell()) return false;

  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');

    const path = safeFileName(fileName);
    await Filesystem.writeFile({
      path,
      data: typeof data === 'string' ? data : await blobToBase64(data),
      directory: Directory.Cache,
      recursive: true,
    });

    const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache });
    await Share.share({ title: path, files: [uri], dialogTitle });

    return true;
  } catch (error) {
    // A shell built before these plugins existed has no bridge for them, so let
    // the caller fall back to its browser path instead of failing outright.
    console.error('[native-file] could not save or share', error);
    return false;
  }
}

/**
 * Open a server-generated PDF. On the web it goes to a new tab (browser PDF
 * viewer, ready to print); in the app it is fetched with the session cookie and
 * handed to the share sheet, because a WebView cannot render PDFs.
 */
export async function openPdfUrl(
  url: string,
  fileName: string,
  dialogTitle = 'Save or share document'
): Promise<void> {
  if (!isNativeShell()) {
    window.open(url, '_blank');
    return;
  }

  const res = await fetch(url, { credentials: 'same-origin', cache: 'no-store' });
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  if (!(await saveOrShare(await res.blob(), fileName, dialogTitle))) {
    window.open(url, '_blank');
  }
}
