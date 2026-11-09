import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail, User } from 'lucide-react';
import { authErrorMessage, useAuth } from '../hooks/useAuth';
import AuthLayout from '../components/ui/AuthLayout';

const TEAMS = ['Equipe A', 'U19', 'U17', 'U15', 'U12'];

const Register: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [favorite, setFavorite] = useState(TEAMS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ name, email, password, favorite });
      navigate((location.state as { from?: string } | null)?.from ?? '/', { replace: true });
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      kicker="Rejoindre le club"
      title="Créer un compte"
      description="Rejoignez la communauté des supporters et ne manquez aucune actualité."
      footer={
        <Link to="/login" className="text-xs text-white/50 transition-colors hover:text-club-yellow">
          Déjà un compte ? Se connecter
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <label htmlFor="name" className="sr-only">Nom complet</label>
          <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nom complet"
            className="field pl-12"
          />
        </div>

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
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mot de passe (8 caractères minimum)"
            className="field pl-12"
          />
        </div>

        <div>
          <label htmlFor="favorite" className="mb-2 block text-xs font-bold uppercase tracking-wide text-white/50">
            Équipe suivie
          </label>
          <select
            id="favorite"
            value={favorite}
            onChange={(event) => setFavorite(event.target.value)}
            className="field appearance-none"
          >
            {TEAMS.map((team) => (
              <option key={team} value={team} className="bg-graphite">{team}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-center text-sm text-red-400">{error}</p>}

        <button type="submit" disabled={loading} className="btn-yellow w-full disabled:opacity-50">
          {loading ? 'Création…' : 'Créer mon compte'}
        </button>

        <p className="text-center text-[11px] text-white/40">
          En créant un compte, vous acceptez les conditions d'utilisation du site.
        </p>
      </form>
    </AuthLayout>
  );
};

export default Register;
