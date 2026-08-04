import sequelize from '@/database/sequelize';
import { PedidoModel } from '@/modules/pedido/models/pedidoModel';
import { ProdutoModel } from '@/modules/produto/models/produtoModel';
import { PedidoProdutoModel } from '@/modules/pedidoProduto/models/pedidoProdutoModel';
import { ClientesModel } from '@/modules/clientes/models/clientesModel';
import { TransportadoraModel } from '@/modules/transportadora/models/transportadoraModel';
import { FormaPagamentoModel } from '@/modules/formaPagamento/models/formaPagamentoModel';
import { EventModel } from '@/modules/events/models/eventModel';
import { ProdutosCigamModel } from '@/modules/produtosCigam/models/produtosCigamModel';
import { ClientesCigamModel } from '@/modules/clientesCigam/models/clientesCigamModel';
import { FormasPagamentoCigamModel } from '@/modules/formasPagamentoCigam/models/formasPagamentoCigamModel';
import { TransportadorasCigamModel } from '@/modules/transportadorasCigam/models/transportadorasCigamModel';

export async function syncDatabase(): Promise<void> {
  await sequelize.sync({ force: true });
}

export async function closeDatabase(): Promise<void> {
  await sequelize.close();
}

export {
  sequelize,
  PedidoModel,
  ProdutoModel,
  PedidoProdutoModel,
  ClientesModel,
  TransportadoraModel,
  FormaPagamentoModel,
  EventModel,
  ProdutosCigamModel,
  ClientesCigamModel,
  FormasPagamentoCigamModel,
  TransportadorasCigamModel,
};
