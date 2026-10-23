// Shared public catalog rules. This projection is not a substitute for database RLS.
export const PUBLIC_PRODUCT_COLUMNS = 'id,nome,price,stock,category,colecao,description,image_url,image_2,image_3,image_4,show_on_site,is_preorder,is_insumo,measure_cm,weight_kg';

export function isPublishedProduct(product) {
  return product.show_on_site === true && product.is_insumo !== true;
}

const collectionKey = name => name.trim().toLocaleLowerCase('pt-BR');

function collectionNames(product) {
  return (product.colecao || '').split(',').map(value => value.trim())
    .filter(name => name && name !== 'Sem linha / Coleção');
}

// Coleções digitadas com maiúsculas diferentes ("Frutas e legumes" / "Frutas e Legumes") são a mesma.
export function inCollection(product, name) {
  return collectionNames(product).some(value => collectionKey(value) === collectionKey(name));
}

export function getCollections(products) {
  const collections = new Map();
  for (const product of products.filter(isPublishedProduct)) {
    for (const name of new Set(collectionNames(product).map(collectionKey))) {
      const label = collectionNames(product).find(value => collectionKey(value) === name);
      const entry = collections.get(name) || { nome: label, photos: [], count: 0 };
      entry.count += 1;
      if (product.image_url) entry.photos.push(product.image_url);
      collections.set(name, entry);
    }
  }
  // Cada coleção prefere uma foto que nenhuma coleção anterior já usou.
  const used = new Set();
  return [...collections.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map(({ nome, photos, count }) => {
      const img = photos.find(photo => !used.has(photo)) || photos[0] || '';
      used.add(img);
      return { nome, img, count };
    });
}

export function reconcileCart(items, products) {
  const catalog = new Map(products.filter(isPublishedProduct).map(product => [String(product.id), product]));
  return items.map(item => {
    const product = catalog.get(String(item.id));
    if (!product) return { ...item, unavailable: true, stock: 0 };
    // Preserve the requested quantity: never silently change the customer's order.
    return { ...product, cartLineId: item.cartLineId, quantity: item.quantity, unavailable: product.is_preorder || Number(product.stock) < item.quantity };
  });
}
