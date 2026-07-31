import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function JobListings() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function loadJobs(s = search, l = location) {
    setLoading(true);
    api.listJobs(s, l)
      .then(setJobs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadJobs();
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    loadJobs();
  }

  return (
    <div className="page">
      <h1>Browse Jobs</h1>

      <form onSubmit={handleSearch} className="search-bar">
        <input
          type="text"
          placeholder="Search by title or keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      {loading ? (
        <p>Loading jobs...</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : jobs.length === 0 ? (
        <p>No jobs match your search.</p>
      ) : (
        <div className="job-grid">
          {jobs.map((job) => (
            <div key={job.id} className="job-card">
              <h3>{job.title}</h3>
              <p className="job-meta">{job.company_name || job.employer_name} &middot; {job.location || 'Remote'}</p>
              {job.job_type && <span className="job-type-tag">{job.job_type}</span>}
              {job.salary_range && <p className="job-salary">{job.salary_range}</p>}
              <Link to={`/jobs/${job.id}`} className="btn btn-small btn-primary">View Job</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
