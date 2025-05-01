const fs = require('fs');
const path = require('path');
const db = require('./db');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  console.log('Setting up database...');

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema queries - split by semicolon to execute each statement separately
    const queries = schema.split(';').filter(query => query.trim() !== '');

    for (const query of queries) {
      await db.query(query);
    }

    console.log('Database schema created successfully!');

    // Create a default admin user
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);

    // Check if admin exists
    const adminCheck = await db.query('SELECT * FROM users WHERE username = $1', ['admin']);

    if (adminCheck.rows.length === 0) {
      await db.query(
          'INSERT INTO users (username, email, password_hash, is_admin) VALUES ($1, $2, $3, $4)',
          ['admin', 'admin@example.com', hashedPassword, true]
      );
      console.log('Default admin user created:');
      console.log('Username: admin');
      console.log('Password: admin123');
      console.log('IMPORTANT: Change these credentials after first login!');
    } else {
      console.log('Admin user already exists, skipping creation.');
    }

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    // Close pool
    db.pool.end();
  }
}

setupDatabase();