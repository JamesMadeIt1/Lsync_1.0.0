const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    throw new Error(
      'GMAIL_USER and GMAIL_APP_PASSWORD must be configured'
    );
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD
      }
    });
  }

  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (!to || !subject || (!text && !html)) {
    throw new TypeError('Email recipient, subject, and content are required');
  }

  return getTransporter().sendMail({
    from: `"LSync" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    text,
    html
  });
};

module.exports = { sendEmail };
