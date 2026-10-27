import { createMenuBackend } from "../lib/menuBackend.js";

const { hasAdminAccess } = createMenuBackend("Admin authentication");

export default function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST, OPTIONS");
    response.status(405).json({ error: "Method not allowed." });
    return;
  }
  if (!hasAdminAccess(request)) {
    response.status(401).json({ error: "Unauthorized." });
    return;
  }
  response.status(200).json({ authenticated: true });
}
