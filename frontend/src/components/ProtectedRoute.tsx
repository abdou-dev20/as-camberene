import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Permission, ROLE_LABELS, isStaffRole } from '../lib/roles';
import LoadingSpinner from './LoadingSpinner';

interface Props {
  children: React.ReactNode;
  permission?: Permission;
}

const ProtectedRoute: React.FC<Props> = ({ children, permission }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-graphite flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (!isStaffRole(user.role)) return <Navigate to="/" replace />;

  if (permission && !user.permissions.includes(permission)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-graphite px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-extrabold uppercase text-white">Rubrique non autorisée</h1>
          <p className="mt-3 text-sm text-white/60">
            Votre profil ({ROLE_LABELS[user.role]}) n'a pas accès à cette partie de
            l'administration. Demandez le droit au super administrateur du club.
          </p>
          <Link to="/admin" className="btn-yellow mt-8">Retour au tableau de bord</Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
