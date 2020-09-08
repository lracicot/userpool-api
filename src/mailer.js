import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_ADDRESS,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export default (to, subject, html) => transporter.sendMail({
  from: process.env.SMTP_FROM, to, subject, html,
});
