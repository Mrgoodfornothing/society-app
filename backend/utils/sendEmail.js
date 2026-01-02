const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // Create Transporter with explicit SMTP settings
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',  // Explicit host
      port: 465,               // Secure port for SSL
      secure: true,            // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // MUST be an App Password, not login password
      },
    });

    // Verify connection configuration
    await new Promise((resolve, reject) => {
      transporter.verify(function (error, success) {
        if (error) {
          console.log("❌ SMTP Connection Error:", error);
          reject(error);
        } else {
          console.log("✅ SMTP Server is ready to take our messages");
          resolve(success);
        }
      });
    });

    // Create a simple text version from the HTML message
    const textMessage = options.message ? options.message.replace(/<[^>]*>?/gm, '') : "No text content";

    const mailOptions = {
      from: `"Society Connect Support" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.message,
      text: textMessage
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Email sent: %s", info.messageId);
    return info;

  } catch (error) {
    console.error("❌ Send Email Function Error:", error);
    // We don't throw here to avoid crashing the whole payment flow, 
    // but in a real app you might want to handle this.
  }
};

module.exports = sendEmail;