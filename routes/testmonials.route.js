const router = require("express").Router();


// Import controllers
const { addTestimonial, getAllTestimonials } = require("../controllers/testimonial.controller");

// Routes
router.post("/testimonials", addTestimonial);
router.get("/testimonials", getAllTestimonials);

module.exports = router;
