# Execução do primeiro lote — 02/10/2026

## Entregas locais

- API de checkout separada em handler testável, com validação de contato/UF,
  identidade verificada quando há token e URLs de retorno baseadas em SITE_URL.
- Visitante não consulta nem altera CRM; client_id fica nulo e o contato/endereço
  fica em shipping_address. Usuário autenticado não sobrescreve perfil existente.
- Reutilização de Stripe Customer e cartões salva suspensa até vínculo estável.
- Consulta mínima de pagamento via servidor: exige sessão Stripe e pedido
  compatíveis, valor/moeda correspondentes e ambos confirmados para anunciar pago.
- Página distingue ausência de sessão, consulta, pendência, erro, cancelamento,
  expiração e pagamento confirmado; consulta periódica limitada e tentativa manual.
- Carrinho preservado no redirecionamento; snapshot por sessão permite descontar
  apenas itens pagos uma vez. Itens novos/reinseridos são preservados. Escritas
  entre abas são serializadas por Web Locks onde disponível.
- Falhas de armazenamento são apresentadas ao usuário, sem apagar silenciosamente.
- Frete exige tarifa explícita (zero é permitido); falha de consulta não vira zero.
- Serviço e formulário de estoque rejeitam quantidades fracionárias; recusa da RPC
  é propagada como erro, sem mensagem de sucesso.
- Resumo do pedido no painel mostra contato/endereço visitante e valores; não é
  documento fiscal. Nome do pedido tem preferência sobre cadastro atual do CRM.
- Comunicação de PIX retirada do checkout/rodapé, pois API aceita só cartão.
- Consulta de frete atualiza periodicamente; painel invalida tarifas por eventos.
- Scripts npm typecheck/check e .env.example adicionados.

## Auditoria remota somente-leitura

Ambiente confirmado pelo usuário: produção. Consultas HEAD e metadados OpenAPI;
nenhum registro de cliente lido, nenhuma escrita ou cobrança efetuada.

| Consulta anônima | Resultado |
| --- | --- |
| storefront_products | HTTP 206, contagem 49 |
| shipping_rates | HTTP 200, contagem visível 0 |
| clients | HTTP 401 |
| sales | HTTP 401 |
| sale_items | HTTP 401 |
| inventory_logs | HTTP 200, contagem visível 0 |

Zero registros visíveis não prova uma política correta nem ausência de registros
privados. Metadados com service role confirmaram sales.client_id opcional,
shipping_address JSONB, IDs UUID e ausência de clients.auth_user_id.
As RPCs esperadas constam da API. OpenAPI não comprova definições, RLS, gatilhos,
constraints nem privilégios de coluna; a auditoria SQL completa ainda é necessária.
Em 03/10, Docker disponível: PostgreSQL isolado no contêiner camelia-roadmap-db,
sem rede, portas publicadas ou volumes. Outros projetos não foram alterados.

## Antes de publicar

1. Configurar SITE_URL no servidor com a origem HTTPS confiável da loja, além das
   variáveis existentes de Stripe/Supabase. Não é variável VITE_.
2. Cadastrar tarifas de frete válidas pelo painel; criar tarifa zero somente se a
   política comercial for entrega grátis. Sem tarifa aplicável, compra é bloqueada.
3. Homologar API + Stripe em modo de teste. Vite sozinho não executa api/*.js;
   usar ambiente que execute as funções Vercel com credenciais de homologação.
4. Conferir compras visitantes, consulta pelo link de retorno, atendimento e painel.
   Pedidos de visitante não aparecem automaticamente em uma conta só pelo e-mail;
   associação segura faz parte da migração de identidade.
5. Executar as verificações completas duas vezes e homologar navegador/celular.

## Limites e próxima entrega

Não publicado. Nenhuma migração aplicada. Reserva concorrente de estoque,
idempotência transacional, recuperação de pedidos parciais, matriz de permissões,
reembolso/reconciliação e associação estável de identidade continuam pendentes.
O risco de duas compras simultâneas da última unidade ainda existe no fluxo atual.
A API de contato ainda precisa de proteção contra abuso. A RPC pública histórica
get_sale_by_session deve ser revisada na migração; a nova página não a utiliza.

Próximo lote: obter auditoria SQL completa e ambiente de homologação, validar a
matriz em MATRIZ-PERMISSOES.md e implementar pedido/reserva/transições no banco.

## Verificação

Resultados finais são registrados no roadmap após as duas rodadas completas.
Testes de APIs usam doubles de Stripe/Supabase; teste da página renderiza o
componente real com React no servidor; não substituem homologação em navegador.

## Continuação — 03/10/2026

A função de ajuste manual no schema consolidado agora rejeita quantidade nula,
zero ou negativa e tipo inválido, e bloqueia a linha do produto antes de validar
e descontar saldo. Alteração e log permanecem na mesma transação.

`npm run test:db` executa a função extraída do schema em PostgreSQL real,
reaplica sua definição duas vezes e verifica permissão de execução, níveis 0/1,
entradas inválidas, duas saídas concorrentes da última unidade e rollback quando
a gravação do log falha. O alvo é fixo: camelia-roadmap-db/camelia_test.

A fixture é sintética e mínima; a função de nível administrativo é simulada.
Não comprova RLS completa, vínculo de identidade, gatilhos de vendas ou paridade
com produção. O teste limpa somente essas tabelas do banco descartável.
Nenhuma migração foi aplicada em produção.

Resultado em 03/10: duas execuções completas de `npm run check` aprovadas
(28/28 testes, lint, TypeScript e build) e duas execuções independentes de
`npm run test:db` aprovadas. Cada execução reaplica a definição da função.

## Atualização posterior: reservas

A continuação em `EXECUCAO-RESERVA-CHECKOUT.md` substitui o estado anterior
de reserva/idempotência pendentes: esses fluxos foram implementados localmente.
Produção permanece inalterada e os limites de homologação continuam válidos.
