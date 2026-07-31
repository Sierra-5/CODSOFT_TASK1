import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, saveToken, saveUser } from '../api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('candidate');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.register(name, email, password, role, role === 'employer' ? companyName : null);
      saveToken(data.token);
      saveUser(data.user);
      navigate(role === 'employer' ? '/dashboard/employer' : '/jobs');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page auth-page">
      <h1>Create an account</h1>
      <form onSubmit={handleSubmit} className="form">
        <div className="role-toggle">
          <button
            type="button"
            className={role === 'candidate' ? 'role-btn active' : 'role-btn'}
            onClick={() => setRole('candidate')}
          >
            I'm looking for a job
          </button>
          <button
            type="button"
            className={role === 'employer' ? 'role-btn active' : 'role-btn'}
            onClick={() => setRole('employer')}
          >
            I'm hiring
          </button>
        </div>

        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        {role === 'employer' && (
          <label>
            Company name
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </label>
        )}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>
      <p>Already have an account? <Link to="/login">Log in</Link></p>
    </div>
  );
}
