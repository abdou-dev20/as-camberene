import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => (
  <div className="band-green flex min-h-screen flex-col items-center justify-center px-6 py-32 text-center">
    <p className="text-sm font-bold uppercase tracking-[0.3em] text-club-yellow">Erreur 404</p>
    <h1 className="mt-4 max-w-2xl text-4xl font-extrabold uppercase text-white md:text-6xl">
      Cette page n'existe pas
    </h1>
    <p className="mt-4 max-w-md text-sm text-white/70">
      La page recherchée a peut-être été déplacée, renommée, ou n'a jamais existé.
    </p>
    <div className="mt-10 flex flex-col gap-3 sm:flex-row">
      <Link to="/" className="btn-yellow">Retour à l'accueil</Link>
      <Link to="/shop" className="btn-ghost">Visiter la boutique</Link>
    </div>
  </div>
);

export default NotFound;
