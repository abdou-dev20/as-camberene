import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { authErrorMessage, useAuth } from '../hooks/useAuth';
import { isStaffRole } from '../lib/roles';
import AuthLayout from '../components/ui/AuthLayout';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(email, password);
      const from = (location.state as { from?: string } | null)?.from;

      if (isStaffRole(user.role)) {
        navigate(from?.startsWith('/admin') ? from : '/admin/dashboard', { replace: true });
      } else {
        navigate(from ?? '/', { replace: true });
      }
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      kicker="Espace supporter"
      title="Connexion"
      description="Retrouvez vos abonnements, vos commandes et l'actualité du club."
      footer={
        <p className="text-xs text-white/50">
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="font-bold text-club-yellow hover:underline">
            Créer un compte
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <label htmlFor="email" className="sr-only">Adresse e-mail</label>
          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Adresse e-mail"
            className="field pl-12"
          />
        </div>

        <div className="relative">
          <label htmlFor="password" className="sr-only">Mot de passe</label>
          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mot de passe"
            className="field px-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-club-yellow"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {error && <p className="text-center text-sm text-red-400">{error}</p>}

        <button type="submit" disabled={loading} className="btn-yellow w-full disabled:opacity-50">
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Login;
