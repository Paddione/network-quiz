const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { isAuthenticated } = require('./auth');

// Get active quiz sets for voting
router.get('/sets', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT
                 id,
                 title,
                 description,
                 (SELECT COUNT(*) FROM chapters WHERE quiz_set_id = quiz_sets.id) AS chapters_count,
                 (SELECT COUNT(*) FROM chapters c JOIN questions q ON c.id = q.chapter_id WHERE c.quiz_set_id = quiz_sets.id) AS questions_count
             FROM
                 quiz_sets
             WHERE
                 is_active = TRUE
             ORDER BY
                 created_at DESC`
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Quiz sets fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get quiz details
router.get('/sets/:id', async (req, res) => {
    const quizSetId = req.params.id;

    try {
        // Get quiz set details
        const quizSetResult = await db.query(
            'SELECT id, title, description FROM quiz_sets WHERE id = $1',
            [quizSetId]
        );

        if (quizSetResult.rows.length === 0) {
            return res.status(404).json({ error: 'Quiz set not found' });
        }

        // Get chapters count
        const chaptersResult = await db.query(
            'SELECT COUNT(*) FROM chapters WHERE quiz_set_id = $1',
            [quizSetId]
        );

        // Get questions count
        const questionsResult = await db.query(
            'SELECT COUNT(*) FROM chapters c JOIN questions q ON c.id = q.chapter_id WHERE c.quiz_set_id = $1',
            [quizSetId]
        );

        const result = {
            ...quizSetResult.rows[0],
            chapters_count: parseInt(chaptersResult.rows[0].count),
            questions_count: parseInt(questionsResult.rows[0].count)
        };

        res.json(result);

    } catch (error) {
        console.error('Quiz set details fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get active games
router.get('/games/active', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT 
                g.id, 
                g.game_code, 
                g.is_multiplayer,
                g.player_count,
                CASE WHEN g.is_multiplayer THEN 5 ELSE 1 END AS max_players,
                qs.title AS quiz_title
            FROM 
                games g
            JOIN 
                quiz_sets qs ON g.quiz_set_id = qs.id
            WHERE 
                g.ended_at IS NULL
                AND g.started_at > NOW() - INTERVAL '30 minutes'
                AND (NOT g.is_multiplayer OR g.player_count < 5)
            ORDER BY 
                g.started_at DESC
            LIMIT 20`
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Active games fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get full quiz data for game
router.get('/game-data/:id', async (req, res) => {
    const quizSetId = req.params.id;

    try {
        // Get quiz set
        const quizSetResult = await db.query('SELECT * FROM quiz_sets WHERE id = $1', [quizSetId]);

        if (quizSetResult.rows.length === 0) {
            return res.status(404).json({ error: 'Quiz set not found' });
        }

        const quizSet = quizSetResult.rows[0];

        // Get chapters
        const chaptersResult = await db.query(
            'SELECT * FROM chapters WHERE quiz_set_id = $1 ORDER BY sequence_number',
            [quizSetId]
        );

        quizSet.chapters = [];

        for (const chapter of chaptersResult.rows) {
            const chapterObj = {
                id: chapter.id,
                title: chapter.title,
                questions: []
            };

            // Get questions
            const questionsResult = await db.query(
                'SELECT * FROM questions WHERE chapter_id = $1 ORDER BY sequence_number',
                [chapter.id]
            );

            for (const question of questionsResult.rows) {
                const questionObj = {
                    id: question.id,
                    question: question.question_text,
                    explanation: question.explanation,
                    type: question.type,
                    has_image: question.has_image,
                    image_path: question.has_image ? `/uploads/${question.image_path}` : null,
                    options: []
                };

                // Get options
                const optionsResult = await db.query(
                    'SELECT * FROM options WHERE question_id = $1 ORDER BY sequence_number',
                    [question.id]
                );

                questionObj.options = optionsResult.rows.map(opt => opt.option_text);

                // Find correct option
                const correctOption = optionsResult.rows.findIndex(opt => opt.is_correct);
                questionObj.correct = correctOption !== -1 ? correctOption : 0;

                chapterObj.questions.push(questionObj);
            }

            quizSet.chapters.push(chapterObj);
        }

        res.json(quizSet);

    } catch (error) {
        console.error('Game data fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create a new game
router.post('/games', async (req, res) => {
    const { quiz_set_id, is_multiplayer = true, player_count = 1 } = req.body;

    try {
        // Generate a unique game code
        const gameCode = Math.random().toString(36).substring(2, 12);

        // Create game
        const result = await db.query(
            'INSERT INTO games (quiz_set_id, is_multiplayer, game_code, player_count) VALUES ($1, $2, $3, $4) RETURNING id',
            [quiz_set_id, is_multiplayer, gameCode, player_count]
        );

        res.status(201).json({
            success: true,
            game_id: result.rows[0].id,
            game_code: gameCode
        });

    } catch (error) {
        console.error('Game creation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add player to game
router.post('/games/:id/players', async (req, res) => {
    const gameId = req.params.id;
    const { player_name, user_id = null } = req.body;

    if (!player_name) {
        return res.status(400).json({ error: 'Player name is required' });
    }

    try {
        // Create player
        const result = await db.query(
            'INSERT INTO game_players (game_id, user_id, player_name) VALUES ($1, $2, $3) RETURNING id',
            [gameId, user_id, player_name]
        );

        res.status(201).json({
            success: true,
            player_id: result.rows[0].id
        });

    } catch (error) {
        console.error('Player addition error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// End a game and update scores
router.post('/games/:id/end', async (req, res) => {
    const gameId = req.params.id;
    const { player_scores } = req.body;

    try {
        // Update game end time
        await db.query(
            'UPDATE games SET ended_at = NOW() WHERE id = $1',
            [gameId]
        );

        // Update player scores
        if (player_scores && typeof player_scores === 'object') {
            for (const [playerId, score] of Object.entries(player_scores)) {
                await db.query(
                    'UPDATE game_players SET score = $1 WHERE id = $2',
                    [score, playerId]
                );
            }
        }

        // Set winner(s)
        await db.query(`
            UPDATE game_players
            SET is_winner = true
            WHERE id IN (
                SELECT id
                FROM game_players
                WHERE game_id = $1
                ORDER BY score DESC
                LIMIT 1
                )
        `, [gameId]);

        res.json({ success: true });

    } catch (error) {
        console.error('End game error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Save player answer
router.post('/answers', async (req, res) => {
    const { game_player_id, question_id, option_id, is_correct, response_time_ms } = req.body;

    try {
        await db.query(
            'INSERT INTO player_answers (game_player_id, question_id, option_id, is_correct, response_time_ms) VALUES ($1, $2, $3, $4, $5)',
            [game_player_id, question_id, option_id, is_correct, response_time_ms]
        );

        res.status(201).json({ success: true });

    } catch (error) {
        console.error('Answer save error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get highscores
router.get('/highscores', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT
                 gp.player_name,
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
                 g.ended_at IS NOT NULL
             ORDER BY
                 gp.score DESC, g.started_at DESC
                 LIMIT 50`
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Highscores fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user personal highscores (requires login)
router.get('/personal-highscores', isAuthenticated, async (req, res) => {
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
                 LIMIT 10`,
            [userId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Personal highscores fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get highscore history for graphing
router.get('/highscore-history', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;

        const result = await db.query(
            `SELECT
                 gp.score,
                 g.started_at,
                 qs.title AS quiz_name
             FROM
                 game_players gp
                     JOIN games g ON gp.game_id = g.id
                     JOIN quiz_sets qs ON g.quiz_set_id = qs.id
             WHERE
                 gp.user_id = $1 AND g.ended_at IS NOT NULL
             ORDER BY
                 g.started_at ASC
                 LIMIT 100`,
            [userId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Highscore history fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;