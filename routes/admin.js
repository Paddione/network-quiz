const express = require('express');
const router = express.Router();
const db = require('../database/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isAdmin } = require('./auth');

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = process.env.UPLOAD_DIR || 'uploads';

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Create unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// Configure upload options
const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || 5242880) // 5MB default
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Admin dashboard
router.get('/', isAdmin, (req, res) => {
    res.sendFile('admin/dashboard.html', { root: './public' });
});

// Quiz management
router.get('/quizzes', isAdmin, (req, res) => {
    res.sendFile('admin/quizzes.html', { root: './public' });
});

// Quiz editor
router.get('/quiz-editor/:id?', isAdmin, (req, res) => {
    res.sendFile('admin/quiz-editor.html', { root: './public' });
});

// Get all quiz sets
router.get('/api/quiz-sets', isAdmin, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT 
        qs.id, 
        qs.title, 
        qs.description, 
        qs.created_at, 
        qs.is_active,
        u.username AS created_by,
        COUNT(DISTINCT c.id) AS chapter_count,
        COUNT(DISTINCT q.id) AS question_count
      FROM 
        quiz_sets qs
      LEFT JOIN users u ON qs.created_by = u.id
      LEFT JOIN chapters c ON qs.id = c.quiz_set_id
      LEFT JOIN questions q ON c.id = q.chapter_id
      GROUP BY 
        qs.id, u.username
      ORDER BY 
        qs.created_at DESC`
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Quiz sets fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create new quiz set
router.post('/api/quiz-sets', isAdmin, async (req, res) => {
    const { title, description } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    try {
        const result = await db.query(
            'INSERT INTO quiz_sets (title, description, created_by) VALUES ($1, $2, $3) RETURNING *',
            [title, description || '', req.session.user.id]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Quiz set creation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single quiz set with chapters and questions
router.get('/api/quiz-sets/:id', isAdmin, async (req, res) => {
    const quizSetId = req.params.id;

    try {
        // Get quiz set details
        const quizSetResult = await db.query(
            'SELECT * FROM quiz_sets WHERE id = $1',
            [quizSetId]
        );

        if (quizSetResult.rows.length === 0) {
            return res.status(404).json({ error: 'Quiz set not found' });
        }

        const quizSet = quizSetResult.rows[0];

        // Get chapters
        const chaptersResult = await db.query(
            'SELECT * FROM chapters WHERE quiz_set_id = $1 ORDER BY sequence_number',
            [quizSetId]
        );

        quizSet.chapters = chaptersResult.rows;

        // Get questions for each chapter
        for (let chapter of quizSet.chapters) {
            const questionsResult = await db.query(
                'SELECT * FROM questions WHERE chapter_id = $1 ORDER BY sequence_number',
                [chapter.id]
            );

            chapter.questions = questionsResult.rows;

            // Get options for each question
            for (let question of chapter.questions) {
                const optionsResult = await db.query(
                    'SELECT * FROM options WHERE question_id = $1 ORDER BY sequence_number',
                    [question.id]
                );

                question.options = optionsResult.rows;
            }
        }

        res.json(quizSet);

    } catch (error) {
        console.error('Quiz set fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update quiz set
router.put('/api/quiz-sets/:id', isAdmin, async (req, res) => {
    const quizSetId = req.params.id;
    const { title, description, is_active } = req.body;

    try {
        const result = await db.query(
            'UPDATE quiz_sets SET title = $1, description = $2, is_active = $3 WHERE id = $4 RETURNING *',
            [title, description, is_active, quizSetId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Quiz set not found' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Quiz set update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete quiz set
router.delete('/api/quiz-sets/:id', isAdmin, async (req, res) => {
    const quizSetId = req.params.id;

    try {
        // Delete quiz set (cascade will delete chapters, questions, options)
        await db.query('DELETE FROM quiz_sets WHERE id = $1', [quizSetId]);

        res.json({ success: true });

    } catch (error) {
        console.error('Quiz set deletion error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create chapter
router.post('/api/chapters', isAdmin, async (req, res) => {
    const { quiz_set_id, title } = req.body;

    if (!quiz_set_id || !title) {
        return res.status(400).json({ error: 'Quiz set ID and title are required' });
    }

    try {
        // Get current max sequence number
        const seqResult = await db.query(
            'SELECT MAX(sequence_number) AS max_seq FROM chapters WHERE quiz_set_id = $1',
            [quiz_set_id]
        );

        const sequenceNumber = (seqResult.rows[0].max_seq || 0) + 1;

        // Create chapter
        const result = await db.query(
            'INSERT INTO chapters (quiz_set_id, title, sequence_number) VALUES ($1, $2, $3) RETURNING *',
            [quiz_set_id, title, sequenceNumber]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Chapter creation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update chapter
router.put('/api/chapters/:id', isAdmin, async (req, res) => {
    const chapterId = req.params.id;
    const { title, sequence_number } = req.body;

    try {
        const result = await db.query(
            'UPDATE chapters SET title = $1, sequence_number = $2 WHERE id = $3 RETURNING *',
            [title, sequence_number, chapterId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Chapter not found' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Chapter update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete chapter
router.delete('/api/chapters/:id', isAdmin, async (req, res) => {
    const chapterId = req.params.id;

    try {
        // Delete chapter (cascade will delete questions, options)
        await db.query('DELETE FROM chapters WHERE id = $1', [chapterId]);

        res.json({ success: true });

    } catch (error) {
        console.error('Chapter deletion error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create question
router.post('/api/questions', isAdmin, upload.single('image'), async (req, res) => {
    const { chapter_id, question_text, explanation, type } = req.body;

    if (!chapter_id || !question_text || !type) {
        return res.status(400).json({ error: 'Chapter ID, question text, and type are required' });
    }

    try {
        // Get current max sequence number
        const seqResult = await db.query(
            'SELECT MAX(sequence_number) AS max_seq FROM questions WHERE chapter_id = $1',
            [chapter_id]
        );

        const sequenceNumber = (seqResult.rows[0].max_seq || 0) + 1;

        // Handle image upload
        const hasImage = !!req.file;
        const imagePath = hasImage ? req.file.filename : null;

        // Create question
        const result = await db.query(
            'INSERT INTO questions (chapter_id, question_text, explanation, sequence_number, type, has_image, image_path) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [chapter_id, question_text, explanation, sequenceNumber, type, hasImage, imagePath]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Question creation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update question
router.put('/api/questions/:id', isAdmin, upload.single('image'), async (req, res) => {
    const questionId = req.params.id;
    const { question_text, explanation, type, sequence_number } = req.body;

    try {
        let hasImage = false;
        let imagePath = null;

        // Check if there's an existing image
        const existingQuestion = await db.query('SELECT has_image, image_path FROM questions WHERE id = $1', [questionId]);

        if (existingQuestion.rows.length === 0) {
            return res.status(404).json({ error: 'Question not found' });
        }

        // If new image uploaded, update image info
        if (req.file) {
            hasImage = true;
            imagePath = req.file.filename;

            // Delete old image if exists
            if (existingQuestion.rows[0].has_image && existingQuestion.rows[0].image_path) {
                const oldImagePath = path.join(process.env.UPLOAD_DIR || 'uploads', existingQuestion.rows[0].image_path);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        } else {
            // Keep existing image
            hasImage = existingQuestion.rows[0].has_image;
            imagePath = existingQuestion.rows[0].image_path;
        }

        // Update question
        const result = await db.query(
            'UPDATE questions SET question_text = $1, explanation = $2, type = $3, sequence_number = $4, has_image = $5, image_path = $6 WHERE id = $7 RETURNING *',
            [question_text, explanation, type, sequence_number, hasImage, imagePath, questionId]
        );

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Question update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete question
router.delete('/api/questions/:id', isAdmin, async (req, res) => {
    const questionId = req.params.id;

    try {
        // Check if question has image
        const question = await db.query('SELECT has_image, image_path FROM questions WHERE id = $1', [questionId]);

        if (question.rows.length > 0 && question.rows[0].has_image && question.rows[0].image_path) {
            // Delete image file
            const imagePath = path.join(process.env.UPLOAD_DIR || 'uploads', question.rows[0].image_path);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Delete question (cascade will delete options)
        await db.query('DELETE FROM questions WHERE id = $1', [questionId]);

        res.json({ success: true });

    } catch (error) {
        console.error('Question deletion error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create option
router.post('/api/options', isAdmin, async (req, res) => {
    const { question_id, option_text, is_correct } = req.body;

    if (!question_id || !option_text) {
        return res.status(400).json({ error: 'Question ID and option text are required' });
    }

    try {
        // Get current max sequence number
        const seqResult = await db.query(
            'SELECT MAX(sequence_number) AS max_seq FROM options WHERE question_id = $1',
            [question_id]
        );

        const sequenceNumber = (seqResult.rows[0].max_seq || 0) + 1;

        // If this option is marked correct, update all other options to be incorrect
        if (is_correct) {
            await db.query(
                'UPDATE options SET is_correct = FALSE WHERE question_id = $1',
                [question_id]
            );
        }

        // Create option
        const result = await db.query(
            'INSERT INTO options (question_id, option_text, sequence_number, is_correct) VALUES ($1, $2, $3, $4) RETURNING *',
            [question_id, option_text, sequenceNumber, is_correct]