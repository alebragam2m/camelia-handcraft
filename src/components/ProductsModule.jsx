import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { supabase } from '../supabase';
import { formatCurrency } from '../utils/formatCurrency';

// --- Categorias de produtos da Camélia ---
const PRODUCT_CATEGORIES = ['Porta Guardanapos', 'Guardanapos', 'Jogos Americanos', 'Diversos', 'Insumos'];

const CATEGORY_ICONS = {
  'Porta Guardanapos': '🪴',
  'Guardanapos': '🌸',
  'Jogos Americanos': '🍽️',
  'Diversos': '✨',
  'Insumos': '🧵',
};

const CATEGORY_COLORS = {
  'Porta Guardanapos': 'border-primaria bg-gradient-to-br from-white to-rose-50',
  'Guardanapos': 'border-pink-400 bg-gradient-to-br from-white to-pink-50',
  'Jogos Americanos': 'border-amber-400 bg-gradient-to-br from-white to-amber-50',
  'Diversos': 'border-purple-400 bg-gradient-to-br from-white to-purple-50',
  'Insumos': 'border-teal-400 bg-gradient-to-br from-white to-teal-50',
};

const defaultForm = {
  nome: '', price: '', cost: '', category: 'Porta Guardanapos',
  colecao: 'Flores', stock: '', description: '',
  is_insumo: false, supplier_id: '', measure_cm: '', weight_kg: ''
};

export default function ProductsModule() {
  const { products: produtos, suppliers, loading, actions } = useData();
  const [activeLine, setActiveLine] = useState(null); // Categoria selecionada para drill-down
  const [editProduct, setEditProduct] = useState(null); // Produto aberto para edição
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef();

  const openCreateMode = (category) => {
    setFormData({ ...defaultForm, category, is_insumo: category === 'Insumos' });
    setSelectedFiles([]);
    setEditProduct(null);
    setIsCreating(true);
  };

  const openEditMode = (prod) => {
    setFormData({
      nome: prod.nome || '',
      price: prod.price || '',
      cost: prod.cost || '',
      category: prod.category || 'Diversos',
      colecao: prod.colecao || 'Flores',
      stock: prod.stock !== undefined ? prod.stock : '',
      description: prod.description || '',
      is_insumo: prod.is_insumo || false,
      supplier_id: prod.supplier_id || '',
      measure_cm: prod.measure_cm || '',
      weight_kg: prod.weight_kg || '',
    });
    setSelectedFiles([]);
    setEditProduct(prod);
    setIsCreating(true);
  };

  const handleFilesChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const uploadImages = async (productId) => {
    if (selectedFiles.length === 0) return [];
    setUploadProgress('Enviando imagens...');
    const urls = [];
    for (const file of selectedFiles) {
      const ext = file.name.split('.').pop();
      const path = `products/${productId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('products').upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from('products').getPublicUrl(path);
        if (urlData?.publicUrl) urls.push(urlData.publicUrl);
      } else {
        console.error("Erro upload:", error);
      }
    }
    setUploadProgress('');
    return urls;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        nome: formData.nome,
        price: parseFloat(formData.price) || 0,
        cost: parseFloat(formData.cost) || 0,
        category: formData.category,
        colecao: formData.colecao,
        stock: parseInt(formData.stock) || 0,
        description: formData.description,
        is_insumo: formData.is_insumo,
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
        measure_cm: formData.measure_cm || null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
      };

      let res;
      if (editProduct) {
        res = await actions.upsertProduct(payload, editProduct.id);
      } else {
        res = await actions.upsertProduct(payload);
      }

      const targetId = editProduct ? editProduct.id : res.id;

      if (selectedFiles.length > 0) {
        const urls = await uploadImages(targetId);
        if (urls.length > 0) {
          await actions.upsertProduct({ image_url: urls[0] }, targetId);
        }
      }

      setIsCreating(false);
      setEditProduct(null);
    } catch (err) {
      alert("Erro ao gravar produto: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (prod) => {
    if (!window.confirm(`Excluir permanentemente "${prod.nome}"?`)) return;
    try {
      await actions.deleteProduct(prod.id);
      if (editProduct?.id === prod.id) { setIsCreating(false); setEditProduct(null); }
    } catch (err) { alert("Erro ao excluir: " + err.message); }
  };

  // Group by category
  const byCategory = PRODUCT_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = produtos.filter(p => p.category === cat || (cat === 'Insumos' && p.is_insumo));
    return acc;
  }, {});

  const productsInLine = activeLine ? byCategory[activeLine] : [];

  return (
    <div className="animate-fade-in-down space-y-6 pb-12">

      {/* MODAL: CRIAR / EDITAR */}
      {isCreating && (
        <div className="fixed inset-0 bg-secundaria/80 backdrop-blur z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-y-auto max-h-[95vh] border border-white/20">
            <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
              <div>
                <h3 className="font-serif font-bold text-secundaria text-2xl">{editProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
                <p className="text-[10px] text-primaria font-bold uppercase tracking-widest mt-1">{formData.category}</p>
              </div>
              <button onClick={() => { setIsCreating(false); setEditProduct(null); }} className="text-gray-400 hover:text-red-500 font-bold text-[10px] uppercase">Fechar [X]</button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-5">

              {/* Toggle: Produto Artesanal vs Insumo */}
              <div className="flex gap-4 mb-2">
                <label className={`flex-1 text-center py-3 rounded-xl border-2 font-bold uppercase tracking-widest text-xs cursor-pointer transition-colors ${!formData.is_insumo ? 'bg-primaria/10 border-primaria text-primaria' : 'bg-gray-50 border-transparent text-gray-400'}`}>
                  <input type="radio" className="hidden" checked={!formData.is_insumo} onChange={() => setFormData({ ...formData, is_insumo: false })} />
                  🎨 Produto Artesanal
                </label>
                <label className={`flex-1 text-center py-3 rounded-xl border-2 font-bold uppercase tracking-widest text-xs cursor-pointer transition-colors ${formData.is_insumo ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-gray-50 border-transparent text-gray-400'}`}>
                  <input type="radio" className="hidden" checked={formData.is_insumo} onChange={() => setFormData({ ...formData, is_insumo: true, category: 'Insumos' })} />
                  🧵 Insumo / Matéria-Prima
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Nome */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    {formData.is_insumo ? 'Nome do Insumo *' : 'Nome do Produto / Obra *'}
                  </label>
                  <input type="text" required value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    placeholder={formData.is_insumo ? 'Ex: Linha de Seda Preta N° 8' : 'Ex: Porta Guardanapo Floral Camélia'}
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm font-bold text-secundaria outline-none" />
                </div>

                {/* Categoria */}
                {!formData.is_insumo && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Linha / Categoria</label>
                    <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm font-bold text-secundaria outline-none">
                      {PRODUCT_CATEGORIES.filter(c => c !== 'Insumos').map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                )}

                {/* Fornecedor (Insumos) */}
                {formData.is_insumo && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Fornecedor (Pré-Cadastrado) *</label>
                    <select required value={formData.supplier_id} onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm font-bold text-secundaria outline-none">
                      <option value="">Selecione o Fornecedor...</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
                    </select>
                    {suppliers.length === 0 && <p className="text-[10px] text-red-500 mt-1 font-bold">⚠️ Cadastre um Fornecedor primeiro na aba "Fornecedores".</p>}
                  </div>
                )}

                {/* Preço de Custo */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    {formData.is_insumo ? 'Valor Unitário (R$) *' : 'Custo de Fabricação (R$)'}
                  </label>
                  <input type="number" step="0.01" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="0.00" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm font-bold text-secundaria outline-none" />
                </div>

                {/* Preço de Venda - só para artesanais */}
                {!formData.is_insumo && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Preço de Venda (R$) *</label>
                    <input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm font-bold text-secundaria outline-none" />
                  </div>
                )}

                {/* Quantidade em Estoque */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    {formData.is_insumo ? 'Quantidade em Estoque *' : 'Unidades Disponíveis *'}
                  </label>
                  <input type="number" min="0" required value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm font-bold text-secundaria outline-none" />
                </div>

                {/* Medidas de Insumo */}
                {formData.is_insumo && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Medida (cm, metros, ml...)</label>
                      <input type="text" value={formData.measure_cm} onChange={e => setFormData({ ...formData, measure_cm: e.target.value })}
                        placeholder="Ex: 150cm ou 2m" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm font-bold text-secundaria outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Peso (kg) — Ex: 0.50</label>
                      <input type="number" step="0.001" value={formData.weight_kg} onChange={e => setFormData({ ...formData, weight_kg: e.target.value })}
                        placeholder="0.00" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm font-bold text-secundaria outline-none" />
                    </div>
                  </>
                )}

                {/* Coleção / Tag */}
                {!formData.is_insumo && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Coleção</label>
                    <select value={formData.colecao} onChange={e => setFormData({ ...formData, colecao: e.target.value })}
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm font-bold text-secundaria outline-none">
                      <option value="Flores">Flores</option>
                      <option value="Frutas e legumes">Frutas e legumes</option>
                      <option value="Provence">Provence</option>
                      <option value="Páscoa">Páscoa</option>
                      <option value="Círio">Círio</option>
                      <option value="Natal">Natal</option>
                      <option value="Verão">Verão</option>
                      <option value="Diversos">Diversos</option>
                    </select>
                  </div>
                )}

                {/* Descrição */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Descrição</label>
                  <textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detalhe o produto, técnica artesanal, materiais..." className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-secundaria outline-none resize-none" />
                </div>

                {/* Upload de Imagens */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Fotos do Produto</label>
                  {editProduct?.image_url && (
                    <img src={editProduct.image_url} alt="" className="w-24 h-24 object-cover rounded-xl mb-3 border border-gray-200" />
                  )}
                  <div
                    onClick={() => fileInputRef.current.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-primaria hover:bg-primaria/5 transition-colors">
                    <p className="text-sm font-bold text-gray-400">📸 Clique para selecionar fotos</p>
                    <p className="text-[10px] text-gray-400 mt-1">JPG, PNG, WEBP — Selecione uma ou várias</p>
                    {selectedFiles.length > 0 && (
                      <div className="mt-3 text-[10px] text-primaria font-bold">{selectedFiles.length} foto(s) selecionada(s)</div>
                    )}
                    {uploadProgress && <p className="text-[10px] text-primaria font-bold animate-pulse mt-2">{uploadProgress}</p>}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFilesChange} />
                </div>
              </div>

              <button type="submit" disabled={isSaving}
                className="w-full mt-4 bg-secundaria text-white font-bold py-5 rounded-xl uppercase tracking-widest text-sm hover:bg-black transition-colors shadow-lg">
                {isSaving ? 'Gravando...' : editProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
              </button>

              {editProduct && (
                <button type="button" onClick={() => handleDelete(editProduct)}
                  className="w-full mt-2 text-red-500 hover:text-red-700 font-bold text-[10px] uppercase tracking-widest underline py-2">
                  Excluir este produto permanentemente
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* VISTA: DRILL-DOWN DE LINHA */}
      {activeLine && !isCreating && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveLine(null)} className="flex items-center gap-2 text-gray-400 hover:text-secundaria font-bold text-xs uppercase tracking-widest transition-colors">
              ← Voltar às Linhas
            </button>
            <div className="flex-1 border-b border-gray-200" />
            <button onClick={() => openCreateMode(activeLine)} className="bg-secundaria text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black shadow-md transition-colors">
              + Novo em {activeLine}
            </button>
          </div>

          <div className="flex items-center gap-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <span className="text-4xl">{CATEGORY_ICONS[activeLine]}</span>
            <div>
              <h2 className="text-2xl font-serif font-bold text-secundaria">Linha: {activeLine}</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{productsInLine.length} produto(s) cadastrado(s)</p>
            </div>
          </div>

          {loading ? (
            <p className="text-center text-gray-400 animate-pulse font-bold py-16">Carregando produtos...</p>
          ) : productsInLine.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <p className="text-4xl mb-4">{CATEGORY_ICONS[activeLine]}</p>
              <p className="text-gray-400 font-bold text-sm">Nenhum produto nesta linha ainda.</p>
              <button onClick={() => openCreateMode(activeLine)} className="mt-6 bg-primaria text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90">
                + Adicionar o Primeiro
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {productsInLine.map(prod => (
                <div key={prod.id} onClick={() => openEditMode(prod)}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer group hover:shadow-lg hover:-translate-y-1 transition-all">
                  {prod.image_url ? (
                    <img src={prod.image_url} alt={prod.nome} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-44 bg-gray-50 flex items-center justify-center text-5xl border-b border-gray-100">
                      {CATEGORY_ICONS[prod.category] || '🎨'}
                    </div>
                  )}
                  <div className="p-4">
                    <h4 className="font-bold text-secundaria text-sm leading-tight mb-1">{prod.nome}</h4>
                    {prod.is_insumo ? (
                      <p className="text-teal-600 font-bold text-xs">Custo: {formatCurrency(prod.cost)}</p>
                    ) : (
                      <p className="text-primaria font-bold text-sm">{formatCurrency(prod.price)}</p>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-full ${prod.stock <= 5 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                        {prod.stock} un.
                      </span>
                      <span className="text-[10px] font-bold text-gray-300 uppercase group-hover:text-primaria transition-colors">Editar →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VISTA: CARDS DE CATEGORIAS (Home) */}
      {!activeLine && !isCreating && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div>
              <h2 className="text-3xl font-serif font-bold text-secundaria mb-1">Gestão de Produtos</h2>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Selecione uma linha para gerenciar o catálogo</p>
            </div>
            <div className="text-right border-l pl-6 border-gray-100">
              <p className="text-2xl font-serif font-bold text-secundaria">{produtos.length}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">produtos ativos</p>
            </div>
          </div>

          {loading ? (
            <p className="text-center text-gray-400 animate-pulse font-bold py-16">Carregando catálogo...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {PRODUCT_CATEGORIES.map(cat => {
                const count = byCategory[cat]?.length || 0;
                return (
                  <div key={cat} onClick={() => setActiveLine(cat)}
                    className={`group relative rounded-3xl border-2 p-8 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all ${CATEGORY_COLORS[cat]}`}>
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-5xl">{CATEGORY_ICONS[cat]}</span>
                      <span className="bg-white/80 backdrop-blur text-secundaria font-bold text-xs px-3 py-1 rounded-full shadow-sm border border-white">
                        {count} {count === 1 ? 'item' : 'itens'}
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-secundaria text-xl mb-1">{cat}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {cat === 'Insumos' ? 'Matérias-primas e suprimentos' : 'Clique para gerenciar a linha'}
                    </p>
                    <div className="mt-6 flex justify-between items-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); openCreateMode(cat); }}
                        className="bg-white border border-gray-200 text-secundaria font-bold text-[10px] uppercase px-3 py-2 rounded-lg hover:bg-secundaria hover:text-white transition-colors shadow-sm">
                        + Adicionar
                      </button>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest group-hover:text-secundaria transition-colors">Ver todos →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
