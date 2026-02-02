
import { supabase } from './supabaseClient';

export interface DriveUploadProgress {
  file: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
}

export interface DriveExportResult {
  folderId: string;
  folderUrl: string;
}

/**
 * Checks if the current session has a valid Google provider_token.
 */
export const hasDriveAccess = async (): Promise<boolean> => {
  if (!supabase) return false;
  const { data: { session } } = await supabase.auth.getSession();
  return !!session?.provider_token;
};

const getAccessToken = async (): Promise<string> => {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.provider_token;
  if (!token) throw new Error("Google Drive access requires a valid Google Sign-In session.");
  return token;
};

async function handleDriveResponse(response: Response) {
  if (response.status === 403) {
    const data = await response.json();
    if (data.error?.message?.toLowerCase().includes('insufficient authentication scopes')) {
      throw new Error("INSUFFICIENT_SCOPES");
    }
    throw new Error(data.error?.message || "Forbidden Drive Access");
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || `Drive API error: ${response.status}`);
  }
  return response.json();
}

async function findFolderByName(name: string, headers: any): Promise<string | null> {
  const q = encodeURIComponent(`name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, { headers });
  const data = await handleDriveResponse(res);
  return data.files && data.files.length > 0 ? data.files[0].id : null;
}

async function createFolder(name: string, parentId: string | null, headers: any): Promise<string> {
  const metadata: any = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) metadata.parents = [parentId];
  
  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata)
  });
  
  const data = await handleDriveResponse(res);
  return data.id;
}

export const initializeRootFolder = async (): Promise<string> => {
  const token = await getAccessToken();
  const headers = { Authorization: `Bearer ${token}` };
  let rootId = await findFolderByName('Labgen studio files', headers);
  if (!rootId) {
    rootId = await createFolder('Labgen studio files', null, headers);
  }
  return rootId;
};

export const exportProjectToDrive = async (
  projectName: string,
  protocol: string,
  educationalProtocol: string | undefined,
  learnerReport: string | undefined,
  scenes: any[],
  onProgress: (progress: DriveUploadProgress[]) => void
): Promise<DriveExportResult> => {
  const token = await getAccessToken();
  const headers = { Authorization: `Bearer ${token}` };

  const progress: DriveUploadProgress[] = [
    { file: 'Synchronizing Root Hub', status: 'uploading' },
    { file: 'Mapping Project Space', status: 'pending' },
    { file: 'Archiving Protocol Source', status: 'pending' },
    ...(educationalProtocol ? [{ file: 'Archiving Educator Manual', status: 'pending' as const }] : []),
    ...(learnerReport ? [{ file: 'Archiving Learner Report', status: 'pending' as const }] : []),
    ...scenes.flatMap(s => [
      s.imageUrl ? { file: `Scene ${s.scene_number} Visual`, status: 'pending' as const } : null,
      s.videoUrl ? { file: `Scene ${s.scene_number} Cinematic`, status: 'pending' as const } : null,
    ]).filter(Boolean) as DriveUploadProgress[]
  ];
  onProgress([...progress]);

  // 1. Root Handshake
  const rootId = await initializeRootFolder();
  progress[0].status = 'completed';
  onProgress([...progress]);

  // 2. Project Directory
  progress[1].status = 'uploading';
  onProgress([...progress]);
  const timestamp = new Date().toISOString().split('T')[0];
  const projectFolderId = await createFolder(`[v4] ${projectName} (${timestamp})`, rootId, headers);
  progress[1].status = 'completed';
  onProgress([...progress]);

  // 3. Raw Protocol Doc
  progress[2].status = 'uploading';
  onProgress([...progress]);
  const docMetadata = {
    name: `${projectName} - Raw Instructions`,
    mimeType: 'application/vnd.google-apps.document',
    parents: [projectFolderId]
  };
  const docBody = await createMultipartBody(docMetadata, 'text/plain', protocol);
  const docRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST', headers, body: docBody
  });
  await handleDriveResponse(docRes);
  progress[2].status = 'completed';
  onProgress([...progress]);

  let assetIdx = 3;

  // 4. Educational Protocol
  if (educationalProtocol) {
    progress[assetIdx].status = 'uploading';
    onProgress([...progress]);
    const eduMetadata = {
      name: `${projectName} - Educator Manual`,
      mimeType: 'application/vnd.google-apps.document',
      parents: [projectFolderId]
    };
    const eduBody = await createMultipartBody(eduMetadata, 'text/plain', educationalProtocol);
    const eduRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST', headers, body: eduBody
    });
    await handleDriveResponse(eduRes);
    progress[assetIdx].status = 'completed';
    onProgress([...progress]);
    assetIdx++;
  }

  // 5. Learner Report
  if (learnerReport) {
    progress[assetIdx].status = 'uploading';
    onProgress([...progress]);
    const lrMetadata = {
      name: `${projectName} - Learner Report`,
      mimeType: 'application/vnd.google-apps.document',
      parents: [projectFolderId]
    };
    const lrBody = await createMultipartBody(lrMetadata, 'text/plain', learnerReport);
    const lrRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST', headers, body: lrBody
    });
    await handleDriveResponse(lrRes);
    progress[assetIdx].status = 'completed';
    onProgress([...progress]);
    assetIdx++;
  }

  // 6. Asset Pipeline
  for (const scene of scenes) {
    if (scene.imageUrl) {
      progress[assetIdx].status = 'uploading'; onProgress([...progress]);
      await uploadMedia(projectFolderId, `S${scene.scene_number}_Visual.png`, 'image/png', scene.imageUrl, headers);
      progress[assetIdx].status = 'completed'; onProgress([...progress]);
      assetIdx++;
    }
    if (scene.videoUrl) {
      progress[assetIdx].status = 'uploading'; onProgress([...progress]);
      const blob = await fetch(scene.videoUrl).then(r => r.blob());
      await uploadMediaBlob(projectFolderId, `S${scene.scene_number}_Veo.mp4`, 'video/mp4', blob, headers);
      progress[assetIdx].status = 'completed'; onProgress([...progress]);
      assetIdx++;
    }
  }

  return { folderId: projectFolderId, folderUrl: `https://drive.google.com/drive/folders/${projectFolderId}` };
};

async function uploadMedia(folderId: string, name: string, mimeType: string, dataUrl: string, headers: any) {
  const base64 = dataUrl.split(',')[1];
  const blob = await fetch(`data:${mimeType};base64,${base64}`).then(r => r.blob());
  return uploadMediaBlob(folderId, name, mimeType, blob, headers);
}

async function uploadMediaBlob(folderId: string, name: string, mimeType: string, blob: Blob, headers: any) {
  const metadata = { name, parents: [folderId] };
  const body = await createMultipartBody(metadata, mimeType, blob);
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST', headers, body
  });
  return handleDriveResponse(res);
}

async function createMultipartBody(metadata: any, contentType: string, data: string | Blob): Promise<Blob> {
  const boundary = 'labgen_v2_boundary';
  const parts: (string | Blob)[] = [
    `--${boundary}\r\n`,
    `Content-Type: application/json; charset=UTF-8\r\n\r\n`,
    `${JSON.stringify(metadata)}\r\n`,
    `--${boundary}\r\n`,
    `Content-Type: ${contentType}\r\n\r\n`,
    data,
    `\r\n--${boundary}--`
  ];
  return new Blob(parts, { type: `multipart/related; boundary=${boundary}` });
}
