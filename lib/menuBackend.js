import { createClient } from "redis";

// Each endpoint uses the same connection settings and administrator credentials.
export const createMenuBackend = (label, { requestTimeoutMs = 4000, connectTimeoutMs = 3000, createRedisClient = createClient } = {}) => {
  const redisRestUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const redisRestToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  const redisConnectionUrl = process.env.KV_REDIS_URL || process.env.STORAGE_REDIS_URL || process.env.REDIS_URL;
  const adminUser = process.env.DAILY_MENU_ADMIN_USER || "perla";
  const adminPassword = process.env.DAILY_MENU_ADMIN_PASSWORD || "la perla";
  let redisClientPromise = null;
  let activeRedisClient = null;

  const requestError = (statusCode = 503) => {
    const error = new Error(`${label} storage request failed.`);
    error.statusCode = statusCode;
    return error;
  };

  const createStorageError = () => {
    const error = new Error(`${label} storage is not configured.`);
    error.statusCode = 503;
    error.code = "MENU_STORAGE_NOT_CONFIGURED";
    return error;
  };

  const redisRestCommand = async (command) => {
    let response;
    let data;
    try {
      // Abort covers both the connection and response-body read. A timed-out
      // write is deliberately never retried: its result may be uncertain.
      response = await fetch(redisRestUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisRestToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(command),
        signal: AbortSignal.timeout(requestTimeoutMs)
      });
      data = await response.json();
    } catch {
      throw requestError();
    }

    if (!response.ok || data?.error) {
      throw requestError(!response.ok ? (response.status >= 500 ? response.status : 503) : 500);
    }

    return data?.result;
  };

  const getRedisClient = async () => {
    if (!redisConnectionUrl) throw createStorageError();

    if (!redisClientPromise) {
      const client = createRedisClient({
        url: redisConnectionUrl,
        disableOfflineQueue: true,
        socket: { connectTimeout: connectTimeoutMs, socketTimeout: requestTimeoutMs, reconnectStrategy: false }
      });
      activeRedisClient = client;
      const clearClient = () => {
        if (activeRedisClient === client) {
          activeRedisClient = null;
          redisClientPromise = null;
        }
      };
      // The next independent request may reconnect. Never loop reconnects or
      // replay queued commands, especially an ambiguously completed SET.
      client.on("error", clearClient);
      client.on("end", clearClient);
      redisClientPromise = client.connect().then(() => client).catch(() => {
        clearClient();
        if (client.isOpen) client.destroy();
        throw requestError();
      });
    }

    return redisClientPromise;
  };

  const redisUrlCommand = async ([name, key, value]) => {
    if (!["GET", "SET"].includes(name)) {
      const error = new Error("Unsupported Redis command.");
      error.statusCode = 500;
      throw error;
    }

    try {
      const client = await getRedisClient();
      const commands = client.withCommandOptions({ timeout: requestTimeoutMs });
      return name === "GET" ? await commands.get(key) : await commands.set(key, value);
    } catch (error) {
      if (error.code === "MENU_STORAGE_NOT_CONFIGURED") throw error;
      throw requestError();
    }
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
