const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');

// Add this database connectivity check
db.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Auth module - Database connectivity issue:', err.stack);
    } else {
        console.log('Auth module - Database connected successfully at:', res.rows[0].now);
    }
});

// Helper function to check if user is authenticated
function isAuthenticated(req, res, next) {
    console.log('isAuthenticated check - User in session:', req.session.user ? req.session.user.username : 'none');
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
}

// Helper function to check if user is admin
function isAdmin(req, res, next) {
    console.log('isAdmin check - User in session:', req.session.user ? `${req.session.user.username} (admin: ${req.session.user.is_admin})` : 'none');
    if (req.session.user && req.session.user.is_admin) {
        return next();
    }
    res.status(403).redirect('/login?error=access_denied');
}

// Login page
router.get('/login', (req, res) => {
    console.log('GET /login - Session ID:', req.session.id);
    res.sendFile('login.html', { root: './public' });
});

// Registration page
router.get('/register', (req, res) => {
    console.log('GET /register - Session ID:', req.session.id);
    res.sendFile('register.html', { root: './public' });
});

// Process login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt for user: ${username}, Session ID: ${req.session.id}`);

    try {
        // Find user
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        console.log(`DB query returned ${result.rows.length} rows`);

        if (result.rows.length === 0) {
            console.log(`User ${username} not found in database`);
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user = result.rows[0];
        console.log(`User found in DB: ${user.username}, is_admin: ${user.is_admin}`);
        console.log(`Password hash in DB: ${user.password_hash.substring(0, 20)}...`);

        // Check password
        console.log(`Attempting to compare password with hash`);
        const isMatch = await bcrypt.compare(password, user.password_hash);
        console.log(`Password comparison result: ${isMatch}`);

        if (!isMatch) {
            console.log(`Invalid password for user ${username}`);
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Set session
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            is_admin: user.is_admin
        };
        console.log(`Session set for user ${username}:`, req.session.user);

        // Redirect based on role
        if (user.is_admin) {
            console.log(`Admin user ${username} redirecting to /admin`);
            res.json({ success: true, redirect: '/admin' });
        } else {
            console.log(`Regular user ${username} redirecting to /`);
            res.json({ success: true, redirect: '/lobby' });
        }

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Process registration
router.post('/register', async (req, res) => {
    const { username, email, password, password_confirm } = req.body;
    console.log(`Registration attempt for user: ${username}, email: ${email}, Session ID: ${req.session.id}`);

    // Basic validation
    if (!username || !email || !password) {
        console.log('Registration failed: Missing required fields');
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== password_confirm) {
        console.log('Registration failed: Passwords do not match');
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    try {
        // Check if username or email already exists
        const checkResult = await db.query(
            'SELECT * FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        console.log(`User existence check returned ${checkResult.rows.length} rows`);

        if (checkResult.rows.length > 0) {
            console.log('Registration failed: Username or email already exists');
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password
        console.log('Hashing password...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log(`Password hashed successfully: ${hashedPassword.substring(0, 20)}...`);

        // Create user
        const result = await db.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hashedPassword]
        );

        console.log('User created successfully');
        const user = result.rows[0];

        // Set session
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            is_admin: false
        };
        console.log(`Session set for new user ${username}:`, req.session.user);

        res.json({ success: true, redirect: '/' });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    console.log(`Logout request for user: ${req.session.user ? req.session.user.username : 'unknown'}`);
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        } else {
            console.log('Session destroyed successfully');
        }
        res.redirect('/login');
    });
});

// User profile
router.get('/profile', isAuthenticated, (req, res) => {
    console.log(`Profile access for user: ${req.session.user.username}`);
    res.sendFile('profile.html', { root: './public' });
});

// Get user data (for profile page)
router.get('/api/user', isAuthenticated, (req, res) => {
    console.log(`API user data request for: ${req.session.user.username}`);
    res.json(req.session.user);
});

// Get user highscores
router.get('/api/user/highscores', isAuthenticated, async (req, res) => {
    console.log(`Highscores request for user: ${req.session.user.username}`);
    try {
        const userId = req.session.user.id;

        const result = await db.query(
            `SELECT
                 gp.score,
                 qs.title AS quiz_title,
                 g.started_at,
                 g.is_multiplayer,
                 g.player_count
             FROM
                 game_players gp
                     JOIN games g ON gp.game_id = g.id
                     JOIN quiz_sets qs ON g.quiz_set_id = qs.id
             WHERE
                 gp.user_id = $1 AND g.ended_at IS NOT NULL
             ORDER BY
                 gp.score DESC, g.started_at DESC
                 LIMIT 50`,
            [userId]
        );

        console.log(`Found ${result.rows.length} highscores`);
        res.json(result.rows);

    } catch (error) {
        console.error('Highscore fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Change password
router.post('/api/change-password', isAuthenticated, async (req, res) => {
    const { current_password, new_password, confirm_password } = req.body;
    const userId = req.session.user.id;
    console.log(`Password change attempt for user: ${req.session.user.username}`);

    // Validate
    if (!current_password || !new_password || !confirm_password) {
        console.log('Password change failed: Missing fields');
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (new_password !== confirm_password) {
        console.log('Password change failed: New passwords do not match');
        return res.status(400).json({ error: 'New passwords do not match' });
    }

    try {
        // Get current user
        const userResult = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);

        if (userResult.rows.length === 0) {
            console.log(`Password change failed: User ID ${userId} not found`);
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(current_password, userResult.rows[0].password_hash);
        console.log(`Current password verification: ${isMatch}`);

        if (!isMatch) {
            console.log('Password change failed: Current password incorrect');
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);
        console.log('New password hashed successfully');

        // Update password
        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, userId]);
        console.log('Password updated in database');

        res.json({ success: true, message: 'Password updated successfully' });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Check if user is authenticated (for client-side checks)
router.get('/api/check-auth', (req, res) => {
    console.log(`Auth check - Session exists: ${!!req.session}, User: ${req.session.user ? req.session.user.username : 'none'}`);
    if (req.session.user) {
        res.json({
            authenticated: true,
            isAdmin: req.session.user.is_admin,
            username: req.session.user.username
        });
    } else {
        res.json({ authenticated: false });
    }
});

module.exports = {
    router,
    isAuthenticated,
    isAdmin
};