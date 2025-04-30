// Game State
let gameState = {
    players: [],
    currentPlayer: null,
    currentQuestion: 0,
    currentChapter: 0,
    scores: {},
    timer: null,
    timeLeft: 30,
    answered: false,
    currentQuiz: 'iti21',
    playerAnswers: {}
};

// WebSocket connection
let socket;

// Initialize game
window.onload = function() {
    // Connect to WebSocket server
    socket = io();
    
    // Add console logging for debugging
    console.log("Game initialized, connecting to server...");
    
    // Socket event handlers
    socket.on('connect', () => {
        console.log('Connected to server');
    });
    
    socket.on('playerJoined', (data) => {
        console.log('Player joined event received:', data);
        gameState.players = data.players;
        gameState.scores = data.scores;
        updatePlayerList();
        
        if (gameState.players.length === 2) {
            console.log('Two players joined, sending startGame event');
            socket.emit('startGame');
        }
    });
    
    socket.on('gameStarted', (data) => {
        console.log('Game started event received:', data);
        document.getElementById('waitingRoom').classList.add('hidden');
        document.getElementById('gameScreen').classList.remove('hidden');
        gameState.players = data.players;
        gameState.scores = data.scores;
        setupGame();
        showQuestion();
    });
    
    socket.on('answer', (data) => {
        console.log('Answer event received:', data);
        if (data.player !== gameState.currentPlayer) {
            showOtherPlayerAnswer(data);
        }
    });
    
    socket.on('nextQuestion', () => {
        console.log('Next question event received');
        gameState.currentQuestion++;
        gameState.answered = false;
        
        if (gameState.currentQuestion < quizData[gameState.currentQuiz].chapters[gameState.currentChapter].questions.length) {
            showQuestion();
        } else {
            showChapterResult();
        }
    });
    
    socket.on('nextChapter', () => {
        console.log('Next chapter event received');
        gameState.currentChapter++;
        gameState.currentQuestion = 0;
        gameState.answered = false;
        
        if (gameState.currentChapter < quizData[gameState.currentQuiz].chapters.length) {
            document.getElementById('chapterResult').classList.add('hidden');
            document.getElementById('gameScreen').classList.remove('hidden');
            showQuestion();
        } else {
            showFinalResult();
        }
    });
    
    socket.on('playerLeft', (data) => {
        alert(`${data.player} hat das Spiel verlassen.`);
        restartGame();
    });
};

// Join game
function joinGame() {
    const playerName = document.getElementById('playerName').value.trim();
    if (!playerName) {
        alert('Bitte gib einen Namen ein!');
        return;
    }
    
    gameState.currentPlayer = playerName;
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('waitingRoom').classList.remove('hidden');
    
    console.log('Joining game as:', playerName);
    socket.emit('join', { player: playerName });
}

// Update player list in waiting room
function updatePlayerList() {
    const playerList = document.getElementById('playerList');
    playerList.innerHTML = '<h3>Spieler im Raum:</h3>';
    
    gameState.players.forEach(player => {
        const playerElement = document.createElement('div');
        playerElement.className = 'player-card';
        playerElement.innerHTML = `<span>${player}</span>`;
        playerList.appendChild(playerElement);
    });
    
    console.log('Updated player list:', gameState.players);
}

// Setup game UI
function setupGame() {
    document.getElementById('player1Name').textContent = gameState.players[0] || 'Spieler 1';
    document.getElementById('player2Name').textContent = gameState.players[1] || 'Spieler 2';
    updateScores();
    setupChapterProgress();
    console.log('Game setup complete');
}

// Setup chapter progress indicators
function setupChapterProgress() {
    const progress = document.getElementById('chapterProgress');
    progress.innerHTML = '';
    
    quizData[gameState.currentQuiz].chapters.forEach((chapter, index) => {
        const indicator = document.createElement('div');
        indicator.className = 'chapter-indicator';
        indicator.textContent = index + 1;
        
        if (index === gameState.currentChapter) {
            indicator.classList.add('active');
        } else if (index < gameState.currentChapter) {
            indicator.classList.add('completed');
        }
        
        progress.appendChild(indicator);
    });
    
    console.log('Chapter progress setup complete');
}

// Show current question
function showQuestion() {
    console.log(`Showing question: Chapter ${gameState.currentChapter + 1}, Question ${gameState.currentQuestion + 1}`);
    
    try {
        const chapter = quizData[gameState.currentQuiz].chapters[gameState.currentChapter];
        const question = chapter.questions[gameState.currentQuestion];
        
        if (!chapter || !question) {
            console.error('Failed to find chapter or question:', { 
                quiz: gameState.currentQuiz,
                chapter: gameState.currentChapter,
                question: gameState.currentQuestion,
                quizData: quizData
            });
            return;
        }
        
        document.getElementById('chapterTitle').textContent = chapter.title;
        document.getElementById('questionText').textContent = question.question;
        
        // Setup answer area based on question type
        const answerArea = document.getElementById('answerArea');
        answerArea.innerHTML = '';
        
        if (question.type === 'multiple') {
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'options';
            
            question.options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'option';
                optionElement.textContent = option;
                optionElement.onclick = () => selectAnswer(index);
                optionsDiv.appendChild(optionElement);
            });
            
            answerArea.appendChild(optionsDiv);
        }
        
        // Reset UI
        document.getElementById('explanation').classList.add('hidden');
        document.getElementById('nextButton').classList.add('hidden');
        gameState.answered = false;
        gameState.playerAnswers = {};
        
        // Start timer
        startTimer();
        setupChapterProgress();
        
        console.log('Question displayed successfully');
    } catch (error) {
        console.error('Error showing question:', error);
    }
}

// Start countdown timer
function startTimer() {
    gameState.timeLeft = 30;
    updateTimerDisplay();
    
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }
    
    gameState.timer = setInterval(() => {
        gameState.timeLeft--;
        updateTimerDisplay();
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timer);
            timeUp();
        }
    }, 1000);
    
    console.log('Timer started');
}

// Update timer display
function updateTimerDisplay() {
    const timerElement = document.getElementById('timer');
    timerElement.textContent = gameState.timeLeft;
    
    if (gameState.timeLeft <= 10) {
        timerElement.classList.add('warning');
    } else {
        timerElement.classList.remove('warning');
    }
}

// Handle answer selection
function selectAnswer(answerIndex) {
    if (gameState.answered) return;
    
    gameState.answered = true;
    clearInterval(gameState.timer);
    
    console.log(`Selected answer: ${answerIndex}`);
    
    const chapter = quizData[gameState.currentQuiz].chapters[gameState.currentChapter];
    const question = chapter.questions[gameState.currentQuestion];
    
    // Mark selected option
    const options = document.querySelectorAll('.option');
    options.forEach(option => option.classList.remove('selected'));
    options[answerIndex].classList.add('selected');
    
    // Send answer to server
    socket.emit('answer', {
        player: gameState.currentPlayer,
        answer: answerIndex,
        timeLeft: gameState.timeLeft
    });
    
    // Store answer locally
    gameState.playerAnswers[gameState.currentPlayer] = {
        answer: answerIndex,
        correct: answerIndex === question.correct
    };
    
    checkAllAnswered();
}

// Show other player's answer
function showOtherPlayerAnswer(data) {
    console.log(`Received other player's answer:`, data);
    
    const chapter = quizData[gameState.currentQuiz].chapters[gameState.currentChapter];
    const question = chapter.questions[gameState.currentQuestion];
    
    gameState.playerAnswers[data.player] = {
        answer: data.answer,
        correct: data.answer === question.correct
    };
    
    // Update score if answer is correct
    if (data.answer === question.correct) {
        gameState.scores[data.player] += 10 + Math.floor(data.timeLeft / 3);
        updateScores();
    }
    
    checkAllAnswered();
}

// Check if all players have answered
function checkAllAnswered() {
    console.log('Checking if all players answered');
    console.log('Player answers:', gameState.playerAnswers);
    console.log('Players:', gameState.players);
    
    if (Object.keys(gameState.playerAnswers).length === gameState.players.length) {
        console.log('All players have answered, showing results');
        showResults();
    }
}

// Show question results
function showResults() {
    console.log('Showing question results');
    
    const chapter = quizData[gameState.currentQuiz].chapters[gameState.currentChapter];
    const question = chapter.questions[gameState.currentQuestion];
    
    // Show correct answer
    const options = document.querySelectorAll('.option');
    options.forEach((option, index) => {
        if (index === question.correct) {
            option.classList.add('correct');
        } else if (gameState.playerAnswers[gameState.currentPlayer]?.answer === index) {
            option.classList.add('wrong');
        }
    });
    
    // Show explanation
    const explanationElement = document.getElementById('explanation');
    explanationElement.textContent = question.explanation;
    explanationElement.classList.remove('hidden');
    
    // Update score if current player answered correctly
    if (gameState.playerAnswers[gameState.currentPlayer]?.correct) {
        gameState.scores[gameState.currentPlayer] += 10 + Math.floor(gameState.timeLeft / 3);
        updateScores();
    }
    
    // Show what other player answered
    gameState.players.forEach(player => {
        if (player !== gameState.currentPlayer) {
            const otherAnswer = gameState.playerAnswers[player];
            if (otherAnswer) {
                const answerDisplay = document.createElement('div');
                answerDisplay.className = `player-answer ${otherAnswer.correct ? 'correct' : 'wrong'}`;
                answerDisplay.textContent = `${player} hat ${question.options[otherAnswer.answer]} gewählt`;
                document.getElementById('explanation').appendChild(answerDisplay);
            }
        }
    });
    
    // Show next button
    document.getElementById('nextButton').classList.remove('hidden');
}

// Handle time up
function timeUp() {
    console.log('Time up!');
    if (!gameState.answered) {
        gameState.answered = true;
        
        // Send answer to server (timed out - no answer)
        socket.emit('answer', {
            player: gameState.currentPlayer,
            answer: -1,
            timeLeft: 0
        });
        
        const chapter = quizData[gameState.currentQuiz].chapters[gameState.currentChapter];
        const question = chapter.questions[gameState.currentQuestion];
        
        // Store answer locally (timed out)
        gameState.playerAnswers[gameState.currentPlayer] = {
            answer: -1,
            correct: false
        };
        
        showResults();
    }
}

// Go to next question
function nextQuestion() {
    console.log('Going to next question');
    socket.emit('nextQuestion');
}

// Show chapter result
function showChapterResult() {
    console.log('Showing chapter result');
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('chapterResult').classList.remove('hidden');
    
    const chapter = quizData[gameState.currentQuiz].chapters[gameState.currentChapter];
    document.getElementById('chapterResultTitle').textContent = `${chapter.title} - Ergebnis`;
    
    const content = document.getElementById('chapterResultContent');
    content.innerHTML = '';
    
    // Determine winner
    const scores = Object.entries(gameState.scores);
    scores.sort((a, b) => b[1] - a[1]);
    
    const winnerText = document.createElement('h3');
    if (scores[0][1] === scores[1][1]) {
        winnerText.textContent = 'Unentschieden!';
    } else {
        winnerText.textContent = `${scores[0][0]} führt!`;
    }
    content.appendChild(winnerText);
    
    // Show scores
    scores.forEach(([player, score]) => {
        const scoreElement = document.createElement('div');
        scoreElement.className = 'player-card';
        scoreElement.innerHTML = `<span>${player}</span><span>${score} Punkte</span>`;
        content.appendChild(scoreElement);
    });
}

// Go to next chapter
function nextChapter() {
    console.log('Going to next chapter');
    socket.emit('nextChapter');
}

// Show final result
function showFinalResult() {
    console.log('Showing final result');
    document.getElementById('chapterResult').classList.add('hidden');
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('finalResult').classList.remove('hidden');
    
    const content = document.getElementById('finalResultContent');
    content.innerHTML = '';
    
    // Determine winner
    const scores = Object.entries(gameState.scores);
    scores.sort((a, b) => b[1] - a[1]);
    
    const winnerText = document.createElement('h3');
    if (scores[0][1] === scores[1][1]) {
        winnerText.textContent = 'Unentschieden!';
    } else {
        winnerText.textContent = `${scores[0][0]} hat gewonnen!`;
    }
    content.appendChild(winnerText);
    
    // Show final scores
    scores.forEach(([player, score]) => {
        const scoreElement = document.createElement('div');
        scoreElement.className = 'player-card';
        scoreElement.innerHTML = `<span>${player}</span><span>${score} Punkte</span>`;
        content.appendChild(scoreElement);
    });
}

// Update score display
function updateScores() {
    if (gameState.players.length >= 1) {
        document.getElementById('player1Name').textContent = gameState.players[0];
        document.getElementById('player1Score').textContent = gameState.scores[gameState.players[0]] || 0;
    }
    
    if (gameState.players.length >= 2) {
        document.getElementById('player2Name').textContent = gameState.players[1];
        document.getElementById('player2Score').textContent = gameState.scores[gameState.players[1]] || 0;
    }
    
    console.log('Scores updated:', gameState.scores);
}

// Restart game
function restartGame() {
    console.log('Restarting game');
    location.reload();
}
