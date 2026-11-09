import React from 'react';
import { handleImageError } from '../../lib/imagePlaceholder';

interface PageHeroProps {
  kicker?: string;
  title: string;
  description?: string;
  image?: string;
  children?: React.ReactNode;
}

const PageHero: React.FC<PageHeroProps> = ({ kicker, title, description, image, children }) => (
  <section className={`page-hero ${image ? 'page-hero--image bg-graphite' : 'band-green'}`}>
    {image && (
      <img
        src={image}
        alt=""
        onError={handleImageError}
        className="absolute inset-0 h-full w-full object-cover"
      />
    )}
    <div className="site-container relative z-20 pb-12 pt-32">
      {kicker && <p className="page-hero__kicker text-shadow-hero">{kicker}</p>}
      <h1 className="page-hero__title text-shadow-hero">{title}</h1>
      {description && <p className="mt-4 max-w-2xl text-base text-white/80 md:text-lg">{description}</p>}
      {children && <div className="mt-8">{children}</div>}
    </div>
  </section>
);

export default PageHero;
