const db = require('./db');
const path = require('path');

async function seedDatabase() {
    console.log('Importing initial quiz data...');

    try {
        // Import quiz data from existing file
        const quizDataPath = path.join(__dirname, '..', 'public', 'quizData.js');
        let quizData;

        try {
            // Try to load quizData directly
            quizData = require(quizDataPath);
        } catch (e) {
            console.error('Error loading quizData.js:', e);
            console.log('Attempting to load via a temporary variable...');

            // Alternative method using global variable
            global.quizData = {};
            require(quizDataPath);
            quizData = global.quizData;
        }

        if (!quizData || Object.keys(quizData).length === 0) {
            throw new Error('Failed to load quiz data');
        }

        console.log('Quiz data loaded successfully');

        // Start a transaction
        await db.query('BEGIN');

        // Get admin user
        const adminResult = await db.query('SELECT id FROM users WHERE is_admin = TRUE LIMIT 1');
        const adminId = adminResult.rows[0]?.id || 1;

        for (const quizKey in quizData) {
            const quiz = quizData[quizKey];

            // Skip if quiz doesn't have the expected structure
            if (!quiz.title || !quiz.chapters || !Array.isArray(quiz.chapters)) {
                console.warn(`Skipping invalid quiz: ${quizKey}`);
                continue;
            }

            // Insert quiz set
            const quizSetResult = await db.query(
                'INSERT INTO quiz_sets (title, description, created_by) VALUES ($1, $2, $3) RETURNING id',
                [quiz.title, `Imported from quizData.js (${quizKey})`, adminId]
            );

            const quizSetId = quizSetResult.rows[0].id;
            console.log(`Created quiz set "${quiz.title}" with ID ${quizSetId}`);

            // Insert chapters
            for (let chapterIndex = 0; chapterIndex < quiz.chapters.length; chapterIndex++) {
                const chapter = quiz.chapters[chapterIndex];

                // Skip if chapter doesn't have the expected structure
                if (!chapter.title || !chapter.questions || !Array.isArray(chapter.questions)) {
                    console.warn(`Skipping invalid chapter at index ${chapterIndex}`);
                    continue;
                }

                const chapterResult = await db.query(
                    'INSERT INTO chapters (quiz_set_id, title, sequence_number) VALUES ($1, $2, $3) RETURNING id',
                    [quizSetId, chapter.title, chapterIndex + 1]
                );

                const chapterId = chapterResult.rows[0].id;
                console.log(`Created chapter "${chapter.title}" with ID ${chapterId}`);

                // Insert questions
                for (let questionIndex = 0; questionIndex < chapter.questions.length; questionIndex++) {
                    const question = chapter.questions[questionIndex];

                    // Skip if question doesn't have the expected structure
                    if (!question.question || !question.options || !Array.isArray(question.options)) {
                        console.warn(`Skipping invalid question at index ${questionIndex}`);
                        continue;
                    }

                    const questionResult = await db.query(
                        'INSERT INTO questions (chapter_id, question_text, explanation, sequence_number, type) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                        [chapterId, question.question, question.explanation, questionIndex + 1, question.type || 'multiple']
                    );

                    const questionId = questionResult.rows[0].id;

                    // Insert options
                    for (let optionIndex = 0; optionIndex < question.options.length; optionIndex++) {
                        const option = question.options[optionIndex];
                        const isCorrect = (optionIndex === question.correct);

                        await db.query(
                            'INSERT INTO options (question_id, option_text, sequence_number, is_correct) VALUES ($1, $2, $3, $4)',
                            [questionId, option, optionIndex + 1, isCorrect]
                        );
                    }
                }
            }
        }

        // Commit the transaction
        await db.query('COMMIT');
        console.log('Quiz data import completed successfully!');

    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error seeding database:', error);
    } finally {
        // Close pool
        db.pool.end();
    }
}

seedDatabase();