import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Home() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listJobs().then((data) => setJobs(data.slice(0, 3))).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page home-page">
      <h1>Find your next role, or your next hire</h1>
      <p>JobBoard connects employers posting real openings with candidates ready to apply.</p>
      <div className="home-actions">
        <Link to="/jobs" className="btn btn-primary">Browse Jobs</Link>
        <Link to="/register" className="btn btn-secondary">Get Started</Link>
      </div>

      <h2 className="section-heading">Featured Listings</h2>
      {loading ? (
        <p>Loading...</p>
      ) : jobs.length === 0 ? (
        <p>No jobs posted yet — be the first employer to post one.</p>
      ) : (
        <div className="job-grid">
          {jobs.map((job) => (
            <div key={job.id} className="job-card">
              <h3>{job.title}</h3>
              <p className="job-meta">{job.company_name || job.employer_name} &middot; {job.location || 'Remote'}</p>
              {job.job_type && <span className="job-type-tag">{job.job_type}</span>}
              <Link to={`/jobs/${job.id}`} className="btn btn-small btn-primary">View Job</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
