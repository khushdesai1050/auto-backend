const { getDb } = require("../Config/db.config.js");

exports.addSellCarLead = async (req, res) => {
  const db = getDb();
  try {
    const {
      car_model, make_year, owner, color, km_driven, city,
      registration_no, registration_location, estimated_price,
      registration_type, insurance_valid_till, is_accidental,
      is_flood_affected, safety_security_features, comfort_convenience_features,
      other_features, air_conditioning, battery_condition, brakes_condition,
      car_electricals, car_engine, seat_condition, suspensions,
      tyres_condition, interior_condition, exterior_condition, overall_condition,
      available_warranty, major_modifications, special_note,
      name, mobile, email
    } = req.body;

    // ✅ Basic validation
    if (!name || !mobile || !email || !car_model) {
      return res.status(400).json({ success: false, message: "Required fields missing." });
    }

    // ✅ Corrected insert query (33 columns = 33 values)
    const [result] = await db.query(
      `INSERT INTO sell_car_leads (
        car_model, make_year, owner, color, km_driven, city,
        registration_no, registration_location, estimated_price,
        registration_type, insurance_valid_till, is_accidental, is_flood_affected,
        safety_security_features, comfort_convenience_features, other_features,
        air_conditioning, battery_condition, brakes_condition, car_electricals,
        car_engine, seat_condition, suspensions, tyres_condition,
        interior_condition, exterior_condition, overall_condition,
        available_warranty, major_modifications, special_note,
        name, mobile, email
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        car_model, make_year, owner, color, km_driven, city,
        registration_no, registration_location, estimated_price,
        registration_type, insurance_valid_till, is_accidental, is_flood_affected,
        JSON.stringify(safety_security_features || []),
        JSON.stringify(comfort_convenience_features || []),
        JSON.stringify(other_features || []),
        air_conditioning, battery_condition, brakes_condition, car_electricals,
        car_engine, seat_condition, suspensions, tyres_condition,
        interior_condition, exterior_condition, overall_condition,
        available_warranty, major_modifications, special_note,
        name, mobile, email
      ]
    );

    res.status(201).json({
      success: true,
      message: "Car details submitted successfully!",
      lead_id: result.insertId,
    });
  } catch (error) {
    console.error("❌ Error saving car details:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
