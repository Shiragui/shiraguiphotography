import { cookies } from "next/headers"
import { getGalleryByToken, getGalleryPhotos } from "@/lib/gallery"
import { makeDownloadCookieValue, downloadCookieName } from "@/lib/download-auth"
import { GalleryGrid } from "@/components/gallery/GalleryGrid"

type Params = { params: Promise<{ token: string }> }

function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#fff", fontFamily: "'Source Sans Pro', 'Segoe UI', sans-serif" }}>
        <p style={{ fontSize: "1.1rem", fontWeight: 300, letterSpacing: "0.1em", color: "#888" }}>
          Gallery not found or not yet active
        </p>
        <p style={{ color: "#555", marginTop: "0.75rem", fontSize: "0.9rem" }}>
          Please check the link with your photographer.
        </p>
      </div>
    </div>
  )
}

export default async function GalleryPage({ params }: Params) {
  const { token } = await params

  const gallery = await getGalleryByToken(token)

  if (!gallery || !gallery.gallery_enabled) {
    return <NotFound />
  }

  const photos = await getGalleryPhotos(gallery.id)

  const downloadEnabled = !!gallery.download_code
  let downloadUnlocked = false
  if (downloadEnabled) {
    const cookieStore = await cookies()
    const dlCookie = cookieStore.get(downloadCookieName(token))?.value
    downloadUnlocked = dlCookie === makeDownloadCookieValue(token, gallery.download_code!)
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a" }}>
      <GalleryGrid
        photos={photos}
        token={token}
        galleryName={gallery.name}
        sessionDate={gallery.session_date ?? null}
        downloadEnabled={downloadEnabled}
        downloadUnlocked={downloadUnlocked}
        coverPhotoId={gallery.cover_photo_id ?? null}
      />
    </div>
  )
}
