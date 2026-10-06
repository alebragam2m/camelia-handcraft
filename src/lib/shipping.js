export const BRAZIL_STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export function shippingCentsForState(rates, state) {
  if (!BRAZIL_STATES.includes(state)) throw new Error('Selecione um estado válido.');
  const rate = rates?.find(item => item.state === state) ?? rates?.find(item => item.state === '*');
  if (!rate) throw new Error('Entrega indisponível para este estado. Entre em contato com a loja.');
  if (rate.cost == null || rate.cost === '') throw new Error('Tarifa de entrega inválida.');
  const cost = Number(rate.cost);
  const cents = Math.round(cost * 100);
  if (!Number.isFinite(cost) || cost < 0 || !Number.isSafeInteger(cents)) throw new Error('Tarifa de entrega inválida.');
  return cents;
}
