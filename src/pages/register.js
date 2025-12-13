/**
 * Register Page (Next.js)
 * New user registration form
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    student_number: '',
    employee_number: '',
    title: '',
    department_id: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        console.log('Fetching departments...');
        const response = await api.get('/departments');
        console.log('Departments response:', response.data);
        if (response.data && response.data.data) {
          setDepartments(response.data.data || []);
          console.log('Departments loaded:', response.data.data.length);
        } else if (response.data && Array.isArray(response.data)) {
          // Alternatif format desteği
          setDepartments(response.data);
          console.log('Departments loaded (alt format):', response.data.length);
        }
      } catch (err) {
        console.error('Failed to fetch departments:', err);
        console.error('Error details:', err.response?.data || err.message);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
    setSuccess('');

    // Real-time password validation
    if (name === 'password') {
      setPasswordErrors({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /\d/.test(value),
        special: /[@$!%*?&#]/.test(value)
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Detailed password validation
    const passwordIssues = [];
    if (formData.password.length < 8) passwordIssues.push('en az 8 karakter');
    if (!/[A-Z]/.test(formData.password)) passwordIssues.push('en az 1 büyük harf');
    if (!/[a-z]/.test(formData.password)) passwordIssues.push('en az 1 küçük harf');
    if (!/\d/.test(formData.password)) passwordIssues.push('en az 1 rakam');
    if (!/[@$!%*?&#]/.test(formData.password)) passwordIssues.push('en az 1 özel karakter (@$!%*?&#)');
    
    if (passwordIssues.length > 0) {
      setError(`Şifre eksiklikleri: ${passwordIssues.join(', ')}`);
      setLoading(false);
      return;
    }

    const registrationData = {
      email: formData.email,
      password: formData.password,
      role: formData.role
    };

    if (formData.role === 'student') {
      if (!formData.student_number) {
        setError('Student number is required');
        setLoading(false);
        return;
      }
      registrationData.student_number = formData.student_number;
      if (formData.department_id) {
        registrationData.department_id = formData.department_id;
      }
    } else if (formData.role === 'faculty') {
      if (!formData.employee_number) {
        setError('Employee number is required');
        setLoading(false);
        return;
      }
      registrationData.employee_number = formData.employee_number;
      if (formData.title) registrationData.title = formData.title;
      if (formData.department_id) {
        registrationData.department_id = formData.department_id;
      }
    }

    const result = await register(registrationData);
    setLoading(false);

    if (result.success) {
      setSuccess('Registration successful! Please check your email to verify your account.');
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        student_number: '',
        employee_number: '',
        title: '',
        department_id: ''
      });
      
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } else {
      setError(result.error);
    }
  };

  return (
    <>
      <Head>
        <title>Register - Smart Campus Platform</title>
      </Head>

      <div className="auth-container">
        <div className="auth-card register-card">
          <div className="auth-header">
            <h1>🎓 Smart Campus</h1>
            <h2>Create Account</h2>
            <p>Join the Smart Campus community</p>
          </div>

          {error && (
            <div className="error-message">
              <span>❌</span> {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              <span>✅</span> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@smartcampus.edu"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Şifre</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Güçlü bir şifre oluşturun"
                required
              />
              {formData.password && (
                <div className="password-requirements">
                  <small style={{ color: passwordErrors.length ? '#27ae60' : '#e74c3c' }}>
                    {passwordErrors.length ? '✓' : '✗'} En az 8 karakter
                  </small>
                  <small style={{ color: passwordErrors.uppercase ? '#27ae60' : '#e74c3c' }}>
                    {passwordErrors.uppercase ? '✓' : '✗'} Bir büyük harf (A-Z)
                  </small>
                  <small style={{ color: passwordErrors.lowercase ? '#27ae60' : '#e74c3c' }}>
                    {passwordErrors.lowercase ? '✓' : '✗'} Bir küçük harf (a-z)
                  </small>
                  <small style={{ color: passwordErrors.number ? '#27ae60' : '#e74c3c' }}>
                    {passwordErrors.number ? '✓' : '✗'} Bir rakam (0-9)
                  </small>
                  <small style={{ color: passwordErrors.special ? '#27ae60' : '#e74c3c' }}>
                    {passwordErrors.special ? '✓' : '✗'} Bir özel karakter (@$!%*?&#)
                  </small>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Şifre Tekrarı</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Şifrenizi tekrar girin"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Rol</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="student">Öğrenci</option>
                <option value="faculty">Öğretim Üyesi</option>
                <option value="staff">Personel</option>
              </select>
            </div>

            {formData.role === 'student' && (
              <>
                <div className="form-group">
                  <label htmlFor="student_number">Öğrenci Numarası</label>
                  <input
                    type="text"
                    id="student_number"
                    name="student_number"
                    value={formData.student_number}
                    onChange={handleChange}
                    placeholder="Örnek: 20240001"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="department_id">Bölüm (Opsiyonel)</label>
                  <select
                    id="department_id"
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleChange}
                  >
                    <option value="">Bölüm seçin (isteğe bağlı)</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {formData.role === 'faculty' && (
              <>
                <div className="form-group">
                  <label htmlFor="employee_number">Personel Numarası</label>
                  <input
                    type="text"
                    id="employee_number"
                    name="employee_number"
                    value={formData.employee_number}
                    onChange={handleChange}
                    placeholder="Örnek: FAC001"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="title">Unvan (Opsiyonel)</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Örnek: Prof. Dr., Doç. Dr."
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="department_id">Bölüm (Opsiyonel)</label>
                  <select
                    id="department_id"
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleChange}
                  >
                    <option value="">Bölüm seçin (isteğe bağlı)</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Hesap Oluşturuluyor...' : 'Kayıt Ol'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Zaten hesabınız var mı? <Link href="/login">Giriş yapın</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
