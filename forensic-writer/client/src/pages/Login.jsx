import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, Mail, Shield, ChevronRight, Eye, EyeOff, Activity } from 'lucide-react';
import { NetworkBackground } from '../components/NetworkBackground';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ identifier: '', password: '', role: 'investigator' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage('Login successful! Redirecting...');
        login(data.user, data.token);
        setTimeout(() => {
          if (data.user.role === 'admin') navigate('/admin/dashboard');
          else if (data.user.role === 'investigator') navigate('/investigator/dashboard');
          else if (data.user.role === 'legal_advisor') navigate('/legal/dashboard');
        }, 1200);
      } else {
        setIsError(true);
        setMessage(data.message || 'Login failed');
      }
    } catch {
      setIsError(true);
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'relative', minHeight: '100vh',
      background: '#050B14',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', overflow: 'hidden',
    }}>
      <NetworkBackground />

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top right, rgba(11,18,32,0.8), transparent, rgba(34,211,238,0.05))',
        zIndex: 0,
      }} />
      {/* Glow orb */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 600, height: 600,
        background: 'rgba(34,211,238,0.1)',
        borderRadius: '50%', filter: 'blur(120px)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Card */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 64, height: 64,
            background: 'rgba(11,18,32,0.8)',
            border: '1px solid rgba(34,211,238,0.3)',
            borderRadius: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: '0 0 30px rgba(34,211,238,0.2)',
            backdropFilter: 'blur(8px)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, rgba(34,211,238,0.2), transparent)',
              opacity: 0.5,
            }} />
            <Activity size={32} color="#22D3EE" style={{ position: 'relative', zIndex: 1 }} />
          </div>
          <h1 style={{
            fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 700,
            color: '#fff', letterSpacing: '0.1em', margin: 0,
          }}>
            FORENSIC<span style={{ color: '#22D3EE' }}>.AI</span>
          </h1>
          <p style={{
            color: '#94A3B8', fontSize: '0.75rem', marginTop: '0.25rem',
            letterSpacing: '0.15em', textTransform: 'uppercase',
          }}>
            Automated Reporting System
          </p>
        </div>

        {/* Auth card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            background: 'rgba(11,18,32,0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Neon top border */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(to right, transparent, #22D3EE, transparent)',
          }} />

          {/* Tabs */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginBottom: '2rem', paddingBottom: '1rem',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <button style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '1.1rem', fontWeight: 700, color: '#fff',
              position: 'relative', padding: '0 0 4px 0',
            }}>
              Login
              <div style={{
                position: 'absolute', bottom: -17, left: 0, right: 0,
                height: 2, background: '#22D3EE',
              }} />
            </button>
            <button
              onClick={() => navigate('/signup')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '1.1rem', fontWeight: 700, color: '#64748B',
                padding: '0 0 4px 0',
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Error / success message */}
          {message && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              background: isError ? 'rgba(239,68,68,0.1)' : 'rgba(34,211,238,0.1)',
              border: `1px solid ${isError ? 'rgba(239,68,68,0.3)' : 'rgba(34,211,238,0.3)'}`,
              color: isError ? '#f87171' : '#22D3EE',
            }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Email / Username */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Work Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="#64748B" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  placeholder="agent.smith@forensics.gov"
                  required
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(30,41,59,0.5)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                    color: '#fff', fontSize: '0.95rem',
                    outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(34,211,238,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Password
                </label>
                <a href="#" style={{ fontSize: '0.75rem', color: '#22D3EE', textDecoration: 'none' }}>Forgot?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="#64748B" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  required
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(30,41,59,0.5)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 2.75rem 0.75rem 2.75rem',
                    color: '#fff', fontSize: '0.95rem',
                    outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(34,211,238,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Access Level
              </label>
              <div style={{ position: 'relative' }}>
                <Shield size={18} color="#64748B" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(30,41,59,0.5)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                    color: '#fff', fontSize: '0.95rem',
                    outline: 'none', appearance: 'none', cursor: 'pointer',
                  }}
                >
                  <option value="admin" style={{ background: '#1e293b' }}>System Admin</option>
                  <option value="investigator" style={{ background: '#1e293b' }}>Forensic Investigator</option>
                  <option value="legal_advisor" style={{ background: '#1e293b' }}>Legal Advisor</option>
                </select>
                <ChevronRight size={16} color="#64748B" style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%) rotate(90deg)',
                  pointerEvents: 'none',
                }} />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', marginTop: '0.5rem',
                background: loading ? 'rgba(34,211,238,0.5)' : '#22D3EE',
                color: '#0f172a',
                fontWeight: 700, fontSize: '1rem',
                padding: '0.85rem 1rem',
                borderRadius: '0.75rem',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: '0 0 20px rgba(34,211,238,0.3)',
                transition: 'all 0.2s',
              }}
            >
              <span>{loading ? 'Authenticating...' : 'Initiate Session'}</span>
              {!loading && <ChevronRight size={20} />}
            </button>
          </form>

          {/* Footer note */}
          <div style={{
            marginTop: '2rem', paddingTop: '1.25rem',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            textAlign: 'center',
          }}>
            <p style={{ color: '#64748B', fontSize: '0.75rem' }}>
              Secure connection established. All activities are monitored and logged.
            </p>
          </div>
        </motion.div>

        {/* Back link */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#64748B', fontSize: '0.875rem',
              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#22D3EE'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
          >
            <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
            Return to Dashboard Overview
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
