import { container } from 'tsyringe';
import { EventRepository } from '@/modules/events/repositories/eventRepository';
import { EventService } from '@/modules/events/services/eventService';
import { EventController } from '@/modules/events/controllers/eventController';
import { BlingRepository } from '@/modules/bling/repositories/blingRepository';
import { BlingOAuthService } from '@/modules/bling/services/blingOAuthService';
import { BlingHttpClient } from '@/modules/bling/services/blingHttpClient';
import { BlingService } from '@/modules/bling/services/blingService';
import { BlingController } from '@/modules/bling/controllers/blingController';
import { ProdutosService } from '@/modules/bling/services/produtosService';
import { ProdutosController } from '@/modules/bling/controllers/produtosController';

container.registerSingleton(EventRepository);
container.registerSingleton(EventService);
container.registerSingleton(EventController);
container.registerSingleton(BlingRepository);
container.registerSingleton(BlingOAuthService);
container.registerSingleton(BlingHttpClient);
container.registerSingleton(BlingService);
container.registerSingleton(BlingController);
container.registerSingleton(ProdutosService);
container.registerSingleton(ProdutosController);

export { container };
