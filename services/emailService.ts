import { supabase } from './supabaseClient';

const getAccessToken = async (): Promise<string> => {
  if (!supabase) throw new Error("Authentication infrastructure offline.");
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.provider_token;
  if (!token) throw new Error("Email actions require a Google Session. Please re-authenticate via Google SSO.");
  return token;
};

/**
 * Encodes an RFC 822 email message to base64url format required by Gmail API.
 */
function base64UrlEncodeMessage(message: string): string {
  return btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Dispatches a professional HTML email via the Gmail API.
 */
export const sendGmailMessage = async (to: string, subject: string, projectName: string, studentName: string, formLink: string, deadline?: string): Promise<void> => {
  const token = await getAccessToken();
  
  const htmlBody = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; background-color: #2563eb; color: white; padding: 12px; border-radius: 12px; font-weight: 900; letter-spacing: 1px;">LABGEN</div>
      </div>
      <h2 style="font-size: 24px; font-weight: 900; color: #0f172a; margin-bottom: 20px; text-transform: uppercase; letter-spacing: -0.5px;">Assessment Dispatch</h2>
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear <b>${studentName}</b>,</p>
      <p style="font-size: 14px; line-height: 1.6; margin-bottom: 24px;">Your academic assessment for project <b>"${projectName}"</b> is now provisioned and ready for completion.</p>
      
      <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; margin-bottom: 32px; border: 1px solid #f1f5f9;">
        <table style="width: 100%; font-size: 12px; text-transform: uppercase; font-weight: 700; color: #64748b;">
          <tr>
            <td style="padding-bottom: 8px;">Protocol</td>
            <td style="padding-bottom: 8px; color: #0f172a; text-align: right;">${projectName}</td>
          </tr>
          <tr>
            <td>Deadline</td>
            <td style="color: #ef4444; text-align: right;">${deadline || 'ASAP'}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center;">
        <a href="${formLink}" style="display: inline-block; background-color: #0f172a; color: white; padding: 18px 32px; border-radius: 14px; font-size: 12px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 2px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">Enter Assessment Portal</a>
      </div>

      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 40px 0;">
      <p style="font-size: 10px; color: #94a3b8; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
        © 2025 LabGen Studio | Powered by Gemini Neural Infrastructure
      </p>
    </div>
  `;

  const emailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    '',
    htmlBody
  ].join('\r\n');

  const raw = base64UrlEncodeMessage(emailLines);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gmail API error: ${res.status}`);
  }
};