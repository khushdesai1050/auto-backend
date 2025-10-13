const axios = require("axios");
const { getDb } = require("../Config/db.config.js");

exports.addLoanInquiry = async (req, res) => {
  try {
    const db = getDb();
    const { name, phone, loanAmount, email, aadhar, pan, service } = req.body;

    // Basic validation
    if (!name || !phone || !loanAmount || !email || !aadhar || !pan || !service) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Insert into DB
    const query = `
      INSERT INTO loan_inquiries 
      (name, phone, loan_amount, email, aadhar, pan, service)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [name, phone, loanAmount, email, aadhar, pan, service]);

    // Prepare parameters for WhatsApp templates
    const templateParams = [
      { type: "text", text: name },
      { type: "text", text: phone },
      { type: "text", text: loanAmount.toString() },
      { type: "text", text: email },
      { type: "text", text: aadhar },
      { type: "text", text: pan },
      { type: "text", text: service }
    ];

    const whatsappHeaders = {
      "wabaNumber": `${process.env.ADMIN_NUMBER}`,
      "Key": "2142e5c136XX",
      "Content-Type": "application/json",
      "Cookie": "JSESSIONID=3C793A1E7BFBCCC004FBB9130D6547CD"
    };

    // 1️⃣ Send first WhatsApp message (details_confirm)
    await axios.post(
      "https://api.dovesoft.io/REST/directApi/message",
      {
        messaging_product: "whatsapp",
        to: '919867358999', // Admin number
        type: "template",
        template: {
          name: "details_confirm",
          language: { code: "en", policy: "deterministic" },
          components: [{ type: "body", parameters: templateParams }]
        }
      },
      { headers: whatsappHeaders }
    );

    // 2️⃣ Send second WhatsApp message (detail_followup)
    await axios.post(
      "https://api.dovesoft.io/REST/directApi/message",
      {
        messaging_product: "whatsapp",
        to: `91${phone}`, // User number
        type: "template",
        template: {
          name: "detail_followup",
          language: { code: "en", policy: "deterministic" },
          components: [{ type: "body", parameters: [{ type: "text", text: name }] }]
        }
      },
      { headers: whatsappHeaders }
    );

    // Respond to API request
    res.status(200).json({
      success: true,
      message: "Inquiry saved and WhatsApp messages sent successfully",
      id: result.insertId
    });

  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
