import nodemailer from "nodemailer";

export const sendEmailWithAttachmentFile = async ({
  to,
  subject,
  text,
  filePath,
  filename,
}) => {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.SENDER_MAIL,
    to,
    subject,
    text,
    attachments: [
      {
        filename: filename,
        path: filePath,
      },
    ],
  });
};
