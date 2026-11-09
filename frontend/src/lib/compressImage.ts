/**
 * Réduit une photo trop lourde avant l'envoi : redimensionnée à MAX_SIDE px
 * sur son plus grand côté et réencodée en JPEG. Les photos de téléphone font
 * souvent 8 à 15 Mo, bien au-delà de la limite du serveur.
 */
const MAX_SIDE = 2560;
const MAX_BYTES = 1.5 * 1024 * 1024;
const QUALITY = 0.85;

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image illisible'));
    };
    image.src = url;
  });

export const compressImage = async (file: File): Promise<File> => {
  // Un GIF perdrait son animation ; une image déjà légère reste telle quelle.
  if (file.type === 'image/gif' || file.size <= MAX_BYTES) return file;

  try {
    const image = await loadImage(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', QUALITY)
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    // Format que le navigateur ne sait pas décoder : on laisse le serveur trancher.
    return file;
  }
};
