const nodemailer = require('nodemailer');

/**
 * Nodemailer Transporter Utility Configured for Gmail Service
 * Requires EMAIL_USER and EMAIL_PASS environment variables in .env
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send Email helper function
 * @param {Object} options - { email, subject, message, html }
 */
const sendEmail = async (options) => {
  const mailOptions = {
    from: `"APEX ESPORTS" <${process.env.EMAIL_USER || 'noreply@esports.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || `<p>${options.message}</p>`,
  };

  // If email environment variables are missing (local dev fallback), log OTP to console cleanly
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`\n==================================================`);
    console.log(`📧 [EMAIL OTP SIMULATION] To: ${options.email}`);
    console.log(`📌 Subject: ${options.subject}`);
    console.log(`🔑 Content: ${options.message}`);
    console.log(`==================================================\n`);
    return { success: true, devMode: true };
  }

  return await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
