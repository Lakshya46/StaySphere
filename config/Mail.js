const nodemailer = require("nodemailer");
require("dotenv").config();

// Create a reusable transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

// Main sendMail Function
const sendMail = async (to, otp) => {
  try {
    const mailOptions = {
      from: `"StaySphere" <${process.env.EMAIL}>`,
      to,
      subject: "Your StaySphere OTP Verification Code",
      html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f7f7f7;">
        <div style="max-width: 500px; margin: auto; background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">

          <h2 style="color: #156ef3; text-align: center; margin-bottom: 10px;">
            StaySphere Verification
          </h2>

          <p style="font-size: 16px; color: #444;">
            Your One-Time Password (OTP) for signup verification is:
          </p>

          <div style="text-align: center; margin: 25px 0;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #156ef3;">
              ${otp}
            </span>
          </div>

          <p style="font-size: 15px; color: #666;">
            This OTP is valid for <b>5 minutes</b>. Please do not share it with anyone.
          </p>

          <hr style="margin: 25px 0;" />

          <p style="font-size: 13px; color: #999; text-align: center;">
            If you did not request this verification, please ignore this message.
          </p>

        </div>
      </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("OTP email sent →", to);

  } catch (error) {
    console.error("Email sending error:", error.message);
  }
};

// Export Function
module.exports = sendMail;
