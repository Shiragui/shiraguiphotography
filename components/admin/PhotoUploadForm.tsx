"use client"

import { useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"

type Photo = {
  id: string
  filename: string
  sort_order: number
  created_at: string
}

type Props = {
  projectId: string
  initialPhotos: Photo[]
  galleryToken: string | null
  initialCoverPhotoId: string | null
}

function dedupeFiles(files: File[]): File[] {
  // Keep the last occurrence of each filename (most recently added wins)
  const map = new Map<string, File>()
  for (const f of files) map.set(f.name, f)
  return Array.from(map.values())
}

export function PhotoUploadForm({ projectId, initialPhotos, galleryToken, initialCoverPhotoId }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [status, setStatus] = useState<string | null>(null)
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(initialCoverPhotoId)
  const [settingCover, setSettingCover] = useState<string | null>(null)

  const thumbUrl = (photoId: string) =>
    galleryToken ? `/api/gallery/${galleryToken}/photos/${photoId}?size=thumb` : null

  async function refreshPhotos() {
    const res = await fetch(`/api/projects/${projectId}/photos`)
    if (res.ok) {
      const data = await res.json()
      setPhotos(data.photos ?? [])
    }
  }

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return

    setUploading(true)
    setFileErrors({})
    setStatus(null)
    const errors: Record<string, string> = {}

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setStatus(`Uploading ${i + 1} of ${files.length}: ${file.name}`)

      const res = await fetch(
        `/api/projects/${projectId}/photos?filename=${encodeURIComponent(file.name)}`,
        {
          method: "POST",
          headers: { "Content-Type": file.type || "image/jpeg" },
          body: file,
        }
      )

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        errors[file.name] = data.error ?? "Upload failed"
      }
    }

    setFileErrors(errors)
    setUploading(false)
    setPendingFiles([])
    if (fileInputRef.current) fileInputRef.current.value = ""

    const successCount = files.length - Object.keys(errors).length
    if (successCount > 0) {
      setStatus(`Done — ${successCount} photo${successCount === 1 ? "" : "s"} uploaded.`)
      await refreshPhotos()
      router.refresh()
    } else {
      setStatus("No photos were uploaded.")
    }
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files ?? [])
    setPendingFiles((prev) => dedupeFiles([...prev, ...newFiles]))
    // Reset input so the same file can be re-selected after removal
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(f.type) ||
      /\.(jpe?g|png|webp)$/i.test(f.name)
    )
    if (dropped.length > 0) {
      setPendingFiles((prev) => dedupeFiles([...prev, ...dropped]))
    }
  }, [])

  async function onDelete(photo: Photo) {
    if (!confirm(`Delete "${photo.filename}"?`)) return
    const res = await fetch(`/api/projects/${projectId}/photos?photoId=${photo.id}`, { method: "DELETE" })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? "Could not delete photo.")
      return
    }
    if (coverPhotoId === photo.id) setCoverPhotoId(null)
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
    router.refresh()
  }

  async function setCover(photoId: string) {
    setSettingCover(photoId)
    try {
      const res = await fetch(`/api/projects/${projectId}/cover`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_id: photoId }),
      })
      if (res.ok) {
        setCoverPhotoId(photoId)
        router.refresh()
      }
    } finally {
      setSettingCover(null)
    }
  }

  async function clearCover() {
    setSettingCover("clear")
    try {
      const res = await fetch(`/api/projects/${projectId}/cover`, { method: "DELETE" })
      if (res.ok) {
        setCoverPhotoId(null)
        router.refresh()
      }
    } finally {
      setSettingCover(null)
    }
  }

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      {/* Upload zone */}
      <div className="admin-card" style={{ padding: "1.5rem", display: "grid", gap: "1rem" }}>
        <h2 style={{ margin: 0 }}>Upload photos</h2>

        <div
          onDragOver={onDragOver}
          onDragEnter={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? "#005987" : "#c8cdd0"}`,
            borderRadius: 10,
            background: dragging ? "#eef4f8" : "#fafbfc",
            padding: "2.5rem 1.5rem",
            textAlign: "center",
            cursor: "pointer",
            transition: "border-color 0.15s, background 0.15s",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📷</div>
          <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
            {dragging ? "Drop photos here" : "Drag photos here or click to browse"}
          </div>
          <div style={{ color: "#6b7680", fontSize: "0.875rem" }}>
            JPEG, PNG, WebP — max 50 MB each
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          multiple
          style={{ display: "none" }}
          onChange={onFileInputChange}
        />

        {pendingFiles.length > 0 && !uploading && (
          <div style={{ fontSize: "0.875rem", color: "#39454b" }}>
            <strong>{pendingFiles.length} file{pendingFiles.length === 1 ? "" : "s"} selected:</strong>{" "}
            {pendingFiles.map((f) => f.name).join(", ")}
          </div>
        )}

        {status && (
          <p style={{ margin: 0, color: uploading ? "#005987" : "#39454b", fontSize: "0.9rem" }}>
            {status}
          </p>
        )}

        {Object.keys(fileErrors).length > 0 && (
          <ul style={{ margin: 0, padding: "0 0 0 1.25rem", color: "#b42318", fontSize: "0.9rem" }}>
            {Object.entries(fileErrors).map(([name, msg]) => (
              <li key={name}><strong>{name}:</strong> {msg}</li>
            ))}
          </ul>
        )}

        <button
          type="button"
          className="admin-button"
          onClick={() => uploadFiles(pendingFiles)}
          disabled={uploading || pendingFiles.length === 0}
          style={{ justifySelf: "start" }}
        >
          {uploading
            ? status ?? "Uploading..."
            : pendingFiles.length > 0
            ? `Upload ${pendingFiles.length} photo${pendingFiles.length === 1 ? "" : "s"}`
            : "Upload"}
        </button>
      </div>

      {/* Photo grid */}
      <div className="admin-card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <h2 style={{ margin: 0 }}>Uploaded photos ({photos.length})</h2>
          {coverPhotoId && (
            <button
              type="button"
              onClick={clearCover}
              disabled={settingCover === "clear"}
              style={{ background: "none", border: "none", color: "#9ca3af", fontSize: "0.82rem", cursor: "pointer", padding: 0 }}
            >
              Remove cover photo
            </button>
          )}
        </div>

        {photos.length === 0 ? (
          <p style={{ margin: 0, color: "#6b7680" }}>No photos yet.</p>
        ) : galleryToken ? (
          // Thumbnail grid
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem" }}>
            {photos.map((photo) => {
              const isCover = photo.id === coverPhotoId
              const url = thumbUrl(photo.id)!
              return (
                <div
                  key={photo.id}
                  style={{
                    position: "relative",
                    borderRadius: 8,
                    overflow: "hidden",
                    border: isCover ? "2px solid #005987" : "2px solid transparent",
                    background: "#f5f6f7",
                  }}
                >
                  <img
                    src={url}
                    alt={photo.filename}
                    style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
                  />
                  {isCover && (
                    <div style={{
                      position: "absolute",
                      top: 6,
                      left: 6,
                      background: "#005987",
                      color: "#fff",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      padding: "2px 7px",
                      borderRadius: 4,
                    }}>
                      COVER
                    </div>
                  )}
                  <div style={{ padding: "0.4rem 0.5rem", display: "flex", gap: "0.4rem", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.72rem", color: "#6b7680", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {photo.filename}
                    </span>
                  </div>
                  <div style={{ padding: "0 0.5rem 0.5rem", display: "flex", gap: "0.4rem" }}>
                    {!isCover && (
                      <button
                        type="button"
                        onClick={() => setCover(photo.id)}
                        disabled={settingCover === photo.id}
                        style={{
                          flex: 1,
                          fontSize: "0.72rem",
                          padding: "0.3rem 0.4rem",
                          borderRadius: 4,
                          border: "1px solid #c8cdd0",
                          background: "#fff",
                          cursor: "pointer",
                          color: "#374151",
                        }}
                      >
                        {settingCover === photo.id ? "Setting…" : "Set as cover"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDelete(photo)}
                      style={{
                        flex: isCover ? 1 : undefined,
                        fontSize: "0.72rem",
                        padding: "0.3rem 0.5rem",
                        borderRadius: 4,
                        border: "1px solid #fca5a5",
                        background: "#fff",
                        cursor: "pointer",
                        color: "#b91c1c",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          // Fallback table when no gallery token (gallery not enabled)
          <div>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.82rem", color: "#6b7680" }}>
              Enable the gallery to see photo thumbnails and set a cover image.
            </p>
            <table className="admin-table">
              <thead>
                <tr><th>#</th><th>Filename</th><th>Uploaded</th><th></th></tr>
              </thead>
              <tbody>
                {photos.map((photo, i) => (
                  <tr key={photo.id}>
                    <td style={{ color: "#6b7680", width: "2rem" }}>{i + 1}</td>
                    <td>{photo.filename}</td>
                    <td>{new Date(photo.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</td>
                    <td>
                      <button type="button" className="admin-button admin-button-secondary" style={{ padding: "0.4rem 0.9rem", fontSize: "0.875rem" }} onClick={() => onDelete(photo)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
