import { TrayCompleteOrder } from '../dto';

function escapeHtml(value: string | undefined | null): string {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMoney(value: string | undefined): string {
  const num = Number(value || 0);
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Renderiza a página HTML imprimível aberta pela Tray dentro do IFRAME do admin
 * (ver "API de Emissores de Etiqueta" — a Tray não retorna PDF via API, quem
 * desenha o layout da etiqueta é o próprio aplicativo).
 */
export function renderShippingLabelHtml(complete: TrayCompleteOrder): string {
  const order = complete.Order;
  const customer = order.Customer;
  const address = customer?.CustomerAddresses?.[0]?.CustomerAddress;
  const items = order.ProductsSold || [];

  const addressLine = address
    ? `${escapeHtml(address.address)}, ${escapeHtml(address.number)}${address.complement ? ` - ${escapeHtml(address.complement)}` : ''}`
    : 'Endereço não informado';

  const cityLine = address
    ? `${escapeHtml(address.neighborhood)} — ${escapeHtml(address.city)}/${escapeHtml(address.state)} — CEP ${escapeHtml(address.zip_code)}`
    : '';

  const itemsRows = items
    .map(({ ProductsSold: item }) => `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.reference)}</td>
        <td style="text-align:center">${escapeHtml(item.quantity)}</td>
        <td style="text-align:right">${formatMoney(item.price)}</td>
      </tr>
    `)
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Etiqueta - Pedido #${escapeHtml(order.id)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 24px; color: #0f172a; }
  .label { max-width: 620px; margin: 0 auto; border: 2px solid #0f172a; border-radius: 8px; padding: 20px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
  .header h1 { font-size: 18px; margin: 0; }
  .header .order-id { font-size: 22px; font-weight: bold; }
  .section { margin-bottom: 16px; }
  .section h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; margin: 0 0 4px; }
  .recipient-name { font-size: 16px; font-weight: bold; margin: 0 0 4px; }
  .recipient-line { font-size: 14px; margin: 0; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { padding: 6px 4px; border-bottom: 1px solid #e2e8f0; text-align: left; }
  .totals { margin-top: 8px; font-size: 13px; text-align: right; }
  .actions { max-width: 620px; margin: 16px auto 0; text-align: center; }
  .actions button { background: #00B0F1; color: #fff; border: none; border-radius: 8px; padding: 10px 24px; font-size: 14px; font-weight: bold; cursor: pointer; }
  @media print {
    .actions { display: none; }
    body { padding: 0; }
  }
</style>
</head>
<body>
  <div class="label">
    <div class="header">
      <h1>Chocmaster — Etiqueta de Envio</h1>
      <div class="order-id">Pedido #${escapeHtml(order.id)}</div>
    </div>

    <div class="section">
      <h2>Destinatário</h2>
      <p class="recipient-name">${escapeHtml(address?.recipient || customer?.name)}</p>
      <p class="recipient-line">${addressLine}</p>
      <p class="recipient-line">${cityLine}</p>
      ${customer?.cellphone || customer?.phone ? `<p class="recipient-line">Tel: ${escapeHtml(customer.cellphone || customer.phone)}</p>` : ''}
    </div>

    <div class="section">
      <h2>Envio</h2>
      <p class="recipient-line">${escapeHtml(order.shipment || 'Não informado')}${order.shipment_integrator ? ` (${escapeHtml(order.shipment_integrator)})` : ''}</p>
      ${order.tracking_url ? `<p class="recipient-line">Rastreio: ${escapeHtml(order.tracking_url)}</p>` : ''}
    </div>

    <div class="section">
      <h2>Itens do pedido</h2>
      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Ref.</th>
            <th style="text-align:center">Qtd.</th>
            <th style="text-align:right">Preço</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
      <div class="totals">
        Frete: ${formatMoney(order.shipment_value)}<br />
        <strong>Total: ${formatMoney(order.total)}</strong>
      </div>
    </div>
  </div>

  <div class="actions">
    <button type="button" onclick="window.print()">Imprimir etiqueta</button>
  </div>
</body>
</html>`;
}
