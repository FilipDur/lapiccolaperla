import assert from "node:assert/strict";
import test from "node:test";
import { createReservationHandler } from "../api/silvestr-reservation.js";

const now = () => new Date("2026-12-17T12:00:00Z");
const sender = () => ({ apiKey: "test_key", from: "Test <reservations@example.test>" });
const reservation = { name: "Test Guest", email: "guest@example.test", guests: "3", time: "19:30", note: "<em>Window table</em>" };

async function request(handler, { body = reservation, origin = "https://lapiccolaperla.cz", host = "lapiccolaperla.cz", method = "POST" } = {}) {
  const response = {
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    end(value) { this.body = JSON.parse(value); },
  };
  await handler({
    method,
    headers: { origin, host, "content-type": "application/json" },
    socket: { remoteAddress: "192.0.2.1" },
    body,
  }, response);
  return response;
}

test("routes a valid enquiry to the restaurant through Resend and reuses its retry key", async () => {
  const calls = [];
  const handler = createReservationHandler({
    now,
    getSender: sender,
    send: async (url, options) => {
      calls.push({ url, options });
      return Response.json({ id: "test_message" });
    },
  });
  assert.deepEqual((await request(handler)).body, { status: "sent" });
  assert.deepEqual((await request(handler)).body, { status: "sent" });
  assert.equal(calls[0].url, "https://api.resend.com/emails");
  assert.equal(calls[0].options.headers["Idempotency-Key"], calls[1].options.headers["Idempotency-Key"]);
  const email = JSON.parse(calls[0].options.body);
  assert.deepEqual(email.to, ["la.piccola.perla@email.cz"]);
  assert.equal(email.from, sender().from);
  assert.equal(email.reply_to, reservation.email);
  assert.equal(email.html, undefined);
  assert.match(email.text, /19:30/);
  assert.doesNotMatch(email.text, /Telefon:/);
  const withPhone = await request(handler, { body: { ...reservation, phone: "+420 123 456 789" } });
  assert.equal(withPhone.statusCode, 200);
  assert.match(JSON.parse(calls[2].options.body).text, /Telefon: \+420 123 456 789/);
});

test("rejects invalid, automated, cross-origin and expired submissions before contacting Resend", async () => {
  const send = () => assert.fail("Unexpected mail delivery.");
  const handler = createReservationHandler({ now, getSender: sender, send });
  assert.equal((await request(handler, { origin: "https://example.test" })).statusCode, 403);
  assert.equal((await request(handler, { method: "GET" })).statusCode, 405);
  assert.equal((await request(handler, { body: { ...reservation, guests: "0" } })).statusCode, 422);
  assert.equal((await request(handler, { body: { ...reservation, phone: "unknown" } })).statusCode, 422);
  assert.equal((await request(handler, { body: { ...reservation, email: "guest@example.test\r\nBcc:test@example.test" } })).statusCode, 422);
  assert.equal((await request(handler, { body: { ...reservation, companyWebsite: "spam" } })).statusCode, 400);
  assert.equal((await request(handler, { body: { ...reservation, note: "x".repeat(4500) } })).statusCode, 400);
  assert.equal((await request(createReservationHandler({
    now: () => new Date("2026-12-31T23:00:00Z"), getSender: sender, send,
  }))).statusCode, 410);
});

test("marks local submissions as preview and distinguishes missing settings from a provider failure", async () => {
  const preview = createReservationHandler({ now, preview: true, send: () => assert.fail("Preview contacted provider.") });
  assert.deepEqual((await request(preview, { origin: "http://127.0.0.1:4187" })).body, { status: "preview" });
  const host = "perla-preview.vercel.app";
  assert.deepEqual((await request(preview, { origin: `https://${host}`, host })).body, { status: "preview" });
  assert.equal((await request(preview, { origin: "https://example.test", host })).statusCode, 403);
  assert.equal((await request(createReservationHandler({ now }), { origin: `https://${host}`, host })).statusCode, 403);
  assert.equal((await request(createReservationHandler({ now, getSender: () => ({}) }))).statusCode, 503);
  const failed = createReservationHandler({ now, getSender: sender, send: async () => new Response(null, { status: 500 }) });
  assert.deepEqual((await request(failed)).body, { error: "delivery" });
});
