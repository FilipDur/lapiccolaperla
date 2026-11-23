import { createHash } from "node:crypto";
import { getRestaurantDate } from "../src/lib/restaurantDate.js";
import { newYearDate, showNewYearPromotion } from "../src/restaurant/newYearCopy.js";

const reservationInbox = "fimadux@gmail.com";
const reservationSubject = "La Piccola Perla – New Year's Eve reservation";
const maxBodyBytes = 4096;
const windowMs = 10 * 60 * 1000;
const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

const configuredSender = () => ({
  apiKey: process.env.RESEND_API_KEY?.trim(),
  from: process.env.RESEND_FROM_EMAIL?.trim(),
});

function respond(response, status, value) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(value));
}

async function readPayload(request) {
  if (request.body !== undefined) {
    const raw = typeof request.body === "string" ? request.body : JSON.stringify(request.body);
    if (Buffer.byteLength(raw) > maxBodyBytes) throw new Error("Payload too large.");
    return JSON.parse(raw);
  }
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    const buffer = Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > maxBodyBytes) throw new Error("Payload too large.");
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function getReservation(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const readText = (key) => typeof payload[key] === "string" ? payload[key].trim() : "";
  const name = readText("name");
  const email = readText("email");
  const phone = readText("phone");
  const guestCount = readText("guests");
  const time = readText("time");
  const note = readText("note");
  if (!name || name.length > 100 || /[\r\n\u0000]/.test(name) ||
      email.length > 254 || !emailPattern.test(email) ||
      (phone && (phone.length > 40 || !/[0-9]/.test(phone) || /[\r\n\u0000]/.test(phone))) ||
      !/^[1-9]\d?$/.test(guestCount) ||
      (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) ||
      note.length > 500 || note.includes("\u0000")) return null;
  return { name, email, guests: Number(guestCount), time, note, ...(phone ? { phone } : {}) };
}

export function createReservationHandler({
  preview = false,
  send = fetch,
  getSender = configuredSender,
  now = () => new Date(),
} = {}) {
  const attempts = new Map();
  let resetAt = 0;

  return async function handler(request, response) {
    response.setHeader("Cache-Control", "no-store");
    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      return respond(response, 405, { error: "method" });
    }

    const origin = request.headers.origin;
    const permittedOrigin = preview
      ? /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin || "") ||
        (Boolean(request.headers.host) && origin === `https://${request.headers.host}`)
      : origin === "https://lapiccolaperla.cz";
    if (!permittedOrigin) return respond(response, 403, { error: "origin" });
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers["content-type"] || "")) {
      return respond(response, 415, { error: "content_type" });
    }

    const date = now();
    if (!showNewYearPromotion(getRestaurantDate(date))) {
      return respond(response, 410, { error: "closed" });
    }

    let payload;
    try {
      payload = await readPayload(request);
    } catch {
      return respond(response, 400, { error: "invalid" });
    }
    if (payload?.companyWebsite) return respond(response, 400, { error: "invalid" });
    const reservation = getReservation(payload);
    if (!reservation) return respond(response, 422, { error: "invalid" });

    if (preview) return respond(response, 200, { status: "preview" });
    const { apiKey, from } = getSender();
    if (!apiKey || !from) return respond(response, 503, { error: "unavailable" });

    if (date.getTime() >= resetAt) {
      attempts.clear();
      resetAt = date.getTime() + windowMs;
    }
    const address = String(request.headers["x-vercel-forwarded-for"] || request.socket?.remoteAddress || "unknown").split(",")[0].trim();
    const count = attempts.get(address) || 0;
    if (count >= 6 || (count === 0 && attempts.size >= 2048)) {
      response.setHeader("Retry-After", String(Math.ceil((resetAt - date.getTime()) / 1000)));
      return respond(response, 429, { error: "rate_limited" });
    }
    attempts.set(address, count + 1);

    const { name, email, phone, guests, time, note } = reservation;
    const submissionId = typeof payload.submissionId === "string" && /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(payload.submissionId)
      ? payload.submissionId : undefined;
    const key = createHash("sha256").update(JSON.stringify({ date: newYearDate, ...reservation, submissionId })).digest("hex");
    try {
      const result = await send("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `silvestr-reservation/${key}`,
        },
        body: JSON.stringify({
          from,
          to: [reservationInbox],
          reply_to: email,
          subject: reservationSubject,
          text: [
            `Poptávka stolu na ${newYearDate}`,
            `Jméno: ${name}`,
            `E-mail: ${email}`,
            phone ? `Telefon: ${phone}` : "",
            `Hosté: ${guests}`,
            `Preferovaný čas: ${time || "neuveden"}`,
            note ? `Poznámka: ${note}` : "",
          ].filter(Boolean).join("\n"),
        }),
        signal: AbortSignal.timeout(7000),
      });
      if (result.ok && (await result.json())?.id) {
        return respond(response, 200, { status: "sent" });
      }
    } catch {
      // Response and logs contain no guest details or provider credentials.
    }
    return respond(response, 502, { error: "delivery" });
  };
}

export default createReservationHandler({
  preview: process.env.VERCEL_ENV === "preview" || process.env.SILVESTR_TEST_MODE === "1",
});
