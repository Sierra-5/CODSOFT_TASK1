import { useEffect, useState } from 'react';
import { api, isLoggedIn, getUser } from '../api';

const statusColors = {
  pending: 'status-pending',
  reviewed: 'status-reviewed',
  accepted: 'status-accepted',
  rejected: 'status-rejected'
};

export default function CandidateDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    api.myApplications().then(setApplications).finally(() => setLoading(false));
  }, []);

  if (!isLoggedIn() || user?.role !== 'candidate') {
    return <div className="page"><p>You need to log in as a candidate to view this page.</p></div>;
  }

  return (
    <div className="page">
      <h1>My Applications</h1>
      <p className="job-meta">{user.name}</p>

      {loading ? (
        <p>Loading...</p>
      ) : applications.length === 0 ? (
        <p>You haven't applied to any jobs yet. <a href="/jobs">Browse jobs</a> to get started.</p>
      ) : (
        <div className="application-list">
          {applications.map((app) => (
            <div key={app.id} className="application-card">
              <div>
                <strong>{app.title}</strong>
                <p className="job-meta">{app.company_name} &middot; {app.location}</p>
              </div>
              <span className={`status-badge ${statusColors[app.status]}`}>{app.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
