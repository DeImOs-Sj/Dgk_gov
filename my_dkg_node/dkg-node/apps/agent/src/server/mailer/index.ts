import nodemailer from "nodemailer";

export default async function mailer() {
  const s = globalThis as typeof globalThis & {
    mailer?: nodemailer.Transporter;
  };

  if (!s.mailer) {
    s.mailer = process.env.SMTP_HOST
      ? nodemailer.createTransport({
          from: process.env.SMTP_FROM,
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: (process.env.SMTP_SECURE || "true") === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        })
      : process.env.NODE_ENV === "development"
        ? await nodemailer.createTestAccount().then((a) =>
            nodemailer.createTransport({
              ...a.smtp,
              auth: { user: a.user, pass: a.pass },
              from: "Example <no-reply@example.com>",
            }),
          )
        : undefined;
  }

  return s.mailer;
}
