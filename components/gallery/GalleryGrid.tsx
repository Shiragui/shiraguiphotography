"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface Photo {
  id: string
  filename: string
}

interface GalleryGridProps {
  photos: Photo[]
  token: string
  galleryName: string
  sessionDate: string | null
  downloadEnabled: boolean
  downloadUnlocked: boolean
  coverPhotoId: string | null
}

const BAR_H = 56

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

function BarBtn({ onClick, title, active, dim, children }: {
  onClick?: () => void
  title: string
  active?: boolean
  dim?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={e => { e.stopPropagation(); onClick?.() }}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 40, height: 40, borderRadius: 6,
        background: "none", border: "none",
        color: active ? "#f87171" : dim ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.6)",
        cursor: dim ? "default" : "pointer",
        transition: "color 0.15s",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}

function IconBtn({ href, download, onClick, title, dim, children }: {
  href?: string; download?: string; onClick?: () => void; title: string; dim?: boolean; children: React.ReactNode
}) {
  const style: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 40, height: 40, borderRadius: 6,
    background: "none", border: "none", textDecoration: "none",
    color: dim ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.7)",
    cursor: "pointer", flexShrink: 0, transition: "color 0.15s",
  }
  if (href) return (
    <a href={href} download={download} title={title} style={style} onClick={e => e.stopPropagation()}>
      {children}
    </a>
  )
  return (
    <button type="button" title={title} style={style} onClick={e => { e.stopPropagation(); onClick?.() }}>
      {children}
    </button>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill={filled ? "#f87171" : "none"} stroke={filled ? "#f87171" : "currentColor"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}
function DownloadIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}
function ShareIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function GalleryGrid({
  photos, token, galleryName, sessionDate,
  downloadEnabled, downloadUnlocked: initialUnlocked, coverPhotoId,
}: GalleryGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [unlocked, setUnlocked] = useState(initialUnlocked)
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [codeInput, setCodeInput] = useState("")
  const [codeError, setCodeError] = useState<string | null>(null)
  const [codeLoading, setCodeLoading] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [showFavOnly, setShowFavOnly] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareEmail, setShareEmail] = useState("")
  const [shareIncludeCode, setShareIncludeCode] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [shareStatus, setShareStatus] = useState<{ ok: boolean; message: string } | null>(null)

  useEffect(() => {
    try {
      const s = localStorage.getItem(`sg_fav_${token}`)
      if (s) setFavorites(new Set(JSON.parse(s)))
    } catch { /* ignore */ }
  }, [token])

  function toggleFavorite(photoId: string) {
    setFavorites(prev => {
      const next = new Set(prev)
      next.has(photoId) ? next.delete(photoId) : next.add(photoId)
      try { localStorage.setItem(`sg_fav_${token}`, JSON.stringify([...next])) } catch { /* ignore */ }
      return next
    })
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  function openShareModal() {
    setShareEmail("")
    setShareIncludeCode(false)
    setShareStatus(null)
    setShowShareModal(true)
  }

  async function sendShare(e: React.FormEvent) {
    e.preventDefault()
    if (!shareEmail.trim()) return
    setSharing(true)
    setShareStatus(null)
    try {
      const res = await fetch(`/api/gallery/${token}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: shareEmail.trim(), includeDownloadCode: shareIncludeCode }),
      })
      const data = await res.json()
      if (!res.ok) setShareStatus({ ok: false, message: data.error ?? "Failed to send" })
      else setShareStatus({ ok: true, message: `Sent to ${shareEmail.trim()}` })
    } catch {
      setShareStatus({ ok: false, message: "Something went wrong" })
    } finally {
      setSharing(false)
    }
  }

  function handleDownloadBarClick() {
    if (!downloadEnabled) return
    if (!unlocked) { setShowUnlockModal(true); return }
    setShowDownloadMenu(v => !v)
  }

  const favIdsInGallery = [...favorites].filter(id => photos.some(p => p.id === id))
  const [downloading, setDownloading] = useState(false)

  async function downloadAsZip(targetPhotoIds: string[] | null) {
    setShowDownloadMenu(false)
    const targetPhotos = targetPhotoIds
      ? photos.filter(p => targetPhotoIds.includes(p.id))
      : photos
    if (targetPhotos.length === 0 || downloading) return

    setDownloading(true)
    const total = targetPhotos.length
    let completed = 0
    setDownloadProgress(`Downloading 0 of ${total}…`)

    try {
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()

      const CONCURRENCY = 4
      for (let i = 0; i < targetPhotos.length; i += CONCURRENCY) {
        const batch = targetPhotos.slice(i, i + CONCURRENCY)
        await Promise.all(batch.map(async (photo) => {
          try {
            const res = await fetch(downloadUrl(photo.id))
            if (res.ok) {
              const blob = await res.blob()
              zip.file(photo.filename, blob, { compression: "STORE" })
            }
          } catch { /* skip failed photos */ }
          completed++
          setDownloadProgress(`Downloading ${completed} of ${total}…`)
        }))
      }

      setDownloadProgress("Creating zip…")
      const blob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${galleryName.replace(/[^\w\s-]/g, "").trim()}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setDownloadProgress("Download ready!")
    } catch {
      setDownloadProgress("Download failed — please try again")
    } finally {
      setDownloading(false)
      setTimeout(() => setDownloadProgress(null), 3000)
    }
  }

  const displayPhotos = showFavOnly ? photos.filter(p => favorites.has(p.id)) : photos
  const thumbUrl = (id: string) => `/api/gallery/${token}/photos/${id}?size=thumb`
  const fullUrl = (id: string) => `/api/gallery/${token}/photos/${id}`
  const downloadUrl = (id: string) => `/api/gallery/${token}/photos/${id}?download=1`

  const closeLightbox = useCallback(() => setLightboxIndex(null), [])
  const prev = useCallback(() => setLightboxIndex(i => i === null ? null : (i - 1 + displayPhotos.length) % displayPhotos.length), [displayPhotos.length])
  const next = useCallback(() => setLightboxIndex(i => i === null ? null : (i + 1) % displayPhotos.length), [displayPhotos.length])

  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox()
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightboxIndex, closeLightbox, prev, next])

  useEffect(() => {
    document.body.style.overflow = (lightboxIndex !== null || showUnlockModal) ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [lightboxIndex, showUnlockModal])

  async function submitCode(e: React.FormEvent) {
    e.preventDefault()
    setCodeLoading(true)
    setCodeError(null)
    try {
      const res = await fetch(`/api/gallery/${token}/verify-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeInput }),
      })
      if (!res.ok) setCodeError((await res.json()).error ?? "Incorrect code")
      else { setUnlocked(true); setCodeInput("") }
    } catch {
      setCodeError("Something went wrong, please try again")
    } finally {
      setCodeLoading(false)
    }
  }

  const currentPhoto = lightboxIndex !== null ? displayPhotos[lightboxIndex] : null
  const isFavorited = currentPhoto ? favorites.has(currentPhoto.id) : false

  return (
    <>
      <style>{`
        .sg-masonry { columns: 3; column-gap: 3px; }
        .sg-masonry-item { break-inside: avoid; margin-bottom: 3px; position: relative; overflow: hidden; cursor: pointer; }
        .sg-masonry-item img { width: 100%; display: block; transition: transform 0.4s ease, filter 0.3s ease; }
        .sg-masonry-item:hover img { transform: scale(1.02); filter: brightness(0.8); }
        .sg-photo-heart { position: absolute; bottom: 8px; right: 8px; pointer-events: auto; opacity: 0; transition: opacity 0.2s; background: none; border: none; cursor: pointer; padding: 4px; line-height: 0; }
        .sg-masonry-item:hover .sg-photo-heart, .sg-photo-heart.sg-faved { opacity: 1; }
        @media (max-width: 768px) { .sg-masonry { columns: 2; } }
        @media (max-width: 480px) { .sg-masonry { columns: 1; } }
      `}</style>

      {/* ── Hero ── */}
      {coverPhotoId ? (
        <div
          style={{ position: "relative", height: "100svh", overflow: "hidden", cursor: "pointer" }}
          onClick={() => {
            const idx = displayPhotos.findIndex(p => p.id === coverPhotoId)
            if (idx >= 0) setLightboxIndex(idx)
          }}
        >
          <img src={fullUrl(coverPhotoId)} alt={galleryName}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 35%, transparent 50%, rgba(0,0,0,0.72) 100%)" }} />
          <div style={{ position: "absolute", bottom: "9%", left: 0, right: 0, textAlign: "center", padding: "0 2rem" }}>
            <h1 style={{ margin: 0, fontFamily: "'Georgia', serif", fontSize: "clamp(1.8rem, 5vw, 3.5rem)", fontWeight: 300, letterSpacing: "0.15em", color: "#fff", textShadow: "0 2px 20px rgba(0,0,0,0.5)", textTransform: "uppercase" }}>
              {galleryName}
            </h1>
            {sessionDate && (
              <p style={{ margin: "0.6rem 0 0", fontFamily: "'Georgia', serif", fontSize: "0.88rem", color: "rgba(255,255,255,0.5)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                {formatDate(sessionDate)}
              </p>
            )}
            <div
              onClick={e => { e.stopPropagation(); gridRef.current?.scrollIntoView({ behavior: "smooth" }) }}
              style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem", cursor: "pointer" }}
            >
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>scroll</span>
              <svg width="14" height="8" viewBox="0 0 14 8" fill="none" style={{ opacity: 0.3 }}>
                <path d="M1 1l6 6 6-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: "5rem 2rem 0", textAlign: "center" }}>
          <h1 style={{ margin: 0, fontFamily: "'Georgia', serif", fontSize: "clamp(1.6rem, 4vw, 2.8rem)", fontWeight: 300, letterSpacing: "0.15em", color: "#e8e8e8", textTransform: "uppercase" }}>
            {galleryName}
          </h1>
        </div>
      )}

      {/* ── Info bar (sticky, sits between hero and grid) ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        height: BAR_H,
        background: "#0a0a0a",
        borderTop: "1px solid #181818",
        borderBottom: "1px solid #181818",
        display: "flex", alignItems: "center",
        padding: "0 1.25rem",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", color: "#d0d0d0", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {galleryName}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: "0.65rem", color: "#444", letterSpacing: "0.08em" }}>
            Shira Gui Photography{sessionDate ? ` · ${formatDate(sessionDate)}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <BarBtn
            onClick={() => setShowFavOnly(v => !v)}
            title={showFavOnly ? "Show all photos" : `Favorites${favorites.size ? ` (${favorites.size})` : ""}`}
            active={showFavOnly}
          >
            <HeartIcon filled={showFavOnly} />
          </BarBtn>
          {downloadEnabled && (
            <div style={{ position: "relative" }}>
              <BarBtn onClick={handleDownloadBarClick} title={unlocked ? "Download photos" : "Unlock downloads"} dim={!unlocked}>
                <DownloadIcon />
              </BarBtn>
              {showDownloadMenu && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", right: 0,
                  background: "#111", border: "1px solid #222", borderRadius: 8,
                  overflow: "hidden", minWidth: 210, zIndex: 200,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                }}>
                  <button type="button" onClick={() => downloadAsZip(null)} disabled={downloading}
                    style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", padding: "0.85rem 1rem", background: "none", border: "none", color: downloading ? "#555" : "#d0d0d0", fontSize: "0.82rem", cursor: downloading ? "default" : "pointer", letterSpacing: "0.04em", textAlign: "left" }}
                    onMouseEnter={e => { if (!downloading) e.currentTarget.style.background = "#1a1a1a" }}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                  >
                    <DownloadIcon />
                    All photos ({photos.length})
                  </button>
                  {favIdsInGallery.length > 0 && (
                    <button type="button" onClick={() => downloadAsZip(favIdsInGallery)} disabled={downloading}
                      style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", padding: "0.85rem 1rem", background: "none", border: "none", borderTop: "1px solid #1a1a1a", color: downloading ? "#555" : "#d0d0d0", fontSize: "0.82rem", cursor: downloading ? "default" : "pointer", letterSpacing: "0.04em", textAlign: "left" }}
                      onMouseEnter={e => { if (!downloading) e.currentTarget.style.background = "#1a1a1a" }}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}
                    >
                      <HeartIcon filled />
                      Favorites ({favIdsInGallery.length})
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          <BarBtn onClick={openShareModal} title="Share gallery">
            <ShareIcon />
          </BarBtn>
        </div>
        {/* Close download menu on outside click */}
        {showDownloadMenu && (
          <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setShowDownloadMenu(false)} />
        )}
      </div>

      {/* ── Masonry grid ── */}
      {displayPhotos.length === 0 ? (
        <p style={{ color: "#444", textAlign: "center", margin: "5rem 0", fontSize: "0.88rem", letterSpacing: "0.08em" }}>
          {showFavOnly ? "No favorites yet — heart photos you love." : "No photos yet."}
        </p>
      ) : (
        <div ref={gridRef} style={{ padding: "2rem 0.25rem 6rem" }}>
          <div className="sg-masonry">
            {displayPhotos.map((photo, index) => (
              <div key={photo.id} className="sg-masonry-item" onClick={() => setLightboxIndex(index)}>
                <img src={thumbUrl(photo.id)} alt={photo.filename} loading="lazy" />
                <button
                  type="button"
                  className={`sg-photo-heart${favorites.has(photo.id) ? " sg-faved" : ""}`}
                  onClick={e => { e.stopPropagation(); toggleFavorite(photo.id) }}
                  title={favorites.has(photo.id) ? "Remove from favorites" : "Add to favorites"}
                >
                  <HeartIcon filled={favorites.has(photo.id)} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Unlock modal ── */}
      {showUnlockModal && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={() => setShowUnlockModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: "2rem", width: "min(90vw, 360px)", display: "grid", gap: "1rem" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#e0e0e0", letterSpacing: "0.04em" }}>
                  {unlocked ? "Downloads unlocked" : "Unlock downloads"}
                </p>
                <p style={{ margin: "0.3rem 0 0", fontSize: "0.8rem", color: "#555" }}>
                  {unlocked ? "Choose what to download below" : "Enter the code from your photographer"}
                </p>
              </div>
              <button type="button" onClick={() => setShowUnlockModal(false)}
                style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: "2px", lineHeight: 0 }}>
                <CloseIcon />
              </button>
            </div>
            {unlocked ? (
              <div style={{ display: "grid", gap: "0.6rem" }}>
                <button
                  type="button"
                  onClick={() => { setShowUnlockModal(false); downloadAsZip(null) }}
                  style={{ padding: "0.7rem", borderRadius: 6, border: "none", background: "#fff", color: "#000", fontSize: "0.9rem", cursor: "pointer", fontWeight: 600, letterSpacing: "0.04em" }}
                >
                  Download all photos ({photos.length})
                </button>
                {favorites.size > 0 && (
                  <button
                    type="button"
                    onClick={() => { setShowUnlockModal(false); downloadAsZip(Array.from(favorites)) }}
                    style={{ padding: "0.7rem", borderRadius: 6, border: "1px solid #333", background: "transparent", color: "#e0e0e0", fontSize: "0.9rem", cursor: "pointer", fontWeight: 500, letterSpacing: "0.04em" }}
                  >
                    Download favorites ({favorites.size})
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={submitCode} style={{ display: "grid", gap: "0.6rem" }}>
                <input
                  type="text"
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value)}
                  placeholder="Download code"
                  autoFocus
                  style={{ padding: "0.65rem 0.9rem", borderRadius: 6, border: "1px solid #2a2a2a", background: "#0a0a0a", color: "#fff", fontSize: "1rem", letterSpacing: "0.12em", textTransform: "uppercase" }}
                />
                {codeError && <p style={{ margin: 0, fontSize: "0.82rem", color: "#f87171" }}>{codeError}</p>}
                <button type="submit" disabled={codeLoading || !codeInput.trim()}
                  style={{ padding: "0.65rem", borderRadius: 6, border: "none", background: "#fff", color: "#000", fontSize: "0.9rem", cursor: "pointer", fontWeight: 600, letterSpacing: "0.06em" }}>
                  {codeLoading ? "Checking…" : "Unlock"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && currentPhoto && (
        <div
          role="dialog" aria-modal="true"
          onClick={closeLightbox}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.97)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {/* Lightbox top bar */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: "fixed", top: 0, left: 0, right: 0, height: BAR_H, zIndex: 1001,
              background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)",
              display: "flex", alignItems: "center", padding: "0 0.5rem 0 0.75rem", gap: "0.5rem",
            }}
          >
            <IconBtn onClick={closeLightbox} title="Close"><CloseIcon /></IconBtn>
            <div style={{ flex: 1, minWidth: 0, paddingLeft: "0.25rem" }}>
              <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 500, color: "#e0e0e0", letterSpacing: "0.05em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {galleryName}
              </p>
              <p style={{ margin: 0, fontSize: "0.68rem", color: "#555", letterSpacing: "0.06em" }}>
                Shira Gui Photography{sessionDate ? ` · ${formatDate(sessionDate)}` : ""}
              </p>
            </div>
            <span style={{ color: "#3a3a3a", fontSize: "0.72rem", letterSpacing: "0.1em", flexShrink: 0 }}>
              {lightboxIndex + 1} / {displayPhotos.length}
            </span>
            <div style={{ display: "flex", alignItems: "center" }}>
              <IconBtn onClick={() => toggleFavorite(currentPhoto.id)} title={isFavorited ? "Remove from favorites" : "Add to favorites"}>
                <HeartIcon filled={isFavorited} />
              </IconBtn>
              {downloadEnabled && unlocked ? (
                <IconBtn href={downloadUrl(currentPhoto.id)} download={currentPhoto.filename} title="Download photo">
                  <DownloadIcon />
                </IconBtn>
              ) : downloadEnabled ? (
                <IconBtn onClick={() => { closeLightbox(); setShowUnlockModal(true) }} title="Unlock downloads" dim>
                  <DownloadIcon />
                </IconBtn>
              ) : null}
              <IconBtn onClick={openShareModal} title="Share gallery"><ShareIcon /></IconBtn>
            </div>
          </div>

          <img
            src={fullUrl(currentPhoto.id)}
            alt={currentPhoto.filename}
            loading="eager"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: "95vw", maxHeight: `calc(100vh - ${BAR_H}px)`, marginTop: BAR_H, objectFit: "contain" }}
            // BAR_H offset accounts for the lightbox's own fixed top bar
          />

          {displayPhotos.length > 1 && (
            <button type="button" onClick={e => { e.stopPropagation(); prev() }} aria-label="Previous"
              style={{ position: "fixed", left: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.07)", border: "none", color: "rgba(255,255,255,0.55)", fontSize: "1.75rem", cursor: "pointer", padding: "0.5rem 0.75rem", borderRadius: 4 }}>
              ‹
            </button>
          )}
          {displayPhotos.length > 1 && (
            <button type="button" onClick={e => { e.stopPropagation(); next() }} aria-label="Next"
              style={{ position: "fixed", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.07)", border: "none", color: "rgba(255,255,255,0.55)", fontSize: "1.75rem", cursor: "pointer", padding: "0.5rem 0.75rem", borderRadius: 4 }}>
              ›
            </button>
          )}
        </div>
      )}

      {/* ── Share modal ── */}
      {showShareModal && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={() => setShowShareModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: "1.75rem", width: "min(90vw, 360px)", display: "grid", gap: "1.1rem" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "#e0e0e0", letterSpacing: "0.03em" }}>Share this gallery</p>
              <button type="button" onClick={() => setShowShareModal(false)}
                style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: "2px", lineHeight: 0 }}>
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={sendShare} style={{ display: "grid", gap: "0.75rem" }}>
              <input
                type="email"
                value={shareEmail}
                onChange={e => { setShareEmail(e.target.value); setShareStatus(null) }}
                placeholder="recipient@email.com"
                autoFocus
                required
                style={{ padding: "0.65rem 0.9rem", borderRadius: 6, border: "1px solid #2a2a2a", background: "#0a0a0a", color: "#fff", fontSize: "0.9rem" }}
              />

              {downloadEnabled && unlocked && (
                <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", userSelect: "none" }}>
                  <input
                    type="checkbox"
                    checked={shareIncludeCode}
                    onChange={e => setShareIncludeCode(e.target.checked)}
                    style={{ width: 15, height: 15, accentColor: "#fff", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: "0.82rem", color: "#888" }}>Include download code</span>
                </label>
              )}

              {shareStatus && (
                <p style={{ margin: 0, fontSize: "0.82rem", color: shareStatus.ok ? "#86efac" : "#f87171" }}>
                  {shareStatus.message}
                </p>
              )}

              <button type="submit" disabled={sharing || !shareEmail.trim()}
                style={{ padding: "0.65rem", borderRadius: 6, border: "none", background: "#fff", color: "#000", fontSize: "0.88rem", cursor: "pointer", fontWeight: 600, letterSpacing: "0.04em", opacity: (sharing || !shareEmail.trim()) ? 0.5 : 1 }}>
                {sharing ? "Sending…" : "Send"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast / download progress ── */}
      {(toast || downloadProgress) && (
        <div style={{
          position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
          background: "rgba(20,20,20,0.95)", backdropFilter: "blur(8px)",
          border: "1px solid #2a2a2a", color: "#d0d0d0",
          fontSize: "0.8rem", padding: "0.6rem 1.4rem", borderRadius: 6,
          zIndex: 2000, letterSpacing: "0.06em", pointerEvents: "none",
          whiteSpace: "nowrap",
        }}>
          {downloadProgress ?? toast}
        </div>
      )}
    </>
  )
}
