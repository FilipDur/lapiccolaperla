import { createClient } from "redis";

// Each endpoint uses the same connection settings and administrator credentials.
export const createMenuBackend = (label) => {
  const redisRestUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const redisRestToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  const redisConnectionUrl = process.env.KV_REDIS_URL || process.env.STORAGE_REDIS_URL || process.env.REDIS_URL;
  const adminUser = process.env.DAILY_MENU_ADMIN_USER || "perla";
  const adminPassword = process.env.DAILY_MENU_ADMIN_PASSWORD || "la perla";
  let redisClientPromise = null;

  const createStorageError = () => {
    const error = new Error(`${label} storage is not configured.`);
    error.statusCode = 503;
    error.code = "MENU_STORAGE_NOT_CONFIGURED";
    return error;
  };

  const redisRestCommand = async (command) => {
    const response = await fetch(redisRestUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisRestToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(command)
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.error) {
      const error = new Error(data.error || `${label} storage request failed.`);
      error.statusCode = !response.ok && response.status ? response.status : 500;
      throw error;
    }

    return data.result;
  };

  const getRedisClient = async () => {
    if (!redisConnectionUrl) throw createStorageError();

    if (!redisClientPromise) {
      const client = createClient({ url: redisConnectionUrl });
      client.on("error", (error) => console.error(`${label} Redis error:`, error));
      redisClientPromise = client.connect().then(() => client).catch((error) => {
        redisClientPromise = null;
        throw error;
      });
    }

    return redisClientPromise;
  };

  const redisUrlCommand = async ([name, key, value]) => {
    const client = await getRedisClient();
    if (name === "GET") return client.get(key);
    if (name === "SET") return client.set(key, value);

    const error = new Error("Unsupported Redis command.");
    error.statusCode = 500;
    throw error;
  };

  const redisCommand = async (command) => {
    if (redisRestUrl && redisRestToken) return redisRestCommand(command);
    if (redisConnectionUrl) return redisUrlCommand(command);
    throw createStorageError();
  };

  const hasAdminAccess = (request) =>
    request.headers["x-admin-user"] === adminUser &&
    request.headers["x-admin-password"] === adminPassword;

  return { redisCommand, hasAdminAccess };
};
