const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { pool } = require('./database/db');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session setup
app.use(session({
    store: new pgSession({
        pool,
        tableName: 'user_sessions'
    }),
    secret: process.env.SESSION_SECRET || '170591pk',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
}));

// Import routes
const authRoutes = require('./routes/auth').router;
const adminRoutes = require('./routes/admin');
const quizRoutes = require('./routes/quiz');

// Use routes
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/api/quiz', quizRoutes);

// Add this after your route declarations but before the socket.io logic
app.get('/lobby', (req, res) => {
    res.sendFile('lobby.html', { root: './public' });
});

// Add the active games endpoint
app.get('/api/games/active', async (req, res) => {
    try {
        const result = await pool.query(
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

// Game state
let games = {};
let waitingPlayers = [];

// Handle socket connections
io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('createSinglePlayer', async (data) => {
        console.log('createSinglePlayer event received:', data);
        try {
            // Get quiz set
            const quizSetId = data.quizSetId || 1; // Fallback to ID 1 if not specified
            const quizResult = await pool.query(`
                SELECT id, title, description 
                FROM quiz_sets 
                WHERE id = $1 AND is_active = TRUE`,
                [quizSetId]
            );
            
            console.log('Quiz set query result:', quizResult.rows);

            if (quizResult.rows.length === 0) {
                console.log('Quiz set not found or inactive');
                socket.emit('gameError', { message: 'Quiz set not found or inactive' });
                return;
            }

            // Get quiz data
            const quizData = await getQuizData(quizSetId);
            console.log('Quiz data fetched');

            // Create game in database
            const gameResult = await pool.query(
                'INSERT INTO games (quiz_set_id, is_multiplayer, game_code, player_count) VALUES ($1, $2, $3, $4) RETURNING id',
                [quizSetId, false, generateGameId(), 1]
            );

            const gameId = gameResult.rows[0].id;
            console.log('Game created with ID:', gameId);

            // Create player in database
            const playerResult = await pool.query(
                'INSERT INTO game_players (game_id, user_id, player_name, score) VALUES ($1, $2, $3, $4) RETURNING id',
                [gameId, data.userId, data.username, 0]
            );

            console.log('Player created:', playerResult.rows[0]);

            // Send game data to player
            socket.emit('gameStarted', {
                players: [data.username],
                scores: { [data.username]: 0 },
                playerId: playerResult.rows[0].id,
                gameId: gameId,
                quiz: quizData
            });

        } catch (error) {
            console.error('Error creating single player game:', error);
            socket.emit('gameError', { message: 'Failed to create game: ' + error.message });
        }
    });

    socket.on('join', (data) => {
        handleJoin(socket, data);
    });

    socket.on('startGame', () => {
        const game = findGameForPlayer(socket.id);
        if (game && game.players.length >= 2 && game.players.length <= 5) {
            startGame(game);
        }
    });

    socket.on('answer', (data) => {
        console.log('Answer received on backend:', data);
        const game = findGameForPlayer(socket.id);
        if (game) {
            console.log('Broadcasting to sockets:', game.sockets.map(s => s.id));
            game.sockets.forEach(s => {
                s.emit('answer', data);
            });
            if (data.playerId) {
                savePlayerAnswer(data);
            }
        }
    });

    socket.on('nextQuestion', () => {
        const game = findGameForPlayer(socket.id);
        if (game) {
            game.sockets.forEach(s => {
                s.emit('nextQuestion');
            });
        }
    });

    socket.on('nextChapter', () => {
        const game = findGameForPlayer(socket.id);
        if (game) {
            game.sockets.forEach(s => {
                s.emit('nextChapter');
            });
        }
    });

    socket.on('gameEnd', (data) => {
        const game = findGameForPlayer(socket.id);
        if (game) {
            // Save game results to database
            saveGameResults(game.dbId, data.scores);

            // Notify all players
            game.sockets.forEach(s => {
                s.emit('gameEnded', data);
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
        handleDisconnect(socket);
    });
});

// DB function to save player answer
async function savePlayerAnswer(data) {
    try {
        const { playerId, questionId, answer, isCorrect, timeLeft } = data;

        // Convert timeLeft to response time (milliseconds)
        const responseTimeMs = Math.max(0, (30 - timeLeft) * 1000);

        // Get option ID
        const optionsResult = await pool.query(
            'SELECT id FROM options WHERE question_id = $1 ORDER BY sequence_number LIMIT 1 OFFSET $2',
            [questionId, answer]
        );

        const optionId = optionsResult.rows.length > 0 ? optionsResult.rows[0].id : null;

        await pool.query(
            'INSERT INTO player_answers (game_player_id, question_id, option_id, is_correct, response_time_ms) VALUES ($1, $2, $3, $4, $5)',
            [playerId, questionId, optionId, isCorrect, responseTimeMs]
        );
    } catch (error) {
        console.error('Error saving player answer:', error);
    }
}

// Save game results to database
async function saveGameResults(gameId, scores) {
    try {
        // Update game end time
        await pool.query('UPDATE games SET ended_at = NOW() WHERE id = $1', [gameId]);

        // Update player scores
        for (const [playerName, score] of Object.entries(scores)) {
            await pool.query(
                'UPDATE game_players SET score = $1 WHERE game_id = $2 AND player_name = $3',
                [score, gameId, playerName]
            );
        }

        // Set winner(s)
        await pool.query(`
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
    } catch (error) {
        console.error('Error saving game results:', error);
    }
}

function handleJoin(socket, data) {
    const playerName = data.player;
    const userId = data.userId; // May be null for non-authenticated users
    const isSinglePlayer = data.singlePlayer === true;

    if (isSinglePlayer) {
        // Create a single-player game
        createSinglePlayerGame(socket, playerName, userId);
    } else {
        // Add player to waiting list for multiplayer
        waitingPlayers.push({
            socket: socket,
            name: playerName,
            userId: userId
        });

        // If we have at least 2 players (up to 5), create a game
        if (waitingPlayers.length >= 2) {
            createMultiPlayerGame();
        } else {
            // Notify waiting player
            socket.emit('playerJoined', {
                players: [playerName],
                scores: { [playerName]: 0 }
            });
        }
    }
}

async function createSinglePlayerGame(socket, playerName, userId) {
    try {
        // Get a random quiz set
        const quizResult = await pool.query('SELECT id FROM quiz_sets WHERE is_active = TRUE ORDER BY RANDOM() LIMIT 1');

        if (quizResult.rows.length === 0) {
            socket.emit('error', { message: 'No quiz sets available' });
            return;
        }

        const quizSetId = quizResult.rows[0].id;
        const gameId = generateGameId();

        // Create game in database
        const gameResult = await pool.query(
            'INSERT INTO games (quiz_set_id, is_multiplayer, game_code, player_count) VALUES ($1, $2, $3, $4) RETURNING id',
            [quizSetId, false, gameId, 1]
        );

        const dbGameId = gameResult.rows[0].id;

        // Create player in database
        const playerResult = await pool.query(
            'INSERT INTO game_players (game_id, user_id, player_name, score) VALUES ($1, $2, $3, $4) RETURNING id',
            [dbGameId, userId, playerName, 0]
        );

        const playerId = playerResult.rows[0].id;

        // Create game in memory
        games[gameId] = {
            id: gameId,
            dbId: dbGameId,
            quizSetId: quizSetId,
            players: [playerName],
            playerIds: [playerId],
            sockets: [socket],
            scores: {
                [playerName]: 0
            },
            isSinglePlayer: true
        };

        // Add game ID to socket data
        socket.gameId = gameId;

        // Notify player
        socket.emit('playerJoined', {
            players: [playerName],
            scores: { [playerName]: 0 },
            playerId: playerId,
            gameId: dbGameId
        });

        // Start the game immediately for single player
        startGame(games[gameId]);

    } catch (error) {
        console.error('Error creating single player game:', error);
        socket.emit('error', { message: 'Failed to create game' });
    }
}

async function createMultiPlayerGame() {
    try {
        // Take players from waiting list (up to 5)
        const gamePlayers = waitingPlayers.splice(0, 5);

        // Get a random quiz set
        const quizResult = await pool.query('SELECT id FROM quiz_sets WHERE is_active = TRUE ORDER BY RANDOM() LIMIT 1');

        if (quizResult.rows.length === 0) {
            gamePlayers.forEach(p => p.socket.emit('error', { message: 'No quiz sets available' }));
            return;
        }

        const quizSetId = quizResult.rows[0].id;
        const gameId = generateGameId();

        // Create game in database
        const gameResult = await pool.query(
            'INSERT INTO games (quiz_set_id, is_multiplayer, game_code, player_count) VALUES ($1, $2, $3, $4) RETURNING id',
            [quizSetId, true, gameId, gamePlayers.length]
        );

        const dbGameId = gameResult.rows[0].id;

        // Setup game object
        const playerNames = gamePlayers.map(p => p.name);
        const playerSockets = gamePlayers.map(p => p.socket);
        const playerScores = {};
        playerNames.forEach(name => playerScores[name] = 0);

        const playerIds = [];

        // Create players in database
        for (const player of gamePlayers) {
            const playerResult = await pool.query(
                'INSERT INTO game_players (game_id, user_id, player_name, score) VALUES ($1, $2, $3, $4) RETURNING id',
                [dbGameId, player.userId, player.name, 0]
            );

            playerIds.push(playerResult.rows[0].id);
        }

        // Create game in memory
        games[gameId] = {
            id: gameId,
            dbId: dbGameId,
            quizSetId: quizSetId,
            players: playerNames,
            playerIds: playerIds,
            sockets: playerSockets,
            scores: playerScores,
            isSinglePlayer: false
        };

        // Add game ID to socket data
        for (let i = 0; i < playerSockets.length; i++) {
            playerSockets[i].gameId = gameId;
        }

        // Notify all players
        const gameData = {
            players: playerNames,
            scores: playerScores
        };

        for (let i = 0; i < playerSockets.length; i++) {
            playerSockets[i].emit('playerJoined', {
                ...gameData,
                playerId: playerIds[i],
                gameId: dbGameId
            });
        }

    } catch (error) {
        console.error('Error creating multiplayer game:', error);
    }
}

async function startGame(game) {
    try {
        const gameData = {
            players: game.players,
            scores: game.scores,
            gameId: game.dbId,
            quizSetId: game.quizSetId
        };

        // Fetch quiz data from database
        const quizData = await getQuizData(game.quizSetId);

        game.sockets.forEach(s => {
            s.emit('gameStarted', {
                ...gameData,
                quiz: quizData
            });
        });
    } catch (error) {
        console.error('Error starting game:', error);
        game.sockets.forEach(s => {
            s.emit('error', { message: 'Failed to start game' });
        });
    }
}

async function getQuizData(quizSetId) {
    // Fetch complete quiz data from database
    const quizSetResult = await pool.query('SELECT * FROM quiz_sets WHERE id = $1', [quizSetId]);

    if (quizSetResult.rows.length === 0) {
        throw new Error('Quiz set not found');
    }

    const quizSet = quizSetResult.rows[0];

    // Get chapters
    const chaptersResult = await pool.query(
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
        const questionsResult = await pool.query(
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
            const optionsResult = await pool.query(
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

    return quizSet;
}

function handleDisconnect(socket) {
    console.log('User disconnected:', socket.id);

    // Remove from waiting players
    waitingPlayers = waitingPlayers.filter(p => p.socket.id !== socket.id);

    // Check if player was in a game
    const game = findGameForPlayer(socket.id);
    if (game) {
        // Notify other players
        game.sockets.forEach(s => {
            if (s.id !== socket.id) {
                s.emit('playerLeft', { player: getPlayerName(game, socket.id) });
            }
        });

        // Update game end time in database
        try {
            pool.query('UPDATE games SET ended_at = NOW() WHERE id = $1', [game.dbId]);
        } catch (error) {
            console.error('Error updating game end time:', error);
        }

        // Remove game
        delete games[game.id];
    }
}

function findGameForPlayer(socketId) {
    for (const gameId in games) {
        const game = games[gameId];
        if (game.sockets.some(s => s.id === socketId)) {
            return game;
        }
    }
    return null;
}

function getPlayerName(game, socketId) {
    const index = game.sockets.findIndex(s => s.id === socketId);
    return game.players[index];
}

function generateGameId() {
    return Math.random().toString(36).substring(2, 12);
}

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});