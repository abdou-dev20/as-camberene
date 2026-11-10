import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import Joi from 'joi';
import { MulterError } from 'multer';
import { HttpError } from '../lib/http';
import config from '../config/env';

export const routeNotFound = (req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: `Route inconnue : ${req.method} ${req.path}` });
};

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  void _next;
  if (error instanceof HttpError) {
    res.status(error.status).json({
      success: false,
      message: error.message,
      ...(error.details.length > 0 ? { errors: error.details } : {}),
    });
    return;
  }

  if (error instanceof MulterError) {
    const maxMo = Math.round(config.upload.maxBytes / (1024 * 1024));
    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: `Fichier trop volumineux (maximum ${maxMo} Mo)`,
      LIMIT_FILE_COUNT: 'Trop de fichiers envoyés',
      LIMIT_FIELD_COUNT: 'Trop de champs dans la requête',
      LIMIT_PART_COUNT: 'Trop de parties dans la requête',
      LIMIT_FIELD_KEY: 'Nom de champ trop long',
      UNEXPECTED_TYPE: "Format de fichier inattendu",
    };
    res.status(400).json({
      success: false,
      message: messages[error.code] ?? `Échec du téléversement (${error.code})`,
    });
    return;
  }

  if (Joi.isError(error)) {
    res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: error.details.map((detail) => detail.message),
    });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: Object.values(error.errors).map((detail) => detail.message),
    });
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json({ success: false, message: 'Identifiant invalide' });
    return;
  }

  if (typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000) {
    res.status(409).json({ success: false, message: 'Cette valeur est déjà utilisée' });
    return;
  }

  console.error('Erreur non gérée :', error);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    ...(config.isProduction ? {} : { detail: error instanceof Error ? error.message : String(error) }),
  });
};
