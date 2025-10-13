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

    // ✅ Validation
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

    // ✅ Handle file if provided
    let fileData = null;
    if (req.file) {
      fileData = fs.readFileSync(req.file.path);
      fs.unlink(req.file.path, () => { }); // delete temp file
    }

    // ✅ Insert into database
    const [result] = await db.query(
      `INSERT INTO insurance_inquiries
       (name, mobile, email, make, model, variant, rto_location, fuel_type, existing_insurance_company, ncb_expiring_policy, idv, claim_status, policy_copy)
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

    // console.log("✅ Insurance inquiry saved with ID:", result.insertId);

    // ✅ WhatsApp message payload (adjust template name accordingly)
    const payload = {
      template: {
        components: [
          {
            type: "BODY",
            parameters: [
              { type: "text", text: name },
              { type: "text", text: mobile },
              { type: "text", text: email },
              { type: "text", text: make },
              { type: "text", text: model },
              { type: "text", text: variant },
              { type: "text", text: existing_insurance_company },
            ],
          },
        ],
        name: "insu_follow_up",
        language: { code: "en", policy: "deterministic" },
      },
      messaging_product: "whatsapp",
      to: `${mobile}`, // Always send with country code (if in India)
      type: "template",
    };


    // ✅ Send message to user
    const responseUser = await axios.post(
      "https://api.dovesoft.io/REST/directApi/message",
      payload,
      {
        headers: {
          wabaNumber: `${process.env.ADMIN_NUMBER}`,
          Key: "2142e5c136XX",
          "Content-Type": "application/json",
        },
      }
    );

    // console.log("📨 WhatsApp sent to user:", responseUser.data);

    // ✅ Send same message to admin
    const adminNumber = "919867358999"; // replace with your admin number
    const payloadAdmin = { ...payload, to: adminNumber };

    const responseAdmin = await axios.post(
      "https://api.dovesoft.io/REST/directApi/message",
      payloadAdmin,
      {
        headers: {
          wabaNumber: `${process.env.ADMIN_NUMBER}`,
          Key: "2142e5c136XX",
          "Content-Type": "application/json",
        },
      }
    );

    // console.log("📨 WhatsApp sent to admin:", responseAdmin.data);

    // ✅ Final API response
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
