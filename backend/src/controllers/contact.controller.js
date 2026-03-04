const sendMail = require("../services/mail");

exports.sendContactMail = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ message: 'All fields required' });

    const to = process.env.MAIL_USER; // site admin
    const subject = `Contact form: ${name} <${email}>`;
    const text = `From: ${name} <${email}>\n\n${message}`;

    await sendMail(to, subject, text);

    res.json({ message: 'Message sent' });
  } catch (err) {
    console.error('Contact mail error', err);
    res.status(500).json({ message: 'Failed to send message' });
  }
};
