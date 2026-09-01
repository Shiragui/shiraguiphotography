// Server-only
import { Resend } from "resend"

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

interface GalleryEmailOptions {
  clientName: string
  emails: string[]
  projectName: string
  galleryUrl: string
  coverImageUrl: string | null
  downloadCode: string | null
}

export async function sendGalleryEmail({
  clientName,
  emails,
  projectName,
  galleryUrl,
  coverImageUrl,
  downloadCode,
}: GalleryEmailOptions) {
  const firstName = clientName.split(" ")[0]

  const coverSection = coverImageUrl
    ? `<a href="${galleryUrl}" style="display: block; line-height: 0;">
        <img src="${coverImageUrl}" alt="${projectName}" width="560" style="width: 100%; max-width: 560px; display: block; object-fit: cover;" />
      </a>`
    : ""

  const downloadSection = downloadCode
    ? `
      <div style="margin: 32px 0; padding: 24px; background: #f8f8f6; border-radius: 8px; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 13px; color: #888; letter-spacing: 0.08em; text-transform: uppercase;">Your download code</p>
        <p style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.18em; color: #1a1a1a;">${downloadCode}</p>
        <p style="margin: 10px 0 0; font-size: 13px; color: #888;">Enter this code in the gallery to download your photos.</p>
      </div>`
    : ""

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin: 0; padding: 0; background: #f4f4f2; font-family: 'Georgia', serif;">
  <div style="max-width: 560px; margin: 48px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background: #1a1a1a; padding: 28px 40px; text-align: center;">
      <p style="margin: 0; font-size: 13px; letter-spacing: 0.2em; color: #aaa; text-transform: uppercase;">Shira Gui Photography</p>
    </div>

    <!-- Cover photo -->
    ${coverSection}

    <!-- Body -->
    <div style="padding: 40px 40px 32px;">
      <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 400; color: #1a1a1a;">Your gallery is ready, ${firstName}.</h1>
      <p style="margin: 0 0 8px; font-size: 15px; color: #444; line-height: 1.6;">
        Your photos from <strong>${projectName}</strong> are now available to view. Click the button below to open your gallery.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${galleryUrl}" style="display: inline-block; background: #1a1a1a; color: #fff; text-decoration: none; font-size: 14px; letter-spacing: 0.08em; padding: 14px 32px; border-radius: 6px;">
          View Your Gallery
        </a>
      </div>

      ${downloadSection}

      <p style="margin: 24px 0 0; font-size: 13px; color: #999; line-height: 1.6;">
        If the button doesn't work, copy this link into your browser:<br>
        <a href="${galleryUrl}" style="color: #666; word-break: break-all;">${galleryUrl}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="padding: 24px 40px; border-top: 1px solid #eee; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #bbb;">
        © Shira Gui Photography &nbsp;·&nbsp; Feel free to share with family and friends.
      </p>
    </div>
  </div>
</body>
</html>`

  const text = [
    `Hi ${firstName},`,
    ``,
    `Your photos from ${projectName} are ready! View your gallery here:`,
    `${galleryUrl}`,
    downloadCode ? `\nDownload code: ${downloadCode}\nEnter this in the gallery to download your photos.` : "",
    ``,
    `— Shira Gui Photography`,
  ].join("\n")

  return getResend().emails.send({
    from: process.env.RESEND_FROM!,
    replyTo: process.env.RESEND_REPLY_TO,
    to: emails,
    subject: `Your gallery is ready — ${projectName}`,
    html,
    text,
  })
}

export async function sendShareEmail({
  toEmail,
  galleryName,
  galleryUrl,
  downloadCode,
}: {
  toEmail: string
  galleryName: string
  galleryUrl: string
  downloadCode: string | null
}) {
  const downloadSection = downloadCode
    ? `
      <div style="margin: 28px 0; padding: 20px 24px; background: #f8f8f6; border-radius: 8px; text-align: center;">
        <p style="margin: 0 0 6px; font-size: 12px; color: #888; letter-spacing: 0.08em; text-transform: uppercase;">Download code</p>
        <p style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.18em; color: #1a1a1a;">${downloadCode}</p>
        <p style="margin: 8px 0 0; font-size: 12px; color: #888;">Enter this in the gallery to download photos.</p>
      </div>`
    : ""

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin: 0; padding: 0; background: #f4f4f2; font-family: 'Georgia', serif;">
  <div style="max-width: 560px; margin: 48px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
    <div style="background: #1a1a1a; padding: 28px 40px; text-align: center;">
      <p style="margin: 0; font-size: 13px; letter-spacing: 0.2em; color: #aaa; text-transform: uppercase;">Shira Gui Photography</p>
    </div>
    <div style="padding: 36px 40px 32px;">
      <h1 style="margin: 0 0 12px; font-size: 20px; font-weight: 400; color: #1a1a1a;">A gallery has been shared with you.</h1>
      <p style="margin: 0; font-size: 15px; color: #444; line-height: 1.6;">
        You've been invited to view the <strong>${galleryName}</strong> gallery.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${galleryUrl}" style="display: inline-block; background: #1a1a1a; color: #fff; text-decoration: none; font-size: 14px; letter-spacing: 0.08em; padding: 14px 32px; border-radius: 6px;">
          View Gallery
        </a>
      </div>
      ${downloadSection}
      <p style="margin: 20px 0 0; font-size: 12px; color: #999; line-height: 1.6;">
        If the button doesn't work:<br>
        <a href="${galleryUrl}" style="color: #666; word-break: break-all;">${galleryUrl}</a>
      </p>
    </div>
    <div style="padding: 20px 40px; border-top: 1px solid #eee; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #bbb;">© Shira Gui Photography</p>
    </div>
  </div>
</body>
</html>`

  const text = [
    `A gallery has been shared with you.`,
    ``,
    `View the ${galleryName} gallery here: ${galleryUrl}`,
    downloadCode ? `\nDownload code: ${downloadCode}` : "",
    ``,
    `— Shira Gui Photography`,
  ].join("\n")

  return getResend().emails.send({
    from: process.env.RESEND_FROM!,
    to: toEmail,
    subject: `${galleryName} — gallery shared with you`,
    html,
    text,
  })
}

export async function sendContractEmail({
  toEmail,
  clientName,
  projectName,
  signUrl,
}: {
  toEmail: string
  clientName: string
  projectName: string
  signUrl: string
}) {
  const firstName = clientName.split(" ")[0]

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin: 0; padding: 0; background: #f4f4f2; font-family: 'Georgia', serif;">
  <div style="max-width: 560px; margin: 48px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background: #1a1a1a; padding: 28px 40px; text-align: center;">
      <p style="margin: 0; font-size: 13px; letter-spacing: 0.2em; color: #aaa; text-transform: uppercase;">Shira Gui Photography</p>
    </div>

    <!-- Body -->
    <div style="padding: 40px 40px 32px;">
      <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 400; color: #1a1a1a;">Please sign your contract, ${firstName}.</h1>
      <p style="margin: 0 0 16px; font-size: 15px; color: #444; line-height: 1.6;">
        Please review and sign your photography services agreement for <strong>${projectName}</strong>.
      </p>
      <p style="margin: 0 0 28px; font-size: 15px; color: #444; line-height: 1.6;">
        Click the button below to read the contract and add your signature.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${signUrl}" style="display: inline-block; background: #1a1a1a; color: #fff; text-decoration: none; font-size: 14px; letter-spacing: 0.08em; padding: 14px 32px; border-radius: 6px;">
          Review &amp; Sign Contract
        </a>
      </div>

      <p style="margin: 24px 0 0; font-size: 13px; color: #999; line-height: 1.6;">
        If the button doesn't work, copy this link into your browser:<br>
        <a href="${signUrl}" style="color: #666; word-break: break-all;">${signUrl}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="padding: 24px 40px; border-top: 1px solid #eee; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #bbb;">
        © Shira Gui Photography
      </p>
    </div>
  </div>
</body>
</html>`

  const text = [
    `Hi ${firstName},`,
    ``,
    `Please review and sign your photography services agreement for ${projectName}.`,
    ``,
    `Review & Sign Contract: ${signUrl}`,
    ``,
    `— Shira Gui Photography`,
  ].join("\n")

  return getResend().emails.send({
    from: process.env.RESEND_FROM!,
    replyTo: process.env.RESEND_REPLY_TO,
    to: toEmail,
    subject: `Please sign your photography contract — ${projectName}`,
    html,
    text,
  })
}

export async function sendContractSignedNotification({
  signerName,
  projectName,
  signedAt,
  photoRelease,
  adminProjectUrl,
}: {
  signerName: string
  projectName: string
  signedAt: string
  photoRelease: boolean
  adminProjectUrl: string
}) {
  const adminEmail = process.env.RESEND_REPLY_TO ?? process.env.RESEND_FROM!
  const formattedDate = new Date(signedAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  })

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f2;font-family:'Georgia',serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#1a1a1a;padding:22px 32px;">
      <p style="margin:0;font-size:12px;letter-spacing:0.2em;color:#aaa;text-transform:uppercase;">Contract Signed</p>
    </div>
    <div style="padding:28px 32px;">
      <h2 style="margin:0 0 20px;font-size:18px;font-weight:400;color:#1a1a1a;">${signerName} signed the contract for ${projectName}.</h2>
      <table style="width:100%;border-collapse:collapse;background:#f8f8f6;border-radius:6px;overflow:hidden;">
        <tr>
          <td style="padding:6px 12px;color:#888;font-size:13px;white-space:nowrap;vertical-align:top;">Signed by</td>
          <td style="padding:6px 12px;color:#1a1a1a;font-size:14px;">${signerName}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px;color:#888;font-size:13px;white-space:nowrap;vertical-align:top;">Project</td>
          <td style="padding:6px 12px;color:#1a1a1a;font-size:14px;">${projectName}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px;color:#888;font-size:13px;white-space:nowrap;vertical-align:top;">Date</td>
          <td style="padding:6px 12px;color:#1a1a1a;font-size:14px;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px;color:#888;font-size:13px;white-space:nowrap;vertical-align:top;">Photo release</td>
          <td style="padding:6px 12px;color:#1a1a1a;font-size:14px;">${photoRelease ? "Yes" : "No"}</td>
        </tr>
      </table>
      <div style="text-align:center;margin-top:28px;">
        <a href="${adminProjectUrl}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;font-size:13px;letter-spacing:0.08em;padding:12px 28px;border-radius:6px;">
          View contract →
        </a>
      </div>
    </div>
  </div>
</body>
</html>`

  return getResend().emails.send({
    from: process.env.RESEND_FROM!,
    to: adminEmail,
    subject: `Contract signed — ${projectName}`,
    html,
    text: `${signerName} signed the contract for ${projectName} on ${formattedDate}.\nPhoto release: ${photoRelease ? "Yes" : "No"}\n\nView: ${adminProjectUrl}`,
  })
}

export async function sendInquiryNotification({
  name, email, phone, location, message, howFound,
}: {
  name: string
  email: string
  phone?: string
  location?: string
  message?: string
  howFound?: string
}) {
  const adminEmail = process.env.RESEND_REPLY_TO ?? process.env.RESEND_FROM!
  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://shiraguiphotography.com"}/admin/inquiries`

  const rows = [
    ["Name", name],
    ["Email", email],
    phone ? ["Phone", phone] : null,
    location ? ["Location", location] : null,
    howFound ? ["How found", howFound] : null,
    message ? ["Message", message] : null,
  ].filter(Boolean) as [string, string][]

  const tableRows = rows.map(([label, value]) => `
    <tr>
      <td style="padding: 6px 12px; color: #888; font-size: 13px; white-space: nowrap; vertical-align: top;">${label}</td>
      <td style="padding: 6px 12px; color: #1a1a1a; font-size: 14px;">${value}</td>
    </tr>`).join("")

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f2;font-family:'Georgia',serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#1a1a1a;padding:22px 32px;">
      <p style="margin:0;font-size:12px;letter-spacing:0.2em;color:#aaa;text-transform:uppercase;">New inquiry</p>
    </div>
    <div style="padding:28px 32px;">
      <h2 style="margin:0 0 20px;font-size:18px;font-weight:400;color:#1a1a1a;">Someone wants to book a session.</h2>
      <table style="width:100%;border-collapse:collapse;background:#f8f8f6;border-radius:6px;overflow:hidden;">
        ${tableRows}
      </table>
      <div style="text-align:center;margin-top:28px;">
        <a href="${adminUrl}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;font-size:13px;letter-spacing:0.08em;padding:12px 28px;border-radius:6px;">
          View in admin →
        </a>
      </div>
    </div>
  </div>
</body>
</html>`

  return getResend().emails.send({
    from: process.env.RESEND_FROM!,
    to: adminEmail,
    subject: `New inquiry from ${name}`,
    html,
    text: `New inquiry from ${name} (${email})\n\n${rows.map(([l, v]) => `${l}: ${v}`).join("\n")}\n\nView: ${adminUrl}`,
  })
}
