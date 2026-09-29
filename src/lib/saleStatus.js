// sales.status tem vocabulário inconsistente por origem: venda da loja usa
// 'Paga'/'Pago'/'Pendente' (webhook da Stripe), venda manual usa
// 'completed'/'pending' (ManualSaleModal). Unificar o valor gravado exige
// redesenhar a interação com o gatilho de baixa de estoque (handle_stock_on_paid_sale
// dispara em qualquer status 'Paga'/'Pago', e a venda manual já baixa o
// próprio estoque — usar o mesmo texto causaria baixa em dobro). Até lá,
// este é o único lugar que decide "isso conta como pago".
const PAID_STATUSES = ['Paga', 'Pago', 'completed'];

export function isSalePaid(status) {
  return PAID_STATUSES.includes(status);
}

export function saleStatusLabel(status) {
  return isSalePaid(status) ? 'Finalizado' : 'Pendente';
}
