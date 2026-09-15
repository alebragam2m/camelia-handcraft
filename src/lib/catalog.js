// Shared public catalog rules. This projection is not a substitute for database RLS.
export const PUBLIC_PRODUCT_COLUMNS = 'id,nome,price,stock,category,colecao,description,image_url,image_2,image_3,image_4,show_on_site,is_preorder,is_insumo,measure_cm,weight_kg';

export function isPublishedProduct(product) {
  return product.show_on_site === true && product.is_insumo !== true;
}

export function getCollections(products) {
  const collections = new Map();
  for (const product of products.filter(isPublishedProduct)) {
    for (const name of (product.colecao || '').split(',').map(value => value.trim()).filter(Boolean)) {
      if (name === 'Sem linha / Coleção') continue;
      if (!collections.has(name) || (!collections.get(name) && product.image_url)) {
        collections.set(name, product.image_url || '');
      }
    }
  }
  return [...collections].sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
    .map(([nome, img]) => ({ nome, img }));
}

export function reconcileCart(items, products) {
  const catalog = new Map(products.filter(isPublishedProduct).map(product => [String(product.id), product]));
  return items.map(item => {
    const product = catalog.get(String(item.id));
    if (!product) return { ...item, unavailable: true, stock: 0 };
    // Preserve the requested quantity: never silently change the customer's order.
    return { ...product, quantity: item.quantity, unavailable: product.is_preorder || Number(product.stock) < item.quantity };
  });
}
