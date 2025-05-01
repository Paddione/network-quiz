const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');

// Helper function to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
}

// Helper function to check if user is admin
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.is_admin) {
        return next();
    }
    res.status(403).redirect('/login?error=access_denied');
}

// Login page
router.get('/login', (req, res) => {
    res.sendFile('login.html', { root: './public' });
});

// Registration page
router.get('/register', (req, res) => {
    res.sendFile('register.html', { root: './public' });
});

// Process login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user = result.rows[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Set session
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            is_admin: user.is_admin
        };

        // Redirect based on role
        if (user.is_admin) {
            res.json({ success: true, redirect: '/admin' });
        } else {
            res.json({ success: true, redirect: '/' });
        }

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Process registration
router.post('/register', async (req, res) => {
    const { username, email, password, password_confirm } = req.body;

    // Basic validation
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== password_confirm) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    try {
        // Check if username or email already exists
        const checkResult = await db.query(
            'SELECT * FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (checkResult.rows.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const result = await db.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hashedPassword]
        );

        const user = result.rows[0];

        // Set session
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            is_admin: false
        };

        res.json({ success: true, redirect: '/' });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/login');
    });
});

// User profile
router.get('/profile', isAuthenticated, (req, res) => {
    res.sendFile('profile.html', { root: './public' });
});

// Get user data (for profile page)
router.get('/api/user', isAuthenticated, (req, res) => {
    res.json(req.session.user);
});

// Get user highscores
router.get('/api/user/highscores', isAuthenticated, async (req, res) => {
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

    // Validate
    if (!current_password || !new_password || !confirm_password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (new_password !== confirm_password) {
        return res.status(400).json({ error: 'New passwords do not match' });
    }

    try {
        // Get current user
        const userResult = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(current_password, userResult.rows[0].password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);

        // Update password
        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, userId]);

        res.json({ success: true, message: 'Password updated successfully' });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Check if user is authenticated (for client-side checks)
router.get('/api/check-auth', (req, res) => {
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