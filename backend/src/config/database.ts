import mongoose from 'mongoose';
import config from './env';

const isLocalUri = (uri: string): boolean => /(localhost|127\.0\.0\.1|\[::1\])/i.test(uri);

export const connectDatabase = async (): Promise<void> => {
  await mongoose.connect(config.mongoUri, isLocalUri(config.mongoUri) ? { family: 4 } : {});
};

export const disconnectDatabase = (): Promise<void> => mongoose.connection.close();

export const safeMongoUri = (uri: string = config.mongoUri): string =>
  uri.replace(/(mongodb(?:\+srv)?:\/\/)[^@]*@/, '$1***@');
