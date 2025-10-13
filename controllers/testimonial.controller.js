const { getDb } = require("../Config/db.config");

exports.addTestimonial = async (req, res) => {
  try {
    const { name, city, rating, feedback } = req.body;

    // console.log("req.body", req.body);

    // Validation
    if (!name || !city || !rating || !feedback) {
      return res.status(400).json({
        success: false,
        message: "All fields (name, city, rating, feedback) are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // console.log("Inserting testimonial into database...");

    const db = getDb();
    const sql = "INSERT INTO testimonials (name, city, rating, feedback) VALUES (?, ?, ?, ?)";

    const [result] = await db.query(sql, [name, city, rating, feedback]);

    // console.log("Testimonial inserted with ID:", result.insertId);

    res.status(201).json({
      success: true,
      message: "Testimonial added successfully",
      testimonialId: result.insertId,
    });
  } catch (err) {
    // console.error("Error inserting testimonial:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
};


// 📜 Get All Testimonials
exports.getAllTestimonials = async (req, res) => {
  try {
    const db = getDb();
    const sql = "SELECT * FROM testimonials ORDER BY created_at DESC";

    // mysql2/promise returns [rows, fields]
    const [results] = await db.query(sql);

    res.json({
      success: true,
      count: results.length,
      testimonials: results,
    });
  } catch (err) {
    // console.error("Error fetching testimonials:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
};
