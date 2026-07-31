// Same pattern as the Quiz Maker's db.js - one shared connection pool.
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.on('connect', () => {
  console.log('Connected to Postgres (Supabase)');
});

pool.on('error', (err) => {
  console.error('Unexpected database error', err);
});

module.exports = { pool };
