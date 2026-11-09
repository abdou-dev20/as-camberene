import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  linkLabel?: string;
  linkTo?: string;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, linkLabel, linkTo, className = '' }) => (
  <header className={`flex items-center justify-between gap-4 ${className}`}>
    <h2 className="section-title">{title}</h2>
    {linkLabel && linkTo && (
      <Link to={linkTo} className="section-link">
        {linkLabel}
        <ArrowRight size={18} className="text-club-yellow" />
      </Link>
    )}
  </header>
);

export default SectionHeader;
