const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET MY NOTIFICATIONS
// GET /api/notifications
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load notifications.' });
  }
});

// MARK A NOTIFICATION AS READ
// PATCH /api/notifications/:id/read
router.patch('/:id/read', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    res.json({ message: 'Marked as read.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update notification.' });
  }
});

module.exports = router;
