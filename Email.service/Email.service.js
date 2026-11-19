import nodemailer from "nodemailer";
import "dotenv/config";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Uses STARTTLS encryption on port 587
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Optional: Verify SMTP connection on server startup
transporter.verify((error) => {
  if (error) {
    console.error("Gmail SMTP connection failed:", error);
  } else {
    console.log("Gmail SMTP server is ready to send emails");
  }
});
