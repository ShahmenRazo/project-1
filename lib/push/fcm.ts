import { sign } from "node:crypto";

/**
 * Firebase Cloud Messaging — HTTP v1 API.
 * Авторизация: service account (Google) -> JWT RS256 -> OAuth2 access token.
 * Без внешних зависимостей (node:crypto).
 *
 * Env: FIREBASE_PROJECT_ID, GOOGLE_SERVICE_ACCOUNT (JSON от сервисного аккаунта)
 */

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

function getServiceAccount(): ServiceAccount {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT is not set");
  return JSON.parse(raw) as ServiceAccount;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

/** JWT-assertion (RS256) для обмена на access token */
function createAssertion(sa: ServiceAccount): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(
    JSON.stringify(claims)
  )}`;
  const signature = sign(
    "RSA-SHA256",
    Buffer.from(signingInput, "utf8"),
    sa.private_key
  );
  return `${signingInput}.${base64url(signature)}`;
}

/** OAuth2 access token (кэшируется до истечения) */
export async function getFcmAccessToken(): Promise<string> {
  if (
    cachedToken &&
    cachedToken.expiresAt > Date.now() + 5 * 60 * 1000 // запас 5 минут
  ) {
    return cachedToken.token;
  }

  const sa = getServiceAccount();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${createAssertion(sa)}`,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`FCM token exchange failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in?: number };
  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
  return json.access_token;
}

export interface FcmResult {
  ok: boolean;
  /** Токен устройства недействителен — его нужно удалить из БД */
  tokenInvalid?: boolean;
  error?: string;
}

/** Отправка одного push через HTTP v1 */
export async function sendFcmMessage(
  token: string,
  input: { title: string; body: string; url: string }
): Promise<FcmResult> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    return { ok: false, error: "FIREBASE_PROJECT_ID is not set" };
  }

  const accessToken = await getFcmAccessToken();

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title: input.title, body: input.body },
          data: { url: input.url },
          webpush: {
            fcm_options: { link: input.url },
            headers: { TTL: "604800" }, // 7 дней
          },
        },
      }),
    }
  );

  if (res.ok) return { ok: true };

  const body = await res.text();
  const tokenInvalid =
    res.status === 404 ||
    body.includes("UNREGISTERED") ||
    body.includes("NOT_FOUND");
  return {
    ok: false,
    tokenInvalid,
    error: `FCM ${res.status}: ${body.slice(0, 300)}`,
  };
}
