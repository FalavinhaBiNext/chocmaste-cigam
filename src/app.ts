import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorMiddleware } from '@/shared/middlewares/errorMiddleware';
import { ensureAuthenticatedWrite } from '@/shared/middlewares/ensureAuthenticatedWrite';
import { routes } from './routes';

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use('/api/v1', ensureAuthenticatedWrite, routes)

app.use(errorMiddleware);

export default app;
