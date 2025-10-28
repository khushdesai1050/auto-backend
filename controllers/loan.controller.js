const axios = require("axios");
const { getDb } = require("../Config/db.config.js");

exports.addLoanInquiry = async (req, res) => {
  const { name, phone, loanAmount, email, aadhar, pan, service } = req.body;

  // ✅ Basic Validation
  if (!name || !phone || !loanAmount || !email || !aadhar || !pan || !service) {
    return res.status(400).json({
      success: false,
      message: "All fields are required.",
    });
  }

  try {
    const db = getDb();

    // 1️⃣ Save to Database
    const [result] = await db.execute(
      `INSERT INTO loan_inquiries 
       (name, phone, loan_amount, email, aadhar, pan, service)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, phone, loanAmount, email, aadhar, pan, service]
    );

    // ✅ Common Template Parameters
    const templateParams = [
      { type: "text", text: name },
      { type: "text", text: phone },
      { type: "text", text: loanAmount.toString() },
      { type: "text", text: email },
      { type: "text", text: aadhar },
      { type: "text", text: pan },
      { type: "text", text: service },
    ];

    const headers = {
      wabaNumber: `${process.env.WABA_NUMBER}`,
      "Content-Type": "application/json",
      Key: "2142e5c136XX",
    };

    // 2️⃣ Send WhatsApp Notification to Team
    await axios.post(
      "https://api.dovesoft.io/REST/directApi/message",
      {
        messaging_product: "whatsapp",
        to: `${process.env.ADMIN_NUMBER}`,
        type: "template",
        template: {
          name: "loan_inquiry", // ✅ Approved Marketing Template
          language: { code: "en", policy: "deterministic" },
          components: [{ type: "BODY", parameters: templateParams }],
        },
      },
      { headers }
    );

    // 3️⃣ Send Acknowledgment Message to User
    await axios.post(
      "https://api.dovesoft.io/REST/directApi/message",
      {
        messaging_product: "whatsapp",
        to: `91${phone}`,
        type: "template",
        template: {
          name: "loan_inquiry", // ✅ Same Template for User
          language: { code: "en", policy: "deterministic" },
          components: [{ type: "BODY", parameters: templateParams }],
        },
      },
      { headers }
    );

    // ✅ Final API Response
    res.status(201).json({
      success: true,
      message: "Loan inquiry saved and WhatsApp notifications sent successfully.",
      id: result.insertId,
    });
  } catch (err) {
    console.error("❌ Error in addLoanInquiry:", err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.response?.data || err.message,
    });
  }
};
