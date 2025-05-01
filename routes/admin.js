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
            [question_id, option_text, sequenceNumber, is_correct || false]
        ); // Added closing parenthesis here

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Option creation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});