const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { pool } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Where uploaded resumes get saved
const uploadDir = path.join(__dirname, '..', 'uploads', 'resumes');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

// Only allow PDF/doc/docx resumes, max 5MB
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, or DOCX files are allowed for resumes.'));
    }
  }
});

// APPLY TO A JOB (candidates only) - resume file upload
// POST /api/applications/:jobId
router.post('/:jobId', requireAuth, requireRole('candidate'), upload.single('resume'), async (req, res) => {
  const { jobId } = req.params;
  const { cover_letter } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'A resume file is required.' });
  }

  try {
    const jobCheck = await pool.query('SELECT id, employer_id FROM jobs WHERE id = $1', [jobId]);
    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    const resumeUrl = `/uploads/resumes/${req.file.filename}`;

    const result = await pool.query(
      `INSERT INTO applications (job_id, candidate_id, resume_url, cover_letter)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [jobId, req.user.id, resumeUrl, cover_letter || null]
    );

    // Notify the employer in-app
    await pool.query(
      `INSERT INTO notifications (user_id, message) VALUES ($1, $2)`,
      [jobCheck.rows[0].employer_id, `${req.user.name} applied to your job posting.`]
    );

    res.status(201).json({ id: result.rows[0].id, message: 'Application submitted successfully.' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'You already applied to this job.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong submitting your application.' });
  }
});

// GET APPLICATIONS FOR A JOB (employer viewing applicants to their posting)
// GET /api/applications/job/:jobId
router.get('/job/:jobId', requireAuth, requireRole('employer'), async (req, res) => {
  const { jobId } = req.params;
  try {
    const jobCheck = await pool.query('SELECT employer_id FROM jobs WHERE id = $1', [jobId]);
    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found.' });
    }
    if (jobCheck.rows[0].employer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only view applicants for your own job postings.' });
    }

    const result = await pool.query(
      `SELECT a.id, a.resume_url, a.cover_letter, a.status, a.applied_at,
              u.name AS candidate_name, u.email AS candidate_email
       FROM applications a
       JOIN job_users u ON a.candidate_id = u.id
       WHERE a.job_id = $1
       ORDER BY a.applied_at DESC`,
      [jobId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load applicants.' });
  }
});

// GET MY APPLICATIONS (candidate viewing their own application history)
// GET /api/applications/mine
router.get('/mine/list', requireAuth, requireRole('candidate'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.status, a.applied_at, j.title, j.location, u.company_name
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN job_users u ON j.employer_id = u.id
       WHERE a.candidate_id = $1
       ORDER BY a.applied_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load your applications.' });
  }
});

// UPDATE APPLICATION STATUS (employer accepts/rejects/reviews)
// PATCH /api/applications/:id/status
router.patch('/:id/status', requireAuth, requireRole('employer'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'reviewed', 'accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  try {
    const check = await pool.query(
      `SELECT a.candidate_id, j.employer_id, j.title
       FROM applications a JOIN jobs j ON a.job_id = j.id
       WHERE a.id = $1`,
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found.' });
    }
    if (check.rows[0].employer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update applications for your own job postings.' });
    }

    await pool.query('UPDATE applications SET status = $1 WHERE id = $2', [status, id]);

    // Notify the candidate in-app
    await pool.query(
      `INSERT INTO notifications (user_id, message) VALUES ($1, $2)`,
      [check.rows[0].candidate_id, `Your application for "${check.rows[0].title}" was updated to: ${status}.`]
    );

    res.json({ message: 'Application status updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update application status.' });
  }
});

module.exports = router;
