import crypto from "crypto";
import nodemailer from "nodemailer";

export interface EmailConfig {
  from: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpUrl?: string;
}

function getEmailConfig(): EmailConfig | null {
  const from = process.env.EMAIL_FROM;
  const smtpUrl = process.env.EMAIL_SERVER;
  const smtpHost = process.env.EMAIL_SERVER_HOST;
  const smtpPort = process.env.EMAIL_SERVER_PORT ? Number(process.env.EMAIL_SERVER_PORT) : undefined;
  const smtpUser = process.env.EMAIL_SERVER_USER;
  const smtpPass = process.env.EMAIL_SERVER_PASS;

  if (!from) return null;

  if (smtpUrl) {
    return { from, smtpUrl };
  }

  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    return { from, smtpHost, smtpPort, smtpUser, smtpPass };
  }

  return null;
}

function buildTransport(config: EmailConfig) {
  if (config.smtpUrl) {
    return nodemailer.createTransport(config.smtpUrl);
  }

  const secure = config.smtpPort === 465;
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });
}

export async function sendAuthEmail(
  email: string,
  code: string,
  magicLinkToken: string,
  baseUrl: string
): Promise<boolean> {
  const magicLink = `${baseUrl}/auth/magic?token=${magicLinkToken}`;

  const config = getEmailConfig();
  if (!config) {
    const message = "SMTP não configurado. Configure EMAIL_FROM e EMAIL_SERVER* no .env";
    if (process.env.NODE_ENV === "production") {
      console.error(message);
      return false;
    }
    console.warn(message);
    console.log("=== AUTH EMAIL (DEV FALLBACK) ===");
    console.log(`To: ${email}`);
    console.log(`Code: ${code}`);
    console.log(`Magic Link: ${magicLink}`);
    console.log("=================================");
    return true;
  }

  try {
    const transporter = buildTransport(config);
    const subject = "Seu acesso ao Salva Plantão";
    const text = `Seu código de acesso é: ${code}\n\nOu clique no link mágico: ${magicLink}\n\nSe você não solicitou, ignore este email.`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin: 0 0 12px;">Seu acesso ao Salva Plantão</h2>
        <p>Use o código abaixo para entrar:</p>
        <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 8px 0;">${code}</div>
        <p>Ou clique no link mágico:</p>
        <p><a href="${magicLink}" style="color: #2563eb;">Entrar com link mágico</a></p>
        <p style="font-size: 12px; color: #6b7280;">Se você não solicitou, ignore este email.</p>
      </div>
    `;

    await transporter.sendMail({
      from: config.from,
      to: email,
      subject,
      text,
      html,
    });

    return true;
  } catch (error) {
    console.error("Falha ao enviar email de autenticação:", error);
    return false;
  }
}

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
