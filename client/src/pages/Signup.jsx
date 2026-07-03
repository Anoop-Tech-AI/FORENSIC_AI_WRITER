import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Mail, User, Shield, ChevronRight, Eye, EyeOff, Activity } from 'lucide-react';
import { NetworkBackground } from '../components/NetworkBackground';
import { API_URL } from '../config/api';

const Signup = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState('signup'); // 'signup' | 'otp'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [otp, setOtp] = useState('');

  const [formData, setFormData] = useState({
    username: '', email: '', password: '', role: 'investigator',
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok) {
        setIsError(false);
        setMessage('OTP sent to your email! Please verify below.');
        setStep('otp');
      } else {
        setIsError(true);
        setMessage(data.message || 'Registration failed');
      }
    } catch {
      setIsError(true);
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp }),
      });
      const data = await response.json();

      if (response.ok) {
        setIsError(false);
        setMessage('Account created successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setIsError(true);
        setMessage(data.message || 'OTP verification failed');
      }
    } catch {
      setIsError(true);
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(30,41,59,0.5)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0.75rem',
    padding: '0.75rem 1rem 0.75rem 2.75rem',
    color: '#fff', fontSize: '0.95rem', outline: 'none',
  };

  const labelStyle = {
    fontSize: '0.7rem', fontWeight: 600, color: '#94A3B8',
    textTransform: 'uppercase', letterSpacing: '0.1em',
  };

  return (
    <div style={{
      position: 'relative', minHeight: '100vh',
      background: '#050B14',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', overflow: 'hidden',
    }}>
      <NetworkBackground />

      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top right, rgba(11,18,32,0.8), transparent, rgba(34,211,238,0.05))',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 600, height: 600,
        background: 'rgba(34,211,238,0.1)',
        borderRadius: '50%', filter: 'blur(120px)',
        pointerEvents: 'none', zIndex: 0,
      }} />

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

        {/* Card */}
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
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '1.1rem', fontWeight: 700, color: '#64748B',
                padding: '0 0 4px 0',
              }}
            >
              Login
            </button>
            <button style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '1.1rem', fontWeight: 700, color: '#fff',
              position: 'relative', padding: '0 0 4px 0',
            }}>
              Sign Up
              <div style={{
                position: 'absolute', bottom: -17, left: 0, right: 0,
                height: 2, background: '#22D3EE',
              }} />
            </button>
          </div>

          {/* Message */}
          {message && (
            <div style={{
              padding: '0.75rem 1rem', borderRadius: '0.5rem',
              marginBottom: '1.25rem', fontSize: '0.875rem',
              background: isError ? 'rgba(239,68,68,0.1)' : 'rgba(34,211,238,0.1)',
              border: `1px solid ${isError ? 'rgba(239,68,68,0.3)' : 'rgba(34,211,238,0.3)'}`,
              color: isError ? '#f87171' : '#22D3EE',
            }}>
              {message}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 'signup' ? (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSignupSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                {/* Full Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={labelStyle}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} color="#64748B" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text" name="username"
                      value={formData.username} onChange={handleChange}
                      placeholder="Agent Smith" required
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'rgba(34,211,238,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>
                </div>

                {/* Email */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={labelStyle}>Work Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} color="#64748B" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email" name="email"
                      value={formData.email} onChange={handleChange}
                      placeholder="agent.smith@forensics.gov" required
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'rgba(34,211,238,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>
                </div>

                {/* Password */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={labelStyle}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} color="#64748B" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'} name="password"
                      value={formData.password} onChange={handleChange}
                      placeholder="••••••••••••" required
                      style={{ ...inputStyle, paddingRight: '2.75rem' }}
                      onFocus={e => e.target.style.borderColor = 'rgba(34,211,238,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 0 }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Role */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={labelStyle}>Access Level</label>
                  <div style={{ position: 'relative' }}>
                    <Shield size={18} color="#64748B" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <select name="role" value={formData.role} onChange={handleChange}
                      style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                      <option value="admin" style={{ background: '#1e293b' }}>System Admin</option>
                      <option value="investigator" style={{ background: '#1e293b' }}>Forensic Investigator</option>
                      <option value="legal_advisor" style={{ background: '#1e293b' }}>Legal Advisor</option>
                    </select>
                    <ChevronRight size={16} color="#64748B" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none' }} />
                  </div>
                </div>

                <button type="submit" disabled={loading} style={{
                  width: '100%', marginTop: '0.5rem',
                  background: loading ? 'rgba(34,211,238,0.5)' : '#22D3EE',
                  color: '#0f172a', fontWeight: 700, fontSize: '1rem',
                  padding: '0.85rem 1rem', borderRadius: '0.75rem',
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  boxShadow: '0 0 20px rgba(34,211,238,0.3)',
                }}>
                  <span>{loading ? 'Sending OTP...' : 'Request Access'}</span>
                  {!loading && <ChevronRight size={20} />}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleOtpSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: 0 }}>
                  We've sent a verification code to <strong style={{ color: '#22D3EE' }}>{formData.email}</strong>. Enter it below to complete registration.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={labelStyle}>OTP Code</label>
                  <input
                    type="text" value={otp}
                    onChange={e => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    maxLength="6" required
                    style={{
                      ...inputStyle,
                      paddingLeft: '1rem',
                      letterSpacing: '0.3em',
                      fontSize: '1.2rem',
                      textAlign: 'center',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(34,211,238,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>

                <button type="submit" disabled={loading} style={{
                  width: '100%',
                  background: loading ? 'rgba(34,211,238,0.5)' : '#22D3EE',
                  color: '#0f172a', fontWeight: 700, fontSize: '1rem',
                  padding: '0.85rem 1rem', borderRadius: '0.75rem',
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  boxShadow: '0 0 20px rgba(34,211,238,0.3)',
                }}>
                  <span>{loading ? 'Verifying...' : 'Verify & Complete Signup'}</span>
                  {!loading && <ChevronRight size={20} />}
                </button>

                <button type="button" onClick={() => setStep('signup')} style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid #334155',
                  color: '#94A3B8', fontWeight: 600, fontSize: '0.95rem',
                  padding: '0.75rem 1rem', borderRadius: '0.75rem',
                  cursor: 'pointer',
                }}>
                  ← Back to Registration
                </button>
              </motion.form>
            )}
          </AnimatePresence>

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

export default Signup;
