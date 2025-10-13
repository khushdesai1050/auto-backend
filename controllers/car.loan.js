const axios = require("axios");
const { getDb } = require("../Config/db.config.js");

exports.addCarLoanLead = async (req, res) => {
  try {
    const { name, mobile, email, make, model, variant, service } = req.body;
    const db = getDb();

    // DB connection check
    if (!db) {
      return res.status(500).json({
        success: false,
        message: "Database not initialized",
      });
    }

    // Input validation
    if (!name || !mobile || !email || !make || !model || !variant || !service) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Insert into MySQL
    const [result] = await db.query(
      `INSERT INTO car_loan_inquiries 
       (name, mobile, email, make, model, variant, service)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, mobile, email, make, model, variant, service]
    );

    console.log("Inquiry saved with ID:", result.insertId);

    // WhatsApp template parameters (MUST match your Dovesoft template placeholders)
    const parameters = [
      { type: "text", text: String(name).trim() },     // {{1}}
      { type: "text", text: String(mobile).trim() },   // {{2}}
      { type: "text", text: String(email).trim() },    // {{3}}
      { type: "text", text: String(make).trim() },     // {{4}}
      { type: "text", text: String(model).trim() },    // {{5}}
      { type: "text", text: String(variant).trim() },  // {{6}}
      { type: "text", text: String(service).trim() },  // {{7}}
    ];

    // WhatsApp send function
    const sendWhatsApp = async (toNumber) => {
      const payload = {
        template: {
          components: [
            {
              type: "BODY",
              parameters,
            },
          ],
          name: "loan_follow_up",
          language: { code: "en", policy: "deterministic" },
        },
        messaging_product: "whatsapp",
        to: toNumber,
        type: "template",
      };

      console.log(`Sending WhatsApp to ${toNumber} with payload:`, payload);

      try {
        const response = await axios.post(
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
        return response.data;
      } catch (err) {
        console.error(`❌ WhatsApp API Error for ${toNumber}:`, err.response?.data || err.message);
        return { error: err.response?.data || err.message };
      }
    };

    // Send WhatsApp to user
    const userResponse = await sendWhatsApp(`91${mobile}`);

    // Send WhatsApp to admin
    const adminNumber = "919867358999";
    const adminResponse = await sendWhatsApp(adminNumber);

    // Final response
    return res.status(200).json({
      success: true,
      message: "Inquiry saved and WhatsApp messages sent successfully",
      id: result.insertId,
      user_whatsapp_response: userResponse,
      admin_whatsapp_response: adminResponse,
    });

  } catch (error) {
    console.error("❌ Server Error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.response?.data || error.message,
    });
  }
};

exports.addLead = async (req, res) => {
  try {
    const { name, number, service } = req.body;

    if (!name || !number || !service) {
      return res.status(400).json({ success: false, message: "All fields are required!" });
    }

    // Insert lead into database
    const db = getDb();
    const query = "INSERT INTO leads (name, number, service) VALUES (?, ?, ?)";
    const [result] = await db.execute(query, [name, number, service]);
    const leadId = result.insertId;

    // Prepare WhatsApp API config
    const headers = {
      "wabaNumber": `${process.env.ADMIN_NUMBER}`,
      "Key": "2142e5c136XX",
      "Content-Type": "application/json",
      "Cookie": "JSESSIONID=26CF04555248071895977A5898BD4FBC"
    };

    // 1️⃣ Notify admin/team
    const adminPayload = {
      template: {
        name: "home_page_lead",
        language: { code: "en", policy: "deterministic" },
        components: [
          {
            type: "BODY",
            parameters: [
              { type: "text", text: name },
              { type: "text", text: number },
              { type: "text", text: service }
            ]
          }
        ]
      },
      messaging_product: "whatsapp",
      to: "919867358999", // Admin/Team number
      type: "template"
    };

    // 2️⃣ Thank the user
    const userPayload = {
      template: {
        name: "us_homepagelead",
        language: { code: "en", policy: "deterministic" },
        components: [
          {
            type: "BODY",
            parameters: [
              { type: "text", text: name },
              { type: "text", text: service }
            ]
          }
        ]
      },
      messaging_product: "whatsapp",
      to: `91${number}`,
      type: "template"
    };

    // Send both messages
    const [adminResponse, userResponse] = await Promise.all([
      axios.post("https://api.dovesoft.io/REST/directApi/message", adminPayload, { headers }),
      axios.post("https://api.dovesoft.io/REST/directApi/message", userPayload, { headers })
    ]);

    res.json({
      success: true,
      message: "Inquiry saved and WhatsApp messages sent successfully",
      id: leadId,
      admin_whatsapp_response: adminResponse.data,
      user_whatsapp_response: userResponse.data
    });

  } catch (error) {
    console.error("Error inserting data or sending WhatsApp:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// exports.contactUs = async (req, res) => {
//   const { name, email, phone } = req.body;

//   if (!name || !email || !phone) {
//     return res.status(400).json({ error: "Name, email, and phone are required" });
//   }

//   try {
//     const db = getDb();
//     const [result] = await db.execute(
//       "INSERT INTO contact_us (name, email, phone) VALUES (?, ?, ?)",
//       [name, email, phone]
//     );

//     res.status(201).json({ message: "User added successfully", id: result.insertId });
//   } catch (err) {
//     console.error("❌ Error inserting user:", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

exports.contactUs = async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res
      .status(400)
      .json({ error: "Name, email, and phone are required" });
  }

  try {
    // 1️⃣ Save to Database
    const db = getDb();
    const [result] = await db.execute(
      "INSERT INTO contact_us (name, email, phone) VALUES (?, ?, ?)",
      [name, email, phone]
    );

    // 2️⃣ Send Template to Team
    await axios.post(
      "https://api.dovesoft.io/REST/directApi/message",
      {
        template: {
          name: "contact_us_feed", // ✅ Team template
          language: { code: "en", policy: "deterministic" },
          components: [
            {
              type: "BODY",
              parameters: [
                { type: "text", text: name },  // {{1}}
                { type: "text", text: phone }, // {{2}}
                { type: "text", text: email }  // {{3}}
              ]
            }
          ],
        },
        messaging_product: "whatsapp",
        to: "919867358999", // ✅ Team member number
        type: "template",
      },
      {
        headers: {
          wabaNumber: `${process.env.ADMIN_NUMBER}`,
          Key: "2142e5c136XX",
          "Content-Type": "application/json",
        }
      }
    );

    // 3️⃣ Send Acknowledgment to User
    await axios.post(
      "https://api.dovesoft.io/REST/directApi/message",
      {
        template: {
          name: "contact_us_user", // ✅ User template
          language: { code: "en", policy: "deterministic" },
          components: [
            {
              type: "BODY",
              parameters: [
                { type: "text", text: name } // {{1}}
              ]
            }
          ],
        },
        messaging_product: "whatsapp",
        to: phone, // ✅ Sends to user
        type: "template",
      },
      {
        headers: {
          wabaNumber: `${process.env.ADMIN_NUMBER}`,
          Key: "2142e5c136XX",
          "Content-Type": "application/json",
        }
      }
    );

    // ✅ Final Response
    res
      .status(201)
      .json({ message: "User added & notifications sent", id: result.insertId });

  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.saveWhatsAppLead = async (req, res) => {
  try {
    const { name, mobile_number, aadhar_number, pan_number, service } = req.body;

    // Basic validation
    if (!name || !mobile_number) {
      return res.status(400).json({ message: "Name and Mobile Number are required." });
    }

    const db = getDb();

    // ✅ Insert query
    await db.query(
      `INSERT INTO whatsapp_leads 
       (name, mobile_number, aadhar_number, pan_number, service) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, mobile_number, aadhar_number || null, pan_number || null, service || null]
    );

    res.status(201).json({ message: "Lead saved successfully!" });
  } catch (err) {
    console.error("❌ Error while saving lead:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};