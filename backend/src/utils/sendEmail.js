import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ✅ FIXED TRANSPORTER (more stable)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

export const sendOTP = async (email, otp, name) => {
  try {
    // ✅ DEBUG (IMPORTANT - will show in Render logs)
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded ✅" : "Missing ❌");

    const mailOptions = {
      from: `"PriceCompare" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - PriceCompare',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial;">
          <h2>Hello ${name || 'User'},</h2>
          <p>Your OTP is:</p>
          <h1 style="letter-spacing:5px; color:#667eea;">${otp}</h1>
          <p>This OTP is valid for 5 minutes.</p>
          <br/>
          <p>If you didn’t request this, ignore this email.</p>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully:', info.messageId);

    return { success: true };

  } catch (error) {
    console.error('❌ Email error:', error);

    // ✅ IMPORTANT: don't break registration
    return { success: false };
  }
};

export default transporter;