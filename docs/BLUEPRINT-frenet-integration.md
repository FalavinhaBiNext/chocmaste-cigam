# BLUEPRINT — Integração API Frenet (Chocmaster-Backend)

## 1. Objetivo

Integrar a API de frete da Frenet ao Chocmaster para permitir cotação de frete, rastreamento de pedidos e consulta de CEP diretamente no fluxo de pedidos Bling→CIGAM. A integração deve ser transparente ao usuário, calculando automaticamente o frete ao criar pedidos no CIGAM.

## 2. Escopo da Integração

### 2.1 Endpoints Frenet a serem integrados

| Grupo | Endpoint | Método | Uso no Chocmaster |
|-------|----------|--------|-------------------|
| **Shipping** | `/v1/shipping/info` | GET | Listar transportadoras disponíveis |
| **Shipping** | `/v1/shipping/quote` | POST | Cotar frete para um pedido |
| **Tracking** | `/v1/tracking/trackinginfo` | POST | Rastrear entrega de pedido |
| **CEP** | `/v1/CEP/Address/{cep}` | GET | Consultar endereço por CEP |

### 2.2 Autenticação

- **Host Onboarding:** `register.apifrenet.com.br` (cadastro inicial)
- **Host API:** `api.frenet.com.br`
- **Header de autenticação:** `token: {SEU_TOKEN}`
- **Token obtido:** via painel administrativo Frenet ou API de onboarding

## 3. Estrutura do Módulo

```
src/modules/frenet/
├── controllers/
│   └── frenetController.ts
├── services/
│   ├── frenetHttpClient.ts
│   ├── frenetShippingService.ts
│   ├── frenetTrackingService.ts
│   └── frenetCepService.ts
├── repositories/
│   └── frenetConfigRepository.ts
├── models/
│   └── frenetConfigModel.ts
├── dto/
│   └── index.ts
├── routes/
│   └── frenet.routes.ts
├── tests/
│   ├── frenetShippingService.test.ts
│   ├── frenetTrackingService.test.ts
│   └── frenetCepService.test.ts
└── frenet.validator.ts
```

## 4. Modelos de Dados

### 4.1 FrenetConfigModel (armazenamento do token)

```typescript
// Tabela: frenet_config
{
  id: UUID (PK),
  token: STRING (NOT NULL),
  seller_cep: STRING,        // CEP de origem para cotações
  ativo: BOOLEAN (DEFAULT true),
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

### 4.2 DTOs de Request/Response

#### Shipping Quote Request
```typescript
interface FrenetShippingQuoteRequest {
  SellerCEP: string;           // CEP de origem
  RecipientCEP: string;        // CEP de destino
  ShipmentInvoiceValue: number; // Valor total do pedido
  ShippingServiceCode?: string; // Código específico (opcional)
  ShippingItemArray: FrenetShippingItem[];
  RecipientCountry?: string;   // Default: "BR"
}

interface FrenetShippingItem {
  Weight: number;    // Peso em kg
  Length: number;    // Comprimento em cm
  Height: number;    // Altura em cm
  Width: number;     // Largura em cm
  Quantity: number;  // Quantidade
  SKU?: string;
  Category?: string;
  isFragile?: boolean;
}
```

#### Shipping Quote Response
```typescript
interface FrenetShippingQuoteResponse {
  ShippingSevicesArray: FrenetShippingService[];
  Timeout: number;
}

interface FrenetShippingService {
  Carrier: string;              // Nome da transportadora
  CarrierCode: string;          // Código (COR, TNT, etc.)
  ServiceCode: string;          // Código do serviço
  ServiceDescription: string;   // Descrição (Sedex, etc.)
  ShippingPrice: string;        // Preço do frete
  DeliveryTime: string;         // Prazo em dias
  OriginalShippingPrice?: string;
  OriginalDeliveryTime?: string;
  Msg?: string;
  Error: boolean;
}
```

#### Shipping Info Response
```typescript
interface FrenetShippingInfoResponse {
  ShippingSeviceAvailableArray: FrenetAvailableService[];
  Message: string;
}

interface FrenetAvailableService {
  Carrier: string;
  CarrierCode: string;
  ServiceCode: string;
  ServiceDescription: string;
}
```

#### Tracking Request
```typescript
interface FrenetTrackingRequest {
  ShippingServiceCode: string;  // Obtido na cotação
  TrackingNumber: string;       // Número de rastreio
  InvoiceNumber?: string;
  InvoiceSerie?: string;
  RecipientDocument?: string;
  OrderNumber?: string;
}
```

#### Tracking Response
```typescript
interface FrenetTrackingResponse {
  ServiceDescrition: string;
  TrackingNumber: string;
  TrackingUrl: string;
  TrackingEvents: FrenetTrackingEvent[];
}

interface FrenetTrackingEvent {
  EventDateTime: string;
  EventDescription: string;
  EventLocation: string;
  EventType: string;  // 0=Inicial, 1=Trânsito, 2=Atraso, 3=Devolvido, 4=Extravio, 9=Entregue
}
```

#### CEP Response
```typescript
interface FrenetCepResponse {
  CEP: string;
  City: string;
  District: string;
  Street: string;
  UF: string;
  Message: string;
}
```

## 5. Serviços

### 5.1 FrenetHttpClient

```typescript
@injectable()
export class FrenetHttpClient {
  private readonly client: AxiosInstance;
  private readonly baseUrl = 'https://api.frenet.com.br';

  constructor(
    @inject(FrenetConfigRepository) private readonly configRepo: FrenetConfigRepository
  ) {
    this.client = axios.create({
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async getHeaders(): Promise<{ token: string }> {
    const config = await this.configRepo.findActive();
    if (!config) throw new NotFoundError('Configuração Frenet não encontrada.');
    return { token: config.token };
  }

  async get<T>(path: string): Promise<T> { /* ... */ }
  async post<T>(path: string, data: any): Promise<T> { /* ... */ }
}
```

### 5.2 FrenetShippingService

```typescript
@injectable()
export class FrenetShippingService {
  constructor(
    @inject(FrenetHttpClient) private readonly httpClient: FrenetHttpClient,
    @inject(FrenetConfigRepository) private readonly configRepo: FrenetConfigRepository
  ) {}

  async getAvailableServices(): Promise<FrenetAvailableService[]> { /* GET /shipping/info */ }
  async getShippingQuote(request: FrenetShippingQuoteRequest): Promise<FrenetShippingService[]> { /* POST /shipping/quote */ }
  async calculateFreteForOrder(pedido: PedidoData): Promise<FrenetShippingService[]> { /* Helper */ }
}
```

### 5.3 FrenetTrackingService

```typescript
@injectable()
export class FrenetTrackingService {
  constructor(@inject(FrenetHttpClient) private readonly httpClient: FrenetHttpClient) {}

  async trackShipment(request: FrenetTrackingRequest): Promise<FrenetTrackingResponse> { /* POST /tracking/trackinginfo */ }
}
```

### 5.4 FrenetCepService

```typescript
@injectable()
export class FrenetCepService {
  constructor(@inject(FrenetHttpClient) private readonly httpClient: FrenetHttpClient) {}

  async getAddressByCep(cep: string): Promise<FrenetCepResponse> { /* GET /CEP/Address/{cep} */ }
}
```

## 6. Integração com Pedido CIGAM

### 6.1 Fluxo de Cálculo de Frete

```
1. Webhook Bling recebe pedido
2. Extrair itens do pedido (peso, dimensões)
3. Buscar CEP destino do cliente
4. Chamar FrenetShippingService.calculateFreteForOrder()
5. Selecionar menor frete ou frete da transportadora mapeada
6. Incluir valor do frete no payload CIGAM
7. Salvar código de rastreio (quando disponível)
```

### 6.2 Modificações no `cigamPedidoService.ts`

```typescript
// Adicionar import
import { FrenetShippingService } from '@/modules/frenet/services/frenetShippingService';

// No construtor
constructor(
  // ... deps existentes
  @inject(FrenetShippingService) private readonly frenetShippingService: FrenetShippingService,
) {}

// No enviarPedido(), após montar itensMapeados:
const freteResult = await this.frenetShippingService.calculateFreteForOrder({
  cepOrigem: config.seller_cep,
  cepDestino: clienteCep,
  valorTotal: pedidoBling.total,
  itens: pedidoBling.itens
});

const valorFrete = freteResult?.ShippingPrice || pedidoBling.transporte?.frete || 0;
```

## 7. Rotas

```
GET    /api/v1/frenet/config          → Obter configuração atual
POST   /api/v1/frenet/config          → Salvar/atualizar configuração (token, CEP)
GET    /api/v1/frenet/shipping/info   → Listar transportadoras disponíveis
POST   /api/v1/frenet/shipping/quote  → Cotar frete
POST   /api/v1/frenet/tracking        → Rastrear envio
GET    /api/v1/frenet/cep/:cep        → Consultar CEP
```

## 8. Migração

```javascript
// 20260811000001-create-frenet-config.js
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('frenet_config', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      token: { type: Sequelize.STRING, allowNull: false },
      seller_cep: { type: Sequelize.STRING(8), allowNull: false },
      ativo: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('frenet_config');
  }
};
```

## 9. Variáveis de Ambiente

```env
# Frenet (opcional - pode ser salvo no banco via config)
FRENET_TOKEN=seu_token_aqui
FRENET_SELLER_CEP=04757020
```

## 10. Testes

| Teste | Descrição |
|-------|-----------|
| `frenetShippingService.test.ts` | Mock do HttpClient, testar cálculo de frete |
| `frenetTrackingService.test.ts` | Mock do HttpClient, testar rastreamento |
| `frenetCepService.test.ts` | Mock do HttpClient, testar consulta CEP |
| `frenetConfigRepository.test.ts` | CRUD da configuração |

## 11. Decisões de Design

| Decisão | Motivação | Alternativas |
|---------|-----------|--------------|
| Token armazenado no banco (não só .env) | Permite múltiplos ambientes (homolog/produção) | Usar apenas .env |
| Serviço separado de shipping/tracking/CEP | Separação de responsabilidades, testabilidade | Um único serviço monolítico |
| Integração no `cigamPedidoService` | Cálculo automático no fluxo existente | Endpoint separado para cálculo manual |
| Timeout de 30s no HttpClient | API Frenet pode ser lenta em cotações complexas | Timeout menor (10s) |

## 12. Fluxograma

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO DE COTAÇÃO DE FRETE                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Webhook  │───>│ Extrair Dados│───>│ Buscar CEP   │      │
│  │ Bling    │    │ do Pedido    │    │ Destino      │      │
│  └──────────┘    └──────────────┘    └──────────────┘      │
│                                               │             │
│                                               v             │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Enviar   │<───│ Selecionar   │<───│ Chamar API   │      │
│  │ p/ CIGAM │    │ Menor Frete  │    │ Frenet Quote │      │
│  └──────────┘    └──────────────┘    └──────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Status:** Pronto para implementação
**Estimativa:** 2-3 dias de desenvolvimento
**Dependências:** Nenhuma nova dependência externa (axios já existe)
