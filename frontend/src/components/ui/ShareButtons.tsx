import React, { useState } from 'react';
import { Check, Facebook, Link2, MessageCircle, Share2, Twitter } from 'lucide-react';

interface Props {
  url?: string;
  title: string;
  label?: string;
  className?: string;
}

const ShareButtons: React.FC<Props> = ({ url, title, label = 'Partager', className = '' }) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '');
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const networks = [
    {
      name: 'Facebook',
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'X',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const shareNatively = async () => {
    try {
      await navigator.share({ title, url: shareUrl });
    } catch {
      return;
    }
  };

  const buttonClass =
    'flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-club-yellow hover:text-black';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {label && (
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-white/50">
          {label}
        </span>
      )}

      {networks.map(({ name, icon: Icon, href }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={`Partager sur ${name}`}
          title={`Partager sur ${name}`}
          className={buttonClass}
        >
          <Icon size={16} />
        </a>
      ))}

      <button
        type="button"
        onClick={copy}
        aria-label="Copier le lien"
        title={copied ? 'Lien copié' : 'Copier le lien'}
        className={buttonClass}
      >
        {copied ? <Check size={16} /> : <Link2 size={16} />}
      </button>

      {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
        <button
          type="button"
          onClick={shareNatively}
          aria-label="Partager"
          title="Partager"
          className={`${buttonClass} sm:hidden`}
        >
          <Share2 size={16} />
        </button>
      )}
    </div>
  );
};

export default ShareButtons;
