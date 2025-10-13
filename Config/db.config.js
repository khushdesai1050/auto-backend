// db.config.js
const mysql = require("mysql2/promise"); // ✅ promise-based

let db;

async function initializeDatabase() {
  db = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  console.log("✅ Connected to MySQL Database");
}

function getDb() {
  if (!db) throw new Error("Database not initialized!");
  return db; // Already promise-based
}

module.exports = { initializeDatabase, getDb };
