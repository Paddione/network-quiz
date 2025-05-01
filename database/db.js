const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool to PostgreSQL
const pool = new Pool({
    user: process.env.PGUSER || 'quizadmin',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'network_quiz',
    password: process.env.PGPASSWORD || 'your_secure_password',
    port: process.env.PGPORT || 5432,
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err.stack);
    } else {
        console.log('Database connected successfully at:', res.rows[0].now);
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};