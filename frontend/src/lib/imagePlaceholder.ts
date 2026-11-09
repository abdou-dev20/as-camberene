export const IMAGE_PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#18191c"/>
      <path d="M0 300 L400 140 L400 300 Z" fill="#0D7C27" opacity="0.35"/>
      <circle cx="200" cy="120" r="34" fill="none" stroke="#F9ED3A" stroke-width="3"/>
      <path d="M200 100 l14 10 -5 17 h-18 l-5 -17 z" fill="#F9ED3A"/>
      <text x="200" y="196" fill="#F9ED3A" font-family="Arial,sans-serif" font-size="15"
            font-weight="bold" letter-spacing="2" text-anchor="middle">VISUEL À VENIR</text>
    </svg>`
  );

export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  const image = event.currentTarget;
  image.onerror = null;
  image.src = IMAGE_PLACEHOLDER;
};
