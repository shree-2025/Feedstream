import nodemailer from 'nodemailer';

let transporter = null;

function pickEnv() {
  // Prefer SMTP_* variables; fall back to MAIL_* variables as provided by user
  const host = process.env.SMTP_HOST || process.env.MAIL_HOST;
  const portRaw = process.env.SMTP_PORT || process.env.MAIL_PORT;
  const user = process.env.SMTP_USER || process.env.MAIL_USERNAME || process.env.MAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.MAIL_PASSWORD || process.env.MAIL_PASS;
  const fromDirect = process.env.MAIL_FROM;
  const fromAddr = process.env.MAIL_FROM_ADDRESS || user;
  const fromName = process.env.MAIL_FROM_NAME;
  const port = portRaw ? Number(portRaw) : undefined;
  const secure = port === 465; // SSL
  const from = fromDirect || (fromName ? `${fromName} <${fromAddr}>` : fromAddr);
  return { host, port, secure, user, pass, from };
}

export async function getTransporter() {
  if (transporter) return transporter;
  const cfg = pickEnv();
  if (!cfg.host || !cfg.port || !cfg.user || !cfg.pass) {
    console.warn('[mailer] SMTP not fully configured. Emails will be logged to console.');
    return null;
  }
  
  const transportConfig = {
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    tls: {
      // Do not fail on invalid certificates (for self-signed certs)
      rejectUnauthorized: false
    }
  };

  transporter = nodemailer.createTransport(transportConfig);

  // Verify connection configuration
  try {
    await transporter.verify();
    console.log('SMTP server is ready to take our messages');
  } catch (error) {
    console.error('SMTP server connection failed:', error);
  }
  return transporter;
}

export async function sendMail({ to, subject, text, html }) {
  try {
    const t = await getTransporter();
    if (!t) {
      console.info('[mailer:FALLBACK]', { to, subject, text });
      return { queued: false, fallback: true };
    }
    const { from } = pickEnv();
    const info = await t.sendMail({ from, to, subject, text, html });
    console.log('Email sent successfully:', info.messageId);
    return { queued: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { queued: false, error: error.message };
  }
}
