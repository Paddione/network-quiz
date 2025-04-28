const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Game state
let games = {};
let waitingPlayers = [];

// Handle socket connections
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join', (data) => {
        handleJoin(socket, data);
    });
    
    socket.on('startGame', () => {
        const game = findGameForPlayer(socket.id);
        if (game && game.players.length === 2) {
            startGame(game);
        }
    });
    
    socket.on('answer', (data) => {
        const game = findGameForPlayer(socket.id);
        if (game) {
            // Broadcast answer to all players in the game
            game.sockets.forEach(s => {
                s.emit('answer', data);
            });
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
    
    socket.on('disconnect', () => {
        handleDisconnect(socket);
    });
});

function handleJoin(socket, data) {
    const playerName = data.player;
    
    // Add player to waiting list
    waitingPlayers.push({
        socket: socket,
        name: playerName
    });
    
    // If we have 2 players, create a game
    if (waitingPlayers.length >= 2) {
        const player1 = waitingPlayers.shift();
        const player2 = waitingPlayers.shift();
        
        const gameId = generateGameId();
        games[gameId] = {
            id: gameId,
            players: [player1.name, player2.name],
            sockets: [player1.socket, player2.socket],
            scores: {
                [player1.name]: 0,
                [player2.name]: 0
            }
        };
        
        // Add game ID to socket data
        player1.socket.gameId = gameId;
        player2.socket.gameId = gameId;
        
        // Notify both players
        const gameData = {
            players: games[gameId].players,
            scores: games[gameId].scores
        };
        
        games[gameId].sockets.forEach(s => {
            s.emit('playerJoined', gameData);
        });
    } else {
        // Notify waiting player
        socket.emit('playerJoined', {
            players: [playerName],
            scores: { [playerName]: 0 }
        });
    }
}

function startGame(game) {
    const gameData = {
        players: game.players,
        scores: game.scores
    };
    
    game.sockets.forEach(s => {
        s.emit('gameStarted', gameData);
    });
}

function handleDisconnect(socket) {
    console.log('User disconnected:', socket.id);
    
    // Remove from waiting players
    waitingPlayers = waitingPlayers.filter(p => p.socket.id !== socket.id);
    
    // Check if player was in a game
    const game = findGameForPlayer(socket.id);
    if (game) {
        // Notify other player
        game.sockets.forEach(s => {
            if (s.id !== socket.id) {
                s.emit('playerLeft', { player: getPlayerName(game, socket.id) });
            }
        });
        
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
    return Math.random().toString(36).substring(2, 15);
}

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});