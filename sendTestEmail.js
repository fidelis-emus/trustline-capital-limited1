import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config(); // Loads variables from .env

async function sendTestEmail() {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"Trustline Capital" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_RECEIVER_EMAIL,
      subject: "Test Email from SMTP Setup ✅",
      text: "This is a test email to verify your SMTP configuration.",
      html: "<b>This is a test email to verify your SMTP configuration.</b>",
    });

    console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

sendTestEmail();