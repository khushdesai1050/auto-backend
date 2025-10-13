require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { initializeDatabase } = require("./Config/db.config.js");

// ==================== IMPORT ROUTES ====================
const carRoutes = require("./routes/forms.route.js");
const testimonialRoutes = require("./routes/testmonials.route.js");

const app = express();
const PORT = process.env.PORT || 6000;

// -------------------- MIDDLEWARE --------------------
app.use(cors());
app.use(bodyParser.json());


// -------------------- API ROUTE --------------------
app.use("/api", carRoutes);
app.use("/api", testimonialRoutes);

// app.post("/api/inquiry", (req, res) => {
//   const { name, mobile, email, make, model, variant, service } = req.body;

//   // Basic validation
//   if (!name || !mobile || !email || !make || !model || !variant || !service) {
//     return res.status(400).json({
//       success: false,
//       message: "All fields are required",
//     });
//   }

//   // SQL query
//   const sql = `
//     INSERT INTO car_loan_inquiries 
//     (name, mobile, email, make, model, variant, service)
//     VALUES (?, ?, ?, ?, ?, ?, ?)
//   `;

//   db.query(sql, [name, mobile, email, make, model, variant, service], (err, result) => {
//     if (err) {
//       console.error("❌ Database insert failed:", err);
//       return res.status(500).json({
//         success: false,
//         message: "Database insert failed",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "✅ Inquiry saved successfully",
//       id: result.insertId,
//     });
//   });
// });

// -------------------- SERVER START --------------------
app.listen(PORT, async() => {
  initializeDatabase();
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
