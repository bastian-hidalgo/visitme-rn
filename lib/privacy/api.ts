import { env } from "@/constants/env";
import { supabase } from "@/lib/supabase";

export const CURRENT_PRIVACY_VERSION = "v1.0-2026-12";

async function privacyRequest(path: string, init: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const url = `${env.visitmeUrl}${path}`;
  const method = init.method ?? "GET";
  const hasAccessToken = Boolean(session?.access_token);

  console.log("[PrivacyAPI] Request started", {
    method,
    path,
    baseUrl: env.visitmeUrl,
    hasAccessToken,
    userId: session?.user?.id ?? null,
  });

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}),
        ...(init.headers ?? {}),
      },
    });
  } catch (error) {
    console.error("[PrivacyAPI] Network or fetch error", {
      method,
      path,
      baseUrl: env.visitmeUrl,
      hasAccessToken,
      error,
    });
    throw new Error("No se pudo conectar con el servidor de privacidad.");
  }

  const responseText = await response.text();
  let body: unknown = null;
  try {
    body = responseText ? JSON.parse(responseText) : null;
  } catch {
    body = responseText || null;
  }

  console.log("[PrivacyAPI] Response received", {
    method,
    path,
    status: response.status,
    ok: response.ok,
    body,
  });

  if (!response.ok) {
    const responseBody = body as { message?: unknown; error?: unknown } | null;
    const message =
      typeof responseBody?.message === "string"
        ? responseBody.message
        : typeof responseBody?.error === "string"
          ? responseBody.error
          : "No fue posible completar la solicitud de privacidad.";
    throw new Error(message);
  }

  return response;
}

export function registerPrivacyConsent(marketingAccepted: boolean) {
  return privacyRequest("/api/privacy/consent", {
    method: "POST",
    body: JSON.stringify({
      terms_version: CURRENT_PRIVACY_VERSION,
      privacy_version: CURRENT_PRIVACY_VERSION,
      marketing_accepted: marketingAccepted,
    }),
  });
}

export function minimizePersonalData() {
  return privacyRequest("/api/privacy/minimize", { method: "POST" });
}

export function deletePrivacyAccount() {
  return privacyRequest("/api/privacy/delete-account", {
    method: "POST",
    body: JSON.stringify({ confirmation_text: "ELIMINAR" }),
  });
}
