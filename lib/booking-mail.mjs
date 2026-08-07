import { Resend } from "resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function clean(value, max = 500) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, max);
}

export function parseBookingPayload(body) {
  const name = clean(body.name, 120);
  const phone = clean(body.phone, 40);
  const email = clean(body.email, 160).toLowerCase();
  const service = clean(body.service, 120);
  const date = clean(body.date, 40);
  const message = clean(body.message, 2000);

  const errors = [];
  if (name.length < 2) errors.push("Navn mangler.");
  if (phone.length < 6) errors.push("Telefon mangler.");
  if (!EMAIL_RE.test(email)) errors.push("E-mail er ugyldig.");
  if (!service) errors.push("Ydelse mangler.");

  if (errors.length) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      name,
      phone,
      email,
      service,
      date: date || "Ikke angivet",
      message: message || "(ingen)",
    },
  };
}

function buildOwnerHtml(data) {
  const rows = [
    ["Navn", data.name],
    ["Telefon", data.phone],
    ["E-mail", data.email],
    ["Ydelse", data.service],
    ["Ønsket dato", data.date],
    ["Beskrivelse", data.message],
  ]
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e6ebf0;color:#6b7785;font-weight:600;width:140px;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e6ebf0;color:#0a1e31;font-weight:600;">${escapeHtml(value)}</td>
      </tr>`
    )
    .join("");

  return `
  <div style="font-family:Montserrat,Segoe UI,Arial,sans-serif;background:#f4f5f6;padding:28px 16px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6ebf0;">
      <div style="background:#07172c;padding:22px 24px;">
        <p style="margin:0 0 6px;color:#5fb047;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">Ny booking</p>
        <h1 style="margin:0;color:#ffffff;font-size:22px;line-height:1.25;">Forespørgsel fra hjemmesiden</h1>
      </div>
      <div style="padding:8px 12px 4px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}</table>
      </div>
      <div style="padding:16px 24px 22px;color:#6b7785;font-size:12px;line-height:1.5;">
        Svar direkte på denne mail for at kontakte kunden (${escapeHtml(data.email)}).
      </div>
    </div>
  </div>`;
}

function buildOwnerText(data) {
  return [
    "Ny bookingforespørgsel fra hjemmesiden",
    "",
    `Navn: ${data.name}`,
    `Telefon: ${data.phone}`,
    `E-mail: ${data.email}`,
    `Ydelse: ${data.service}`,
    `Ønsket dato: ${data.date}`,
    "",
    "Beskrivelse:",
    data.message,
  ].join("\n");
}

function buildCustomerHtml(data) {
  return `
  <div style="font-family:Montserrat,Segoe UI,Arial,sans-serif;background:#f4f5f6;padding:28px 16px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6ebf0;">
      <div style="background:#07172c;padding:22px 24px;">
        <p style="margin:0 0 6px;color:#5fb047;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">Lykke Service Midtsjælland</p>
        <h1 style="margin:0;color:#ffffff;font-size:22px;line-height:1.25;">Tak for din forespørgsel</h1>
      </div>
      <div style="padding:22px 24px;color:#3d4a57;font-size:15px;line-height:1.65;">
        <p style="margin:0 0 12px;">Hej ${escapeHtml(data.name)},</p>
        <p style="margin:0 0 12px;">
          Vi har modtaget din bookingforespørgsel vedrørende
          <strong style="color:#0a1e31;">${escapeHtml(data.service)}</strong>.
          Vi vender tilbage hurtigst muligt med et uforpligtende tilbud.
        </p>
        <p style="margin:0 0 12px;">
          Har du brug for at snakke med os med det samme, så ring på
          <a href="tel:+4530414242" style="color:#2f7d2a;font-weight:700;text-decoration:none;">30 41 42 42</a>.
        </p>
        <p style="margin:0;color:#6b7785;font-size:13px;">— Marc Lykke B. Jensen</p>
      </div>
    </div>
  </div>`;
}

export async function sendBookingEmails(data) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const to = process.env.BOOKING_TO;

  if (!apiKey || !from || !to) {
    throw new Error("Mangler RESEND_API_KEY, RESEND_FROM eller BOOKING_TO.");
  }

  const resend = new Resend(apiKey);

  const owner = await resend.emails.send({
    from,
    to: [to],
    replyTo: data.email,
    subject: `Booking: ${data.service} – ${data.name}`,
    html: buildOwnerHtml(data),
    text: buildOwnerText(data),
  });

  if (owner.error) {
    const err = new Error(owner.error.message || "Kunne ikke sende booking-mail.");
    err.status = 502;
    err.details = owner.error;
    throw err;
  }

  // Best-effort confirmation to the customer — booking still counts if this fails.
  const customer = await resend.emails.send({
    from,
    to: [data.email],
    replyTo: to,
    subject: "Vi har modtaget din forespørgsel – Lykke Service Midtsjælland",
    html: buildCustomerHtml(data),
    text: [
      `Hej ${data.name},`,
      "",
      `Vi har modtaget din bookingforespørgsel vedrørende ${data.service}.`,
      "Vi vender tilbage hurtigst muligt med et uforpligtende tilbud.",
      "",
      "Telefon: 30 41 42 42",
      "— Lykke Service Midtsjælland",
    ].join("\n"),
  });

  return {
    ownerId: owner.data?.id || null,
    customerId: customer.error ? null : customer.data?.id || null,
    customerError: customer.error || null,
  };
}
