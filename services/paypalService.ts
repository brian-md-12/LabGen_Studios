
/**
 * LabGen | PayPal Neural Transaction Layer v5.1
 * Secure utility for server-side verification and revocation.
 */

const getSettings = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID || '';
  const secret = process.env.PAYPAL_CLIENT_SECRET || '';
  const isSandbox = clientId.startsWith('sb-');
  const baseUrl = isSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
  
  return { clientId, secret, baseUrl };
};

/**
 * Generates an OAuth2 Access Token.
 * REQUIRED: This must be called from a server-side environment (Vercel Edge/Serverless)
 * to prevent leaking the PAYPAL_CLIENT_SECRET.
 */
export async function getPayPalAccessToken(): Promise<string> {
  const { clientId, secret, baseUrl } = getSettings();

  if (!clientId || !secret) {
    throw new Error("Missing PayPal Credentials. Check Vercel Env variables.");
  }

  const auth = btoa(`${clientId}:${secret}`);
  
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || "Handshake Failed.");
  
  return data.access_token;
}

/**
 * Validates the status of a specific subscription.
 */
export async function verifySubscription(subscriptionId: string) {
  try {
    const { baseUrl } = getSettings();
    const token = await getPayPalAccessToken();

    const response = await fetch(`${baseUrl}/v1/billing/subscriptions/${subscriptionId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return {
      isValid: data.status === "ACTIVE",
      status: data.status,
      planId: data.plan_id,
      raw: data
    };
  } catch (error: any) {
    console.error("[PayPal Verification Error]", error);
    return { isValid: false, error: error.message };
  }
}

/**
 * Revokes an active subscription.
 * Note: Should be called from a secure backend to prevent CORS and credential leakage.
 */
export async function cancelSubscription(subscriptionId: string, reason: string = "User requested cancellation") {
  try {
    const { baseUrl } = getSettings();
    const token = await getPayPalAccessToken();

    const response = await fetch(`${baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason })
    });

    return response.ok;
  } catch (error) {
    console.error("[PayPal Revocation Error]", error);
    return false;
  }
}
