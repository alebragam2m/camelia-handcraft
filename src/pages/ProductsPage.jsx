import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    // Escuta mudanças em tempo real no banco
    const unsubscribe = productService.subscribeToChanges(() => {
      load(); // recarrega quando qualquer produto mudar
    });

    return unsubscribe; // limpa o canal ao sair da página
  }, []);

  const displayed = products.filter(p => p.show_on_site !== false);

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-400">
        Carregando peças...
      </div>
    );
  }

  return (
    <div className="p-10">
      <h1 className="text-3xl font-serif mb-10">Nossas Peças</h1>
      {displayed.length === 0 ? (
        <p className="text-gray-400">Nenhum produto disponível no momento.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {displayed.map(prod => (
            <div key={prod.id} className="bg-white p-4 rounded-xl shadow-sm">
              <img
                src={prod.image_url || '/logo.png'}
                alt={prod.nome}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <h3 className="font-bold">{prod.nome}</h3>
              <p className="text-primaria font-bold">
                R$ {Number(prod.price).toFixed(2).replace('.', ',')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductsPage;