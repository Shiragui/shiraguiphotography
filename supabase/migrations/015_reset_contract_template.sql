-- Overwrite the default template with the current canonical version.
UPDATE contract_templates
SET body =
'PHOTOGRAPHY SERVICES AGREEMENT

This Photography Services Agreement is entered into as of {{date_today}}, between Shira Gui Photography ("Photographer") and {{client_name}} ("Client").

Session Type:  {{project_type}}
Session Date:  {{session_date}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A. SESSION FEES

A deposit is required to reserve and lock in the session date. The deposit amount will be agreed upon in writing prior to booking.

The deposit is refundable only in the following circumstances: (1) unsafe or severe weather conditions on the day of the session make it impossible to proceed, or (2) the Photographer is unable to complete or deliver the photographs due to unforeseen circumstances beyond Photographer''s control (such as illness or equipment failure). The deposit is non-refundable for any other reason, including Client cancellation or no-show.

The remaining balance is due in full immediately following the photoshoot. No digital images will be delivered until payment has been received in full. All fees beyond the deposit are non-refundable once the session has taken place. The agreed session fee covers all digital images delivered via the online gallery.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

B. LOCATION COSTS & FEES

If there are any costs or fees associated with the location chosen by the Client (permits, parking, entry fees, etc.), the Client is solely responsible for those costs. Photographer will not guarantee or provide payment for a location.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

C. RESCHEDULING & CANCELLATION

Client may reschedule their session one time by providing at least 24 hours'' notice prior to the scheduled shoot without penalty. If Client fails to give 24 hours'' notice, or cancels entirely, the session fee or deposit is forfeited and will not be refunded.

Photographer reserves the right to reschedule due to illness, severe weather, equipment malfunction, or other circumstances beyond Photographer''s control. In such cases, Client will be offered a full reschedule at no additional cost.

A 10-minute grace period applies to full sessions. If Client has not arrived within 10 minutes of the session start time, the session fee is forfeited.

Regardless of arrival time, the session will conclude at the originally agreed end time. Late arrival does not entitle Client to additional session time.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

D. IMAGE DELIVERY & TURNAROUND

Photographer will deliver carefully selected, edited digital photographs via a private online gallery within 1–2 weeks of the session date. Turnaround time may vary by season and session type.

Photographer will select which images are included in the final delivery. Images with eyes closed, duplicates, unflattering expressions, or otherwise not meeting Photographer''s quality standard will not be included. No unedited or raw images will be released under any circumstances.

Client will have 30 days from the date the gallery link is delivered to download their photographs. After 30 days, files may no longer be accessible. Photographer is not responsible for long-term storage of files after delivery.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

E. RE-SHOOTS & REFUNDS

Re-shoots and refunds will not be provided for poor choices of clothing, hair, or makeup; uncooperative subjects; weather-related dissatisfaction; or failure to follow Photographer''s recommendations during the session. Re-shoots are at the sole discretion of the Photographer.

Once all images have been delivered, Photographer''s contractual obligation is fulfilled. Client accepts that images will be consistent with Photographer''s portfolio and editing style as displayed on shiraguiphotography.com.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

F. COPYRIGHT & PHOTO RELEASE

Shira Gui Photography retains full copyright to all images created during the session. Client is granted a personal-use license to print, display, and share the delivered photographs for personal, non-commercial purposes.

Client may not sell, license, or use the photographs for commercial or advertising purposes without prior written consent from Photographer.

Regarding use of Client''s photographs for Shira Gui Photography''s portfolio, website, Instagram, and other promotional materials: Client''s preference is captured at the time of signing and noted at the bottom of this agreement. Opting out will not affect the session in any way.

Feel free to take behind-the-scenes photos on your phone during the session; please be respectful in doing so and avoid interfering with the shoot.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

G. LIABILITY

Photographer is not responsible for any injuries to Client or accompanying parties during the session. Client is responsible for themselves, their minor children, and any guests, and releases Photographer from any related claims.

Photographer is not responsible for damage to or loss of portraits after delivery to Client. Client assumes full responsibility for the safety of all photographs upon receipt.

Photographer''s total liability under this Agreement shall not exceed the total fees paid by Client.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

H. SESSION GUIDELINES

• Please arrive 5–10 minutes before the session start time.
• Please avoid red or orange food and drinks before the session, as they can stain the face.
• Please do not bring children who are not being photographed to the session.
• Creative direction, posing, and editing style are at the Photographer''s discretion and will be consistent with Photographer''s portfolio.',
updated_at = NOW()
WHERE is_default = true;
