class NetworkQuizGame {
    constructor() {
        this.state = {
            currentUser: null,
            players: [],
            currentQuestion: 0,
            currentChapter: 0,
            scores: {},
            timer: null,
            timeLeft: 30,
            answered: false,
            currentQuiz: null,
            playerAnswers: {},
            gameId: null
        };

        this.socket = null;
        this.initialize();
    }

    async initialize() {
        try {
            // Get current user data from session
            const response = await fetch('/api/user');
            if (!response.ok) {
                window.location.href = '/login';
                return;
            }
            
            this.state.currentUser = await response.json();
            
            // Initialize socket connection
            this.socket = io();
            this.setupSocketListeners();
            
            // Get game parameters from URL
            const urlParams = new URLSearchParams(window.location.search);
            this.state.gameId = urlParams.get('gameId');
            
            if (!this.state.gameId) {
                window.location.href = '/lobby';
                return;
            }

            // Join the game
            this.socket.emit('joinGame', {
                gameId: this.state.gameId,
                userId: this.state.currentUser.id,
                username: this.state.currentUser.username
            });

        } catch (error) {
            console.error('Initialization error:', error);
            window.location.href = '/login';
        }
    }

    setupSocketListeners() {
        this.socket.on('gameJoined', (data) => {
            this.handleGameJoined(data);
        });

        this.socket.on('playerJoined', (data) => {
            this.handlePlayerJoined(data);
        });

        this.socket.on('gameStarted', (data) => {
            this.handleGameStarted(data);
        });

        this.socket.on('playerAnswer', (data) => {
            this.handlePlayerAnswer(data);
        });

        this.socket.on('questionTimeout', () => {
            this.handleQuestionTimeout();
        });

        this.socket.on('gameError', (error) => {
            alert(error.message);
            window.location.href = '/lobby';
        });

        this.socket.on('playerLeft', (data) => {
            this.handlePlayerLeft(data);
        });
    }

    handleGameJoined(data) {
        this.state.players = data.players;
        this.state.currentQuiz = data.quizId;
        this.updatePlayerList();
        
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('gameScreen').classList.remove('hidden');
    }

    handlePlayerJoined(data) {
        this.state.players = data.players;
        this.state.scores = data.scores;
        this.updatePlayerList();
    }

    handleGameStarted(data) {
        this.state.currentChapter = 0;
        this.state.currentQuestion = 0;
        this.setupChapterProgress();
        this.showQuestion();
        this.startTimer();
    }

    handlePlayerAnswer(data) {
        if (data.userId !== this.state.currentUser.id) {
            this.showOtherPlayerAnswer(data);
        }
        this.state.scores = data.scores;
        this.updateScores();
    }

    handleQuestionTimeout() {
        this.stopTimer();
        if (!this.state.answered) {
            this.submitAnswer(null);
        }
    }

    handlePlayerLeft(data) {
        this.state.players = this.state.players.filter(p => p.id !== data.userId);
        this.updatePlayerList();
    }

    updatePlayerList() {
        const scoresDiv = document.getElementById('playerScores');
        scoresDiv.innerHTML = '';
        
        this.state.players.forEach(player => {
            const scoreElement = document.createElement('div');
            scoreElement.className = 'player-score';
            scoreElement.innerHTML = `
                <span class="player-name">${player.username}</span>
                <span class="score">${this.state.scores[player.id] || 0}</span>
            `;
            scoresDiv.appendChild(scoreElement);
        });
    }

    showQuestion() {
        const chapter = quizData[this.state.currentQuiz].chapters[this.state.currentChapter];
        const question = chapter.questions[this.state.currentQuestion];
        
        document.getElementById('chapterTitle').textContent = chapter.title;
        document.getElementById('questionText').textContent = question.question;
        document.getElementById('questionCounter').textContent = 
            `Frage ${this.state.currentQuestion + 1}/${chapter.questions.length}`;
        
        const answerArea = document.getElementById('answerArea');
        answerArea.innerHTML = '';
        
        if (question.type === 'multiple') {
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'options';
            
            question.options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'option';
                optionElement.textContent = option;
                optionElement.onclick = () => this.submitAnswer(index);
                optionsDiv.appendChild(optionElement);
            });
            
            answerArea.appendChild(optionsDiv);
        }
        
        document.getElementById('explanation').classList.add('hidden');
        document.getElementById('nextButton').classList.add('hidden');
        this.state.answered = false;
    }

    submitAnswer(answerIndex) {
        if (this.state.answered) return;
        
        this.state.answered = true;
        this.stopTimer();
        
        this.socket.emit('submitAnswer', {
            gameId: this.state.gameId,
            userId: this.state.currentUser.id,
            questionIndex: this.state.currentQuestion,
            chapterIndex: this.state.currentChapter,
            answer: answerIndex,
            timeLeft: this.state.timeLeft
        });
    }

    startTimer() {
        this.state.timeLeft = 30;
        this.updateTimerDisplay();
        
        this.state.timer = setInterval(() => {
            this.state.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.state.timeLeft <= 0) {
                this.handleQuestionTimeout();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.state.timer) {
            clearInterval(this.state.timer);
            this.state.timer = null;
        }
    }

    updateTimerDisplay() {
        document.getElementById('timer').textContent = this.state.timeLeft;
    }

    handleNextQuestion() {
        this.state.currentQuestion++;
        
        if (this.state.currentQuestion >= quizData[this.state.currentQuiz].chapters[this.state.currentChapter].questions.length) {
            this.showChapterResult();
        } else {
            this.showQuestion();
            this.startTimer();
        }
    }

    handleNextChapter() {
        this.state.currentChapter++;
        this.state.currentQuestion = 0;
        
        if (this.state.currentChapter >= quizData[this.state.currentQuiz].chapters.length) {
            this.showFinalResult();
        } else {
            document.getElementById('chapterResult').classList.add('hidden');
            document.getElementById('gameScreen').classList.remove('hidden');
            this.showQuestion();
            this.startTimer();
        }
    }

    setupChapterProgress() {
        const progress = document.getElementById('chapterProgress');
        progress.innerHTML = '';
        
        quizData[this.state.currentQuiz].chapters.forEach((chapter, index) => {
            const indicator = document.createElement('div');
            indicator.className = 'chapter-indicator';
            indicator.textContent = index + 1;
            
            if (index === this.state.currentChapter) {
                indicator.classList.add('active');
            } else if (index < this.state.currentChapter) {
                indicator.classList.add('completed');
            }
            
            progress.appendChild(indicator);
        });
    }

    showChapterResult() {
        document.getElementById('gameScreen').classList.add('hidden');
        document.getElementById('chapterResult').classList.remove('hidden');
        
        const scoresDiv = document.getElementById('chapterScores');
        scoresDiv.innerHTML = '';
        
        this.state.players.forEach(player => {
            const scoreElement = document.createElement('div');
            scoreElement.className = 'player-chapter-score';
            scoreElement.innerHTML = `
                <span class="player-name">${player.username}</span>
                <span class="score">${this.state.scores[player.id] || 0}</span>
            `;
            scoresDiv.appendChild(scoreElement);
        });
    }

    showFinalResult() {
        document.getElementById('gameScreen').classList.add('hidden');
        document.getElementById('chapterResult').classList.add('hidden');
        document.getElementById('finalResult').classList.remove('hidden');
        
        const scoresDiv = document.getElementById('finalScores');
        scoresDiv.innerHTML = '';
        
        // Sort players by score
        const sortedPlayers = [...this.state.players].sort((a, b) => 
            (this.state.scores[b.id] || 0) - (this.state.scores[a.id] || 0)
        );
        
        sortedPlayers.forEach((player, index) => {
            const scoreElement = document.createElement('div');
            scoreElement.className = 'player-final-score';
            scoreElement.innerHTML = `
                <span class="position">${index + 1}.</span>
                <span class="player-name">${player.username}</span>
                <span class="score">${this.state.scores[player.id] || 0}</span>
            `;
            scoresDiv.appendChild(scoreElement);
        });
    }
}

// Initialize game when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new NetworkQuizGame();
});