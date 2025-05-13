

const mysql = require('mysql2');   // For database connection


const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost', // Default: localhost
    user: process.env.DB_USER || 'root',     // Default user: root
    password: process.env.DB_PASSWORD || 'fast1234', // Set this in .env file
    database: process.env.DB_NAME || 'kashan', 
  });
  
  // Test Database Connection
  db.connect((err) => {
    if (err) {
      console.error('Database connection failed:', err.message);
      process.exit(1);
    }
    console.log('Connected to the MySQL database!');
  });

  module.exports = db


