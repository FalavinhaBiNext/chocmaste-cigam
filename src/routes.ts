import { Router } from 'express';
import { container } from '@/shared/container';
import { EventController } from './modules/events/controllers/eventController';
import { createEventRoutes } from './modules/events/routes/event.routes';
import { BlingController } from './modules/bling/controllers/blingController';
import { createBlingRoutes } from './modules/bling/routes/bling.routes';

const routes = Router();

const eventController = container.resolve(EventController);
const blingController = container.resolve(BlingController);

routes.use('/events', createEventRoutes(eventController));
routes.use('/bling', createBlingRoutes(blingController));

export { routes }
