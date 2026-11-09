import React from 'react';

interface AuthLayoutProps {
  kicker: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ kicker, title, description, children, footer }) => (
  <div className="band-green flex min-h-screen items-center justify-center px-4 py-28">
    <div className="w-full max-w-lg rounded-[20px] border border-white/10 bg-graphite p-8 shadow-2xl sm:p-10">
      <div className="mb-8 text-center">
        <img
          src="/assets/img/asc-camberene-logo-officiel.png"
          alt="ASC Cambérène"
          className="mx-auto h-16 w-16 object-contain"
        />
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.3em] text-club-yellow">{kicker}</p>
        <h1 className="mt-2 text-3xl font-extrabold uppercase text-white">{title}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-white/60">{description}</p>
      </div>

      {children}

      {footer && <div className="mt-8 text-center">{footer}</div>}
    </div>
  </div>
);

export default AuthLayout;
