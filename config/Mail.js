const SibApiV3Sdk = require("sib-api-v3-sdk");
require("dotenv").config();

let defaultClient = SibApiV3Sdk.ApiClient.instance;
let apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendMail = async (to, otp) => {
  try {
    await apiInstance.sendTransacEmail({
      sender: {
        email: "lakshyajain459@gmail.com",  // You can keep using your Gmail
        name: "StaySphere"
      },
      to: [{
        email: to
      }],
      subject: "Your StaySphere OTP Verification Code",
      htmlContent: `
        <div style="font-family: Arial; padding:20px;">
          <h2 style="color:#156ef3;">StaySphere Email Verification</h2>
          <p>Your OTP is:</p>
          <h1 style="letter-spacing:4px; color:#156ef3;">${otp}</h1>
          <p>This OTP is valid for <b>5 minutes</b>. Do not share it with anyone.</p>
        </div>
      `
    });

    console.log("📧 OTP sent to:", to);

  } catch (error) {
    console.error(" Brevo Email Error:", error.message);
  }
}

module.exports = sendMail;
