// Server-only — never import from "use client" files
import { google } from "googleapis"
import { Readable } from "stream"

function getDriveClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Google OAuth credentials")
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret)
  auth.setCredentials({ refresh_token: refreshToken })

  return google.drive({ version: "v3", auth })
}

const ROOT_FOLDER_ID = () => {
  const id = process.env.GOOGLE_DRIVE_FOLDER_ID
  if (!id) throw new Error("GOOGLE_DRIVE_FOLDER_ID is not set")
  return id
}

export async function getOrCreateProjectFolder(
  projectId: string,
  _projectName: string
): Promise<string> {
  if (!/^[0-9a-f-]{36}$/.test(projectId)) throw new Error("Invalid project ID")

  const drive = getDriveClient()
  const rootId = ROOT_FOLDER_ID()

  const search = await drive.files.list({
    q: `name = '${projectId}' and mimeType = 'application/vnd.google-apps.folder' and '${rootId}' in parents and trashed = false`,
    fields: "files(id)",
    spaces: "drive",
  })

  const existing = search.data.files?.[0]
  if (existing?.id) return existing.id

  const created = await drive.files.create({
    requestBody: {
      name: projectId,
      mimeType: "application/vnd.google-apps.folder",
      parents: [rootId],
    },
    fields: "id",
  })

  if (!created.data.id) throw new Error("Failed to create Drive folder")
  return created.data.id
}

export async function uploadFileToDrive(
  stream: Readable,
  filename: string,
  mimeType: string,
  folderId: string
): Promise<string> {
  const drive = getDriveClient()

  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: "id",
  })

  if (!res.data.id) throw new Error("Drive upload returned no file ID")
  return res.data.id
}

export async function getFileStream(driveFileId: string): Promise<Readable> {
  const drive = getDriveClient()
  const res = await drive.files.get(
    { fileId: driveFileId, alt: "media" },
    { responseType: "stream" }
  )
  return res.data as unknown as Readable
}

export async function deleteFile(driveFileId: string): Promise<void> {
  const drive = getDriveClient()
  await drive.files.delete({ fileId: driveFileId })
}
