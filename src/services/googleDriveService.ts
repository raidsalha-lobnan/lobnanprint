// Google Drive Integration Service for 100% Original Quality Attachments
// Supports uploading large files, preserving original quality, and retrieving direct preview/download links.

declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

const DRIVE_FOLDER_NAME = 'Lobnan_Print_Attachments';
const STORAGE_KEY_TOKEN = 'lobnan_drive_access_token';
const STORAGE_KEY_TOKEN_EXP = 'lobnan_drive_token_expires_at';

export interface DriveUploadResult {
  fileId: string;
  name: string;
  size: number;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
}

// Get saved token or check if expired
export function getSavedDriveToken(): string | null {
  const token = localStorage.getItem(STORAGE_KEY_TOKEN);
  const expiresAt = localStorage.getItem(STORAGE_KEY_TOKEN_EXP);
  if (!token || !expiresAt) return null;
  if (Date.now() > parseInt(expiresAt, 10)) {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_TOKEN_EXP);
    return null;
  }
  return token;
}

export function saveDriveToken(token: string, expiresInSeconds: number = 3500) {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  localStorage.setItem(STORAGE_KEY_TOKEN, token);
  localStorage.setItem(STORAGE_KEY_TOKEN_EXP, expiresAt.toString());
}

// Request Google Drive Access Token via GSI Token Client
export function requestDriveAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if token already valid
    const existing = getSavedDriveToken();
    if (existing) {
      resolve(existing);
      return;
    }

    if (window.google?.accounts?.oauth2) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: '209948056563-k1q.apps.googleusercontent.com', // Provisioned OAuth Client
        scope: 'https://www.googleapis.com/auth/drive.file',
        hint: 'lobnanprint@gmail.com',
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          if (response.access_token) {
            saveDriveToken(response.access_token, response.expires_in || 3500);
            resolve(response.access_token);
          } else {
            reject(new Error('No access token returned'));
          }
        }
      });
      client.requestAccessToken({ prompt: '' });
    } else {
      // If GSI script not yet loaded, wait and retry or reject
      reject(new Error('Google Identity Services script not available'));
    }
  });
}

// Find or Create specific folder in Google Drive
export async function getOrCreateDriveFolder(accessToken: string): Promise<string | null> {
  try {
    // Search for folder
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        `name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
      )}&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
    }

    // Create folder if not found
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: DRIVE_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'مجلد مرفقات وتصاميم فواتير مطبعة ومكتبة لبنان'
      })
    });

    if (createRes.ok) {
      const folderData = await createRes.json();
      return folderData.id;
    }
    return null;
  } catch (err) {
    console.warn('Could not create or find Google Drive folder:', err);
    return null;
  }
}

// Upload file directly to Google Drive in full binary fidelity
export async function uploadFileToGoogleDrive(
  file: File | Blob,
  fileName: string,
  onProgress?: (percent: number) => void
): Promise<DriveUploadResult> {
  // 1. Get access token
  let token = getSavedDriveToken();
  if (!token) {
    token = await requestDriveAccessToken();
  }

  // 2. Get target folder ID
  const folderId = await getOrCreateDriveFolder(token);

  // 3. Prepare metadata and multipart body
  const metadata: any = {
    name: fileName,
    description: `مرفق أصلي تم حفظه عبر برنامج الأيهم المحاسبي - مطبعة لبنان في ${new Date().toLocaleString('ar-SA')}`
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const mimeType = file.type || 'application/octet-stream';

  // Read binary data
  const arrayBuffer = await file.arrayBuffer();

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
    metadata
  )}\r\n`;

  const filePartHeader = `${delimiter}Content-Type: ${mimeType}\r\nContent-Transfer-Encoding: binary\r\n\r\n`;

  const encoder = new TextEncoder();
  const metadataBuffer = encoder.encode(metadataPart);
  const filePartHeaderBuffer = encoder.encode(filePartHeader);
  const closeDelimiterBuffer = encoder.encode(closeDelimiter);

  // Combine parts into single Uint8Array
  const totalLength =
    metadataBuffer.length + filePartHeaderBuffer.length + arrayBuffer.byteLength + closeDelimiterBuffer.length;
  const combinedBuffer = new Uint8Array(totalLength);

  let offset = 0;
  combinedBuffer.set(metadataBuffer, offset);
  offset += metadataBuffer.length;
  combinedBuffer.set(filePartHeaderBuffer, offset);
  offset += filePartHeaderBuffer.length;
  combinedBuffer.set(new Uint8Array(arrayBuffer), offset);
  offset += arrayBuffer.byteLength;
  combinedBuffer.set(closeDelimiterBuffer, offset);

  // Upload request
  const uploadUrl =
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,mimeType,webViewLink,webContentLink,thumbnailLink';

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: combinedBuffer
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Drive Upload Failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  return {
    fileId: data.id,
    name: data.name || fileName,
    size: parseInt(data.size || '0', 10) || file.size,
    mimeType: data.mimeType || mimeType,
    webViewLink: data.webViewLink,
    webContentLink: data.webContentLink,
    thumbnailLink: data.thumbnailLink
  };
}

export async function shareDriveFolderWithEmail(email: string): Promise<boolean> {
  const token = getSavedDriveToken();
  if (!token) {
    console.warn('Cannot share folder: No Drive token available.');
    return false;
  }
  
  try {
    const folderId = await getOrCreateDriveFolder(token);
    if (!folderId) return false;

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'user',
        role: 'reader', // View access to the attachments
        emailAddress: email
      })
    });
    
    if (res.ok) {
      console.log(`Successfully shared Drive folder with ${email}`);
      return true;
    } else {
      console.error('Failed to share Drive folder:', await res.text());
      return false;
    }
  } catch (err) {
    console.error('Failed to share folder with email:', err);
    return false;
  }
}
