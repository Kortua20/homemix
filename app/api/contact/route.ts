import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";
const RATE_LIMIT_COOKIE = "homemix_contact_client";
const RATE_LIMIT_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

type ContactPayload = {
  email?: unknown;
  subject?: unknown;
  description?: unknown;
};

function isContactPayload(value: unknown): value is ContactPayload {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  reset_at: string;
};

function deriveRateLimitSecret(privateKey: string) {
  return createHmac("sha256", privateKey)
    .update("homemix-contact-rate-limit-v1")
    .digest("hex");
}

function signClientId(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function readClientId(request: Request, secret: string) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const rawCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${RATE_LIMIT_COOKIE}=`))
    ?.slice(RATE_LIMIT_COOKIE.length + 1);

  try {
    if (!rawCookie) {
      throw new Error("Missing client cookie");
    }

    const decodedCookie = decodeURIComponent(rawCookie);
    const separatorIndex = decodedCookie.lastIndexOf(".");
    if (separatorIndex < 1) {
      throw new Error("Malformed rate-limit cookie");
    }

    const value = decodedCookie.slice(0, separatorIndex);
    const suppliedSignature = decodedCookie.slice(separatorIndex + 1);
    const expectedSignature = signClientId(value, secret);
    const suppliedBuffer = Buffer.from(suppliedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      suppliedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(suppliedBuffer, expectedBuffer)
    ) {
      throw new Error("Invalid rate-limit signature");
    }

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
      throw new Error("Invalid client ID");
    }

    return value;
  } catch {
    return randomUUID();
  }
}

function createClientCookie(clientId: string, secret: string) {
  const signedValue = `${clientId}.${signClientId(clientId, secret)}`;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return `${RATE_LIMIT_COOKIE}=${encodeURIComponent(signedValue)}; Path=/api/contact; HttpOnly; SameSite=Lax; Max-Age=${RATE_LIMIT_COOKIE_MAX_AGE}${secure}`;
}

async function callRateLimitRpc<T>(
  functionName: string,
  body: Record<string, string>,
  supabaseUrl: string,
  publishableKey: string,
) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    const responseText = await response.text();
    console.error("Contact rate-limit RPC failed:", response.status, responseText.slice(0, 300));
    throw new Error("Rate-limit service unavailable");
  }

  const responseText = await response.text();
  return (responseText ? JSON.parse(responseText) : null) as T;
}

export async function POST(request: Request) {
  let parsedPayload: unknown;

  try {
    parsedPayload = await request.json();
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  if (!isContactPayload(parsedPayload)) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const payload = parsedPayload;

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const subject =
    typeof payload.subject === "string" ? payload.subject.trim() : "";
  const description =
    typeof payload.description === "string" ? payload.description.trim() : "";

  if (
    !isValidEmail(email) ||
    !subject ||
    !description ||
    subject.length > 120 ||
    description.length > 2000
  ) {
    return Response.json({ error: "invalid_fields" }, { status: 400 });
  }

  const serviceId = process.env.EMAILJS_SERVICE_ID?.trim();
  const templateId = process.env.EMAILJS_TEMPLATE_ID?.trim();
  const publicKey = process.env.EMAILJS_PUBLIC_KEY?.trim();
  const privateKey = process.env.EMAILJS_PRIVATE_KEY?.trim();
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (
    !serviceId ||
    !templateId ||
    !publicKey ||
    !privateKey ||
    !supabaseUrl ||
    !supabasePublishableKey
  ) {
    console.error(
      "Contact form is missing required server configuration.",
    );
    return Response.json({ error: "service_unavailable" }, { status: 503 });
  }

  const rateLimitSecret = deriveRateLimitSecret(privateKey);
  const clientId = readClientId(request, rateLimitSecret);
  const clientCookie = createClientCookie(clientId, rateLimitSecret);
  let rateLimitResult: RateLimitResult;

  try {
    const results = await callRateLimitRpc<RateLimitResult[]>(
      "reserve_contact_email_quota",
      { p_client_id: clientId, p_secret: rateLimitSecret },
      supabaseUrl,
      supabasePublishableKey,
    );

    if (!results[0]) {
      throw new Error("Rate-limit service returned no result");
    }

    rateLimitResult = results[0];
  } catch (error) {
    console.error("Contact rate-limit check failed:", error);
    return Response.json(
      { error: "service_unavailable" },
      { status: 503, headers: { "Set-Cookie": clientCookie } },
    );
  }

  if (!rateLimitResult.allowed) {
    const resetAt = new Date(rateLimitResult.reset_at).getTime();
    const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
    return Response.json(
      { error: "rate_limited", resetAt },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter), "Set-Cookie": clientCookie },
      },
    );
  }

  try {
    const emailJsResponse = await fetch(EMAILJS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        accessToken: privateKey,
        template_params: {
          email,
          user_email: email,
          from_email: email,
          reply_to: email,
          subject,
          title: subject,
          description,
          message: description,
          to_email: contactEmail,
        },
      }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!emailJsResponse.ok) {
      const responseText = await emailJsResponse.text();
      console.error(
        "EmailJS contact send failed:",
        emailJsResponse.status,
        responseText.slice(0, 300),
      );
      try {
        await callRateLimitRpc<null>(
          "release_contact_email_quota",
          { p_client_id: clientId, p_secret: rateLimitSecret },
          supabaseUrl,
          supabasePublishableKey,
        );
      } catch (releaseError) {
        console.error("Contact quota release failed:", releaseError);
      }

      return Response.json(
        { error: "send_failed" },
        { status: 502, headers: { "Set-Cookie": clientCookie } },
      );
    }

    return Response.json(
      { ok: true, remaining: rateLimitResult.remaining },
      { headers: { "Set-Cookie": clientCookie } },
    );
  } catch (error) {
    console.error("EmailJS contact request failed:", error);
    return Response.json(
      { error: "send_failed" },
      { status: 502, headers: { "Set-Cookie": clientCookie } },
    );
  }
}
