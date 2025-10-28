const { getDb } = require("../Config/db.config.js");
const axios = require("axios");
const fs = require("fs");

exports.addInsuranceInquiry = async (req, res) => {
  const db = getDb();

  try {
    const {
      name,
      mobile,
      email,
      make,
      model,
      variant,
      rto_location,
      fuel_type,
      existing_insurance_company,
      ncb_expiring_policy,
      idv,
      claim_status,
    } = req.body;

    // ✅ Validate required fields
    if (
      !name ||
      !mobile ||
      !email ||
      !make ||
      !model ||
      !variant ||
      !rto_location ||
      !fuel_type ||
      !existing_insurance_company ||
      !ncb_expiring_policy ||
      !idv ||
      !claim_status
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All required fields must be filled" });
    }

    // ✅ Handle uploaded policy file (optional)
    let fileData = null;
    if (req.file) {
      fileData = fs.readFileSync(req.file.path);
      fs.unlink(req.file.path, () => {}); // cleanup temp file
    }

    // ✅ Save inquiry in database
    const [result] = await db.query(
      `INSERT INTO insurance_inquiries
       (name, mobile, email, make, model, variant, rto_location, fuel_type,
        existing_insurance_company, ncb_expiring_policy, idv, claim_status, policy_copy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        mobile,
        email,
        make,
        model,
        variant,
        rto_location,
        fuel_type,
        existing_insurance_company,
        ncb_expiring_policy,
        idv,
        claim_status,
        fileData,
      ]
    );

    // ✅ WhatsApp Template Payload
    const whatsappPayload = {
      messaging_product: "whatsapp",
      to: `91${mobile}`, // recipient (user)
      type: "template",
      template: {
        name: "carinsurancev1", // new approved template
        language: { code: "en", policy: "deterministic" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: name },
              { type: "text", text: name },
              { type: "text", text: mobile },
              { type: "text", text: email },
              { type: "text", text: make },
              { type: "text", text: model },
              { type: "text", text: variant },
              { type: "text", text: rto_location },
              { type: "text", text: fuel_type },
              { type: "text", text: existing_insurance_company },
              { type: "text", text: ncb_expiring_policy },
              { type: "text", text: idv },
              { type: "text", text: claim_status },
            ],
          },
        ],
      },
    };

    // ✅ Send WhatsApp message to user
    const responseUser = await axios.post(
      "https://api.dovesoft.io/REST/directApi/message",
      whatsappPayload,
      {
        headers: {
          wabaNumber: `${process.env.WABA_NUMBER}`,
          Key: "2142e5c136XX", // better to store securely
          "Content-Type": "application/json",
        },
      }
    );

    // ✅ Send same message to admin
    const adminNumber = process.env.ADMIN_NUMBER; // replace with your admin WhatsApp number
    const payloadAdmin = { ...whatsappPayload, to: adminNumber };

    const responseAdmin = await axios.post(
      "https://api.dovesoft.io/REST/directApi/message",
      payloadAdmin,
      {
        headers: {
          wabaNumber: `${process.env.WABA_NUMBER}`,
          Key: "2142e5c136XX",
          "Content-Type": "application/json",
        },
      }
    );

    // ✅ Respond success
    return res.status(201).json({
      success: true,
      message:
        "Insurance inquiry saved and WhatsApp messages sent successfully!",
      inquiry_id: result.insertId,
      user_whatsapp_response: responseUser.data,
      admin_whatsapp_response: responseAdmin.data,
    });
  } catch (err) {
    console.error("❌ Error occurred:", err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.response?.data || err.message,
    });
  }
};



exports.getPolicyFile = async (req, res) => {
  const db = getDb();
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      "SELECT policy_copy FROM insurance_inquiries WHERE id = ?",
      [id]
    );

    if (!rows.length || !rows[0].policy_copy)
      return res.status(404).send("No file found");

    res.setHeader("Content-Type", "application/pdf");
    res.send(rows[0].policy_copy);
  } catch (error) {
    console.error("Error fetching file:", error);
    res.status(500).json({ error: "Server error" });
  }
};
