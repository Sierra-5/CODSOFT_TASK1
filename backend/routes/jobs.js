const express = require('express');
const { pool } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// CREATE A JOB POSTING (employers only)
// POST /api/jobs
router.post('/', requireAuth, requireRole('employer'), async (req, res) => {
  const { title, description, location, job_type, salary_range } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO jobs (employer_id, title, description, location, job_type, salary_range)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [req.user.id, title, description, location || null, job_type || null, salary_range || null]
    );

    res.status(201).json({ id: result.rows[0].id, message: 'Job posted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong posting the job.' });
  }
});

// LIST / SEARCH JOBS (public, no login required to browse)
// GET /api/jobs?search=react&location=remote
router.get('/', async (req, res) => {
  const { search, location } = req.query;

  try {
    let query = `
      SELECT j.id, j.title, j.description, j.location, j.job_type, j.salary_range, j.created_at,
             u.name AS employer_name, u.company_name
      FROM jobs j
      JOIN job_users u ON j.employer_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (j.title ILIKE $${params.length} OR j.description ILIKE $${params.length})`;
    }
    if (location) {
      params.push(`%${location}%`);
      query += ` AND j.location ILIKE $${params.length}`;
    }

    query += ' ORDER BY j.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load job listings.' });
  }
});

// GET ONE JOB'S DETAILS
// GET /api/jobs/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT j.*, u.name AS employer_name, u.company_name
       FROM jobs j
       JOIN job_users u ON j.employer_id = u.id
       WHERE j.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load job details.' });
  }
});

// GET JOBS POSTED BY THE LOGGED-IN EMPLOYER (for their dashboard)
// GET /api/jobs/mine/list
router.get('/mine/list', requireAuth, requireRole('employer'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT j.*,
              (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS application_count
       FROM jobs j
       WHERE j.employer_id = $1
       ORDER BY j.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load your job postings.' });
  }
});

module.exports = router;
