import { useEffect, useState } from 'react';
import { api, isLoggedIn, getUser, RESUME_BASE } from '../api';

function PostJobForm({ onPosted }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('Full-time');
  const [salaryRange, setSalaryRange] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }
    setLoading(true);
    try {
      await api.postJob({ title, description, location, job_type: jobType, salary_range: salaryRange });
      setTitle(''); setDescription(''); setLocation(''); setSalaryRange('');
      onPosted();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <h3>Post a New Job</h3>
      <label>
        Job title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />
      </label>
      <label>
        Location
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Remote, Bengaluru" />
      </label>
      <label>
        Job type
        <select value={jobType} onChange={(e) => setJobType(e.target.value)}>
          <option>Full-time</option>
          <option>Part-time</option>
          <option>Remote</option>
          <option>Internship</option>
          <option>Contract</option>
        </select>
      </label>
      <label>
        Salary range (optional)
        <input value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)} placeholder="e.g. ₹6-9 LPA" />
      </label>
      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Posting...' : 'Post Job'}
      </button>
    </form>
  );
}

function ApplicantsList({ jobId }) {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api.jobApplicants(jobId).then(setApplicants).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [jobId]);

  async function updateStatus(appId, status) {
    await api.updateApplicationStatus(appId, status);
    load();
  }

  if (loading) return <p>Loading applicants...</p>;
  if (applicants.length === 0) return <p className="job-meta">No applicants yet.</p>;

  return (
    <div className="applicant-list">
      {applicants.map((a) => (
        <div key={a.id} className="applicant-card">
          <div>
            <strong>{a.candidate_name}</strong> &middot; {a.candidate_email}
            <p className="job-meta">Status: {a.status}</p>
            {a.cover_letter && <p className="cover-letter-preview">{a.cover_letter}</p>}
            <a href={`${RESUME_BASE}${a.resume_url}`} target="_blank" rel="noreferrer" className="btn-small">
              View Resume
            </a>
          </div>
          <div className="applicant-actions">
            <button className="btn-small" onClick={() => updateStatus(a.id, 'reviewed')}>Mark Reviewed</button>
            <button className="btn-small" onClick={() => updateStatus(a.id, 'accepted')}>Accept</button>
            <button className="btn-small btn-danger" onClick={() => updateStatus(a.id, 'rejected')}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EmployerDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState(null);
  const user = getUser();

  function loadJobs() {
    api.myJobs().then(setJobs).finally(() => setLoading(false));
  }

  useEffect(() => { loadJobs(); }, []);

  if (!isLoggedIn() || user?.role !== 'employer') {
    return <div className="page"><p>You need to log in as an employer to view this page.</p></div>;
  }

  return (
    <div className="page">
      <h1>Employer Dashboard</h1>
      <p className="job-meta">{user.company_name || user.name}</p>

      <PostJobForm onPosted={loadJobs} />

      <h2 className="section-heading">Your Job Postings</h2>
      {loading ? (
        <p>Loading...</p>
      ) : jobs.length === 0 ? (
        <p>You haven't posted any jobs yet.</p>
      ) : (
        <div className="posted-jobs-list">
          {jobs.map((job) => (
            <div key={job.id} className="posted-job-card">
              <div className="posted-job-header" onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}>
                <div>
                  <strong>{job.title}</strong>
                  <p className="job-meta">{job.location} &middot; {job.application_count} applicant{job.application_count !== '1' ? 's' : ''}</p>
                </div>
                <button className="btn-small">{expandedJobId === job.id ? 'Hide' : 'View Applicants'}</button>
              </div>
              {expandedJobId === job.id && <ApplicantsList jobId={job.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
