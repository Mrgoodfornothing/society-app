// backend/testEmail.js
require('dotenv').config(); // Loads variables from the .env file in the same directory
const sendEmail = require('./utils/sendEmail'); // Imports sendEmail from the utils folder

const test = async () => {
  console.log("Attempting to send a test email...");
  console.log("Using email user:", process.env.EMAIL_USER);

  try {
    await sendEmail({
      email: "your_personal_email@gmail.com", // <--- REPLACE THIS WITH YOUR REAL PERSONAL EMAIL
      subject: "Test Email from Society App",
      message: "<h1>It Works!</h1><p>This is a test email to verify the nodemailer configuration.</p>",
    });
    console.log("Test email process completed. Check your inbox!");
  } catch (error) {
    console.error("Test email failed:", error);
  }
};

test();