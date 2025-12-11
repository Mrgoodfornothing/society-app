const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Create the Transporter (The Service)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 2. Define the Email
  const mailOptions = {
    from: `"Society Connect Support" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message, // HTML body
  };

  // 3. Send it
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;