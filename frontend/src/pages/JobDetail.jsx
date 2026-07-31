import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, isLoggedIn, getUser } from '../api';

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [resumeFile, setResumeFile] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState('');

  const user = getUser();

  useEffect(() => {
    api.getJob(id)
      .then(setJob)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleApply(e) {
    e.preventDefault();
    setApplyError('');
    if (!resumeFile) {
      setApplyError('Please attach a resume (PDF, DOC, or DOCX).');
      return;
    }
    setApplying(true);
    try {
      await api.applyToJob(id, resumeFile, coverLetter);
      setApplySuccess(true);
    } catch (err) {
      setApplyError(err.message);
    } finally {
      setApplying(false);
    }
  }

  if (loading) return <div className="page"><p>Loading job...</p></div>;
  if (error) return <div className="page"><p className="error-text">{error}</p></div>;
  if (!job) return null;

  return (
    <div className="page">
      <h1>{job.title}</h1>
      <p className="job-meta">{job.company_name || job.employer_name} &middot; {job.location || 'Remote'}</p>
      <div className="job-tags">
        {job.job_type && <span className="job-type-tag">{job.job_type}</span>}
        {job.salary_range && <span className="job-type-tag">{job.salary_range}</span>}
      </div>

      <h3>Description</h3>
      <p className="job-description">{job.description}</p>

      {!isLoggedIn() ? (
        <p>Please <a href="/login">log in</a> as a candidate to apply.</p>
      ) : user?.role !== 'candidate' ? (
        <p>Only candidate accounts can apply to jobs.</p>
      ) : applySuccess ? (
        <div className="success-box">Application submitted! You can track its status from your dashboard.</div>
      ) : (
        <form onSubmit={handleApply} className="form apply-form">
          <h3>Apply to this job</h3>
          <label>
            Resume (PDF, DOC, or DOCX, max 5MB)
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResumeFile(e.target.files[0])}
              required
            />
          </label>
          <label>
            Cover letter (optional)
            <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} rows={4} />
          </label>
          {applyError && <p className="error-text">{applyError}</p>}
          <button type="submit" className="btn btn-primary" disabled={applying}>
            {applying ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      )}
    </div>
  );
}
