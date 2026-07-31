import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { isLoggedIn, logout, getUser } from './api';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import JobListings from './pages/JobListings.jsx';
import JobDetail from './pages/JobDetail.jsx';
import EmployerDashboard from './pages/EmployerDashboard.jsx';
import CandidateDashboard from './pages/CandidateDashboard.jsx';

function Navbar() {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const user = getUser();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand">JobBoard</Link>
      <div className="nav-links">
        <Link to="/jobs">Browse Jobs</Link>
        {loggedIn && user?.role === 'employer' && <Link to="/dashboard/employer">Dashboard</Link>}
        {loggedIn && user?.role === 'candidate' && <Link to="/dashboard/candidate">My Applications</Link>}
        {loggedIn ? (
          <>
            <span className="user-greeting">{user?.name} &middot; {user?.role}</span>
            <button onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/jobs" element={<JobListings />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/dashboard/employer" element={<EmployerDashboard />} />
          <Route path="/dashboard/candidate" element={<CandidateDashboard />} />
        </Routes>
      </main>
    </div>
  );
}
