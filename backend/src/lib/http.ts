import { NextFunction, Request, RequestHandler, Response } from 'express';

export class HttpError extends Error {
  readonly status: number;
  readonly details: string[];

  constructor(status: number, message: string, details: string[] = []) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

export const notFound = (message = 'Ressource introuvable'): HttpError =>
  new HttpError(404, message);

export const unauthorized = (message = 'Non authentifié'): HttpError =>
  new HttpError(401, message);

export const forbidden = (message = 'Accès refusé'): HttpError => new HttpError(403, message);

export const handler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
