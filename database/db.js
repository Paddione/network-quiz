const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool to PostgreSQL
const pool = new Pool({
    user: process.env.PGUSER || 'quizadmin',
    host: process.env.PGHOST || '172.17.0.1',
    database: process.env.PGDATABASE || 'network_quiz',
    password: process.env.PGPASSWORD || '170591pk',
    port: process.env.PGPORT || 5432,
});

// Function to test database connection with retries
async function testConnection(maxRetries = 5) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const res = await pool.query('SELECT NOW()');
            console.log('Database connected successfully at:', res.rows[0].now);
            return true;
        } catch (err) {
            console.error(`Database connection attempt ${i + 1}/${maxRetries} failed:`, err.message);
            if (i < maxRetries - 1) {
                console.log('Retrying in 5 seconds...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }
    throw new Error('Failed to connect to database after multiple attempts');
}

// Export the connection pool and test function
module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
    testConnection
};