const https = require('https');

/**
 * Send a transactional email via Brevo (Sendinblue) REST API
 * Uses native https — no extra packages needed.
 *
 * Docs: https://developers.brevo.com/reference/sendtransacemail
 */
const sendBrevoEmail = ({ to, subject, htmlContent }) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      sender: {
        name: 'Auth System',
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [{ email: to }],
      subject,
      htmlContent,
    });

    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Brevo API error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

/**
 * Send a password reset email with a secure token link
 * @param {string} toEmail - Recipient email
 * @param {string} resetToken - The raw (unhashed) reset token
 */
const sendResetEmail = async (toEmail, resetToken) => {
  const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const expiryMinutes = process.env.RESET_TOKEN_EXPIRY_MINUTES || 15;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="margin:0;padding:0;background-color:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
      <table role="presentation" style="width:100%;border-collapse:collapse;">
        <tr>
          <td align="center" style="padding:40px 0;">
            <table role="presentation" style="width:560px;max-width:100%;border-collapse:collapse;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:16px;overflow:hidden;border:1px solid rgba(99,102,241,0.3);">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
                  <div style="font-size:40px;margin-bottom:12px;">🔐</div>
                  <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Password Reset</h1>
                  <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Auth System Security</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:36px 40px;">
                  <p style="color:#c4c4d4;font-size:15px;line-height:1.7;margin:0 0 24px;">
                    Hello,<br><br>
                    We received a request to reset your password. Click the button below to create a new one.
                    This link will expire in <strong style="color:#a78bfa;">${expiryMinutes} minutes</strong>.
                  </p>
                  <div style="text-align:center;margin:32px 0;">
                    <a href="${resetURL}"
                       style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:50px;font-size:16px;font-weight:600;letter-spacing:0.5px;box-shadow:0 4px 15px rgba(99,102,241,0.4);">
                      Reset My Password
                    </a>
                  </div>
                  <p style="color:#888;font-size:13px;line-height:1.6;margin:24px 0 0;border-top:1px solid rgba(255,255,255,0.08);padding-top:24px;">
                    If you didn't request this, please ignore this email — your account is safe.<br><br>
                    Or copy this link:<br>
                    <a href="${resetURL}" style="color:#6366f1;word-break:break-all;font-size:12px;">${resetURL}</a>
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding:16px 40px 28px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
                  <p style="color:#555;font-size:12px;margin:0;">
                    © ${new Date().getFullYear()} Auth System · Sent via Brevo
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await sendBrevoEmail({
    to: toEmail,
    subject: '🔐 Password Reset Request — Auth System',
    htmlContent,
  });
};

module.exports = { sendResetEmail };
