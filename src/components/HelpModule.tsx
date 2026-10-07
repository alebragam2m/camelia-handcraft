import { useMemo, useState } from 'react';

type HelpSection = { id: string; icon: string; title: string; summary: string; steps: string[]; attention?: string };

const sections: HelpSection[] = [
  { id: 'inicio', icon: '🌿', title: 'Rotina de abertura', summary: 'O que conferir antes de começar o atendimento.', steps: [
    'Abra Visão Geral e confira faturamento, vendas recentes e produtos em alerta.',
    'Entre em Central de Vendas e verifique pedidos pagos que aguardam preparação ou envio.',
    'Confira o estoque físico dos produtos com saldo baixo antes de divulgar ou vender.',
    'Use o botão Sair ao terminar, principalmente em computadores compartilhados.',
  ] },
  { id: 'produtos', icon: '📦', title: 'Produtos e vitrine', summary: 'Cadastrar, editar, fotografar e publicar peças no site.', steps: [
    'Abra Produtos, escolha uma coleção e clique em “+ Novo” ou “+ Adicionar”.',
    'Preencha nome, preço de venda, custo, estoque inicial, coleção e descrição.',
    'Envie a foto principal, ajuste o enquadramento e adicione fotos extras quando necessário.',
    'Ative a exibição no site somente quando preço, fotos e estoque estiverem corretos.',
    'Para alterar um produto, abra a peça, faça as mudanças e clique em “Salvar Mudanças”.',
  ], attention: 'Depois do cadastro inicial, registre entradas e saídas pela área Estoque (PCP). Isso preserva o histórico do saldo.' },
  { id: 'estoque', icon: '📉', title: 'Estoque (PCP)', summary: 'Controlar entradas, saídas e correções de saldo.', steps: [
    'Pesquise o produto e clique em “Histórico PCP”.',
    'Clique em “Ajuste Manual” e escolha Entrada (+) ou Saída (-).',
    'Informe a quantidade e um motivo claro, como “Produção concluída”, “Avaria” ou “Contagem física”.',
    'Clique em “Salvar Calibração” e confirme o novo saldo no histórico.',
    'Faça uma contagem física periódica e corrija apenas a diferença encontrada.',
  ], attention: 'Uma compra online reserva o produto durante o pagamento. Sessões expiradas devolvem o saldo automaticamente. Não faça entrada manual antes de conferir o pedido.' },
  { id: 'vendas', icon: '💳', title: 'Pedidos e vendas', summary: 'Acompanhar compras do site e registrar vendas manuais.', steps: [
    'Abra Central de Vendas para consultar todos os pedidos.',
    'Considere o pagamento confirmado somente quando o status estiver “Paga” ou “Pago”.',
    'Use “+ Nova Venda” para vendas presenciais, encomendas ou vendas feitas fora do site.',
    'Abra “Ver Recibo” para conferir produtos, entrega, frete e dados do pedido.',
    'Atualize o status da entrega, informe o código de rastreio e clique em “Salvar entrega”.',
  ], attention: 'Pedidos Pendentes não entram no faturamento. Pedidos Cancelados ou Expirados não devem ser separados para envio.' },
  { id: 'pagamentos', icon: '✨', title: 'Pix e cartão', summary: 'Como interpretar pagamentos processados pela Stripe.', steps: [
    'O cliente escolhe cartão ou Pix na página segura da Stripe.',
    'No Pix, aguarde a confirmação automática; visualizar o QR Code não significa pagamento.',
    'Quando a Stripe confirmar, o pedido passa para “Paga” no painel.',
    'Se a sessão expirar sem pagamento, o pedido será cancelado e o estoque reservado voltará automaticamente.',
    'Em caso de dúvida, compare o pedido com o pagamento na Stripe antes de entregar a mercadoria.',
  ], attention: 'Nunca altere manualmente um pedido pendente para pago sem confirmar a entrada do valor na Stripe ou na conta bancária.' },
  { id: 'entrega', icon: '🚚', title: 'Frete, retirada e envio', summary: 'Configurar valores e concluir a entrega.', steps: [
    'Abra Frete para cadastrar ou editar o valor e o prazo de cada estado.',
    'Use o estado “Padrão (*)” como regra para locais sem tarifa específica.',
    'A retirada no ateliê aparece gratuitamente no checkout e deve ser combinada com o cliente.',
    'Depois da postagem, abra o pedido, selecione o status de entrega e informe o rastreio.',
    'Salve a entrega e confira se o dado aparece no recibo do pedido.',
  ] },
  { id: 'clientes', icon: '🤝', title: 'Clientes (CRM)', summary: 'Cadastrar contatos, endereços e preferências.', steps: [
    'Abra CRM Completo e clique em “+ Novo Cliente”.',
    'Preencha os dados de contato e endereço; marque VIP quando aplicável.',
    'Use o campo de observações para preferências e histórico de atendimento.',
    'Para atualizar um cadastro, clique em “Ficha / Editar” e depois em “Salvar Alterações”.',
    'Evite duplicidade: pesquise pelo nome, telefone ou e-mail antes de criar outro cadastro.',
  ] },
  { id: 'fornecedores', icon: '🧵', title: 'Fornecedores', summary: 'Manter a rede de parceiros organizada.', steps: [
    'Abra Fornecedores e clique em “+ Novo Parceiro”.',
    'Registre nome, contato, categoria e demais informações disponíveis.',
    'Atualize os dados quando houver mudança de contato ou condição comercial.',
    'Exclua apenas cadastros duplicados ou criados por engano.',
  ] },
  { id: 'financeiro', icon: '🏦', title: 'Financeiro (DRE)', summary: 'Registrar receitas, despesas e baixas.', steps: [
    'Clique em “+ Novo Lançamento” e escolha Entrada ou Saída.',
    'Informe descrição, categoria, valor, data e situação do lançamento.',
    'Use “Baixa” quando um lançamento pendente for efetivamente pago ou recebido.',
    'Revise o resumo mensal e compare-o periodicamente com a conta bancária e a Stripe.',
    'Exclua somente lançamentos duplicados ou inseridos por engano.',
  ], attention: 'Vendas do site entram no faturamento apenas após a confirmação do pagamento.' },
  { id: 'acessos', icon: '🔐', title: 'Usuários e segurança', summary: 'Controlar quem pode acessar cada parte do painel.', steps: [
    'Use Acessos/RBAC para consultar usuários, níveis e situação do acesso.',
    'Crie uma conta individual para cada pessoa; não compartilhe senhas.',
    'Suspenda imediatamente usuários que não fazem mais parte da operação.',
    'Reserve o nível Administrador para quem precisa gerenciar finanças e acessos.',
    'Mantenha autenticação em duas etapas ativa na Stripe, Supabase, Vercel, Resend e GoDaddy.',
  ] },
  { id: 'fechamento', icon: '✅', title: 'Rotina de fechamento', summary: 'Checklist diário e semanal da operação.', steps: [
    'Diariamente: confira pedidos pagos, entregas pendentes e movimentações de estoque.',
    'Diariamente: registre vendas externas e despesas que ainda não entraram no painel.',
    'Semanalmente: confira saldos físicos dos itens mais vendidos e produtos em alerta.',
    'Mensalmente: concilie vendas, taxas, fretes, receitas e despesas com os extratos.',
    'Antes de campanhas: revise estoque, preços, fotos, fretes e prazos.',
  ] },
];

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function HelpModule() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const term = normalize(query.trim());
    if (!term) return sections;
    return sections.filter(section => normalize([section.title, section.summary, section.attention, ...section.steps].filter(Boolean).join(' ')).includes(term));
  }, [query]);

  return (
    <section className="space-y-6 animate-fade-in-down">
      <div className="overflow-hidden rounded-[2rem] bg-[#2D2B52] text-white shadow-xl">
        <div className="grid gap-8 p-7 md:grid-cols-[1fr_auto] md:items-center md:p-10">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-indigo-300">Central de conhecimento</p>
            <h2 className="mt-3 font-serif text-3xl font-bold md:text-4xl">Manual de operação</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-indigo-100/80">Consulte os procedimentos do painel, da publicação de produtos até a confirmação de pagamentos e o fechamento financeiro.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center">
            <p className="text-2xl font-serif font-bold">{sections.length}</p>
            <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-indigo-300">Guias disponíveis</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <label htmlFor="help-search" className="sr-only">Pesquisar no manual</label>
        <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4">
          <span aria-hidden="true">🔎</span>
          <input id="help-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Pesquisar: Pix, estoque, produto, frete..." className="w-full bg-transparent py-4 text-sm font-semibold text-secundaria outline-none placeholder:text-gray-300" />
        </div>
      </div>

      {filtered.length ? (
        <div className="grid items-start gap-5 lg:grid-cols-2">
          {filtered.map((section, index) => (
            <details key={section.id} open={!query && index === 0} className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm open:shadow-md">
              <summary className="flex cursor-pointer list-none items-center gap-4 p-6 select-none [&::-webkit-details-marker]:hidden">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xl">{section.icon}</span>
                <span className="min-w-0 flex-1"><span className="block font-serif text-xl font-bold text-secundaria">{section.title}</span><span className="mt-1 block text-xs leading-relaxed text-gray-400">{section.summary}</span></span>
                <span className="text-lg font-bold text-indigo-300 transition-transform group-open:rotate-45" aria-hidden="true">＋</span>
              </summary>
              <div className="border-t border-gray-100 px-6 pb-7 pt-5">
                <ol className="space-y-4">
                  {section.steps.map((step, stepIndex) => <li key={step} className="flex gap-3 text-sm leading-relaxed text-gray-600"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#5B4BBF] text-[10px] font-bold text-white">{stepIndex + 1}</span><span>{step}</span></li>)}
                </ol>
                {section.attention && <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs font-semibold leading-relaxed text-amber-800"><span className="mr-2" aria-hidden="true">⚠️</span>{section.attention}</div>}
              </div>
            </details>
          ))}
        </div>
      ) : <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center"><p className="font-serif text-xl font-bold text-secundaria">Nenhum guia encontrado</p><p className="mt-2 text-sm text-gray-400">Tente pesquisar com outra palavra.</p></div>}

      <div className="rounded-3xl border border-indigo-100 bg-indigo-50/60 p-6 text-center">
        <p className="font-serif text-lg font-bold text-secundaria">Precisa de atendimento?</p>
        <p className="mt-2 text-sm text-gray-500">Registre o que aconteceu, o horário e o número do pedido. Depois escreva para <a className="font-bold text-[#5B4BBF] underline" href="mailto:ola@cameliahandcraft.com.br">ola@cameliahandcraft.com.br</a>.</p>
      </div>
    </section>
  );
}
