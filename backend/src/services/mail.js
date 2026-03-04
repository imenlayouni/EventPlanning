const nodemailer = require("nodemailer");

module.exports = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"Axia Event Planner" <${process.env.MAIL_USER}>`,
    to,
    subject,
    text
  });
};
