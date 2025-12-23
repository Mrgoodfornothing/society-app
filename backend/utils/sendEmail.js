const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Create a simple text version from the HTML message (stripping tags roughly)
  const textMessage = options.message.replace(/<[^>]*>?/gm, '');

  const mailOptions = {
    from: `"Society Connect Support" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,      // HTML version
    text: textMessage           // Plain text fallback (Helps with Gmail delivery)
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;