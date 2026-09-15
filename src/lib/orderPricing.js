export function priceCatalogOrder(cartItems, products) {
  if (!Array.isArray(cartItems) || !cartItems.length || cartItems.length > 100) throw new Error('Carrinho inválido.');
  const catalog = new Map(products.map(product => [String(product.id), product]));
  const seen = new Set();
  let total = 0;
  let cost = 0;
  const items = cartItems.map(item => {
    if (!item || seen.has(String(item.id)) || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) throw new Error('Itens ou quantidades inválidos.');
    seen.add(String(item.id));
    const product = catalog.get(String(item.id));
    if (!product || product.show_on_site !== true || product.is_insumo || product.is_preorder) throw new Error('Produto indisponível na loja.');
    if (!Number.isFinite(Number(product.stock)) || Number(product.stock) < item.quantity) throw new Error('Estoque insuficiente. Atualize o carrinho.');
    const cents = Math.round(Number(product.price) * 100);
    const costCents = Math.round(Number(product.cost || 0) * 100);
    if (!Number.isSafeInteger(cents) || cents <= 0 || !Number.isSafeInteger(costCents) || costCents < 0) throw new Error('Produto sem preço válido.');
    if (Math.round(Number(item.price) * 100) !== cents) throw new Error('O preço mudou. Atualize o carrinho antes de pagar.');
    total += cents * item.quantity;
    cost += costCents * item.quantity;
    return { id: product.id, nome: product.nome, image_url: product.image_url, quantity: item.quantity, cents };
  });
  if (!Number.isSafeInteger(total) || !Number.isSafeInteger(cost)) throw new Error('Total inválido.');
  return { items, total, cost };
}
