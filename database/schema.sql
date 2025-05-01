-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS player_answers CASCADE;
DROP TABLE IF EXISTS game_players CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS options CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS chapters CASCADE;
DROP TABLE IF EXISTS quiz_sets CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP VIEW IF EXISTS highscores CASCADE;

-- Users table
CREATE TABLE users (
                       id SERIAL PRIMARY KEY,
                       username VARCHAR(50) UNIQUE NOT NULL,
                       email VARCHAR(100) UNIQUE NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       is_admin BOOLEAN DEFAULT FALSE,
                       created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table (for connect-pg-simple)
CREATE TABLE user_sessions (
                               sid VARCHAR NOT NULL,
                               sess JSON NOT NULL,
                               expire TIMESTAMP(6) NOT NULL,
                               CONSTRAINT user_sessions_pkey PRIMARY KEY (sid)
);

-- Quiz sets table
CREATE TABLE quiz_sets (
                           id SERIAL PRIMARY KEY,
                           title VARCHAR(100) NOT NULL,
                           description TEXT,
                           created_by INTEGER REFERENCES users(id),
                           created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                           is_active BOOLEAN DEFAULT TRUE
);

-- Chapters table
CREATE TABLE chapters (
                          id SERIAL PRIMARY KEY,
                          quiz_set_id INTEGER REFERENCES quiz_sets(id) ON DELETE CASCADE,
                          title VARCHAR(100) NOT NULL,
                          sequence_number INTEGER NOT NULL,
                          UNIQUE(quiz_set_id, sequence_number)
);

-- Questions table
CREATE TABLE questions (
                           id SERIAL PRIMARY KEY,
                           chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
                           question_text TEXT NOT NULL,
                           explanation TEXT,
                           sequence_number INTEGER NOT NULL,
                           type VARCHAR(20) NOT NULL,
                           has_image BOOLEAN DEFAULT FALSE,
                           image_path VARCHAR(255),
                           UNIQUE(chapter_id, sequence_number)
);

-- Options table
CREATE TABLE options (
                         id SERIAL PRIMARY KEY,
                         question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
                         option_text TEXT NOT NULL,
                         sequence_number INTEGER NOT NULL,
                         is_correct BOOLEAN DEFAULT FALSE,
                         UNIQUE(question_id, sequence_number)
);

-- Games table
CREATE TABLE games (
                       id SERIAL PRIMARY KEY,
                       quiz_set_id INTEGER REFERENCES quiz_sets(id),
                       started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                       ended_at TIMESTAMP WITH TIME ZONE,
                       is_multiplayer BOOLEAN DEFAULT TRUE,
                       game_code VARCHAR(10) UNIQUE,
                       player_count INTEGER DEFAULT 1
);

-- Game players table
CREATE TABLE game_players (
                              id SERIAL PRIMARY KEY,
                              game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
                              user_id INTEGER REFERENCES users(id),
                              player_name VARCHAR(50) NOT NULL,
                              score INTEGER DEFAULT 0,
                              is_winner BOOLEAN DEFAULT FALSE
);

-- Player answers table
CREATE TABLE player_answers (
                                id SERIAL PRIMARY KEY,
                                game_player_id INTEGER REFERENCES game_players(id) ON DELETE CASCADE,
                                question_id INTEGER REFERENCES questions(id),
                                option_id INTEGER REFERENCES options(id),
                                is_correct BOOLEAN DEFAULT FALSE,
                                response_time_ms INTEGER,
                                answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_questions_chapter_id ON questions(chapter_id);
CREATE INDEX idx_options_question_id ON options(question_id);
CREATE INDEX idx_player_answers_game_player_id ON player_answers(game_player_id);
CREATE INDEX idx_game_players_game_id ON game_players(game_id);
CREATE INDEX idx_games_quiz_set_id ON games(quiz_set_id);
CREATE INDEX idx_chapters_quiz_set_id ON chapters(quiz_set_id);
CREATE INDEX idx_sessions_expire ON user_sessions(expire);

-- Create a view for highscores
CREATE VIEW highscores AS
SELECT
    u.username,
    gp.score,
    g.quiz_set_id,
    qs.title AS quiz_title,
    g.started_at,
    g.is_multiplayer,
    gp.player_name
FROM
    game_players gp
        JOIN games g ON gp.game_id = g.id
        JOIN quiz_sets qs ON g.quiz_set_id = qs.id
        LEFT JOIN users u ON gp.user_id = u.id
WHERE
    g.ended_at IS NOT NULL
ORDER BY
    gp.score DESC;