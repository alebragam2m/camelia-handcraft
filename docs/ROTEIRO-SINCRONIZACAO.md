# Roteiro: painel como central de gestão da Camélia

## Objetivo e regras

O Supabase é a fonte única dos dados. O painel gerencia a empresa; a loja consulta o catálogo publicado no mesmo banco. Não há cópia manual de preços ou produtos.

- Produtos, preços, fotos, descrições, coleções e disponibilidade alterados no painel devem atualizar as páginas abertas da loja.
- Clientes e pedidos da loja devem aparecer na gestão. Dados pessoais só aparecem ao próprio cliente e à equipe autorizada; custos, fornecedores e notas internas não fazem parte do catálogo público.
- Um pedido preserva preço, itens e endereço do momento da compra. Alterar o catálogo não altera vendas anteriores.
- O carrinho acompanha o catálogo, mas o servidor deve recalcular e validar a compra antes de cobrar.
- Meta de homologação: alterações visíveis em até 5 segundos com Realtime conectado; recuperação por consulta em até 30 segundos em abas ativas quando o canal falhar. Medir em dois navegadores antes de considerar aprovado.

## Ordem de execução

| Ordem | Entrega | Critério para concluir |
| --- | --- | --- |
| P0.1 | Inventariar banco, permissões e ambientes | Conferir schema real, RLS, funções, Storage, publicação Realtime e variáveis da Vercel; preservar backup antes de migrações. |
| P0.2 | Catálogo e painel sincronizados | Criar, editar preço/foto/coleção, ocultar e ajustar estoque no painel; observar atualização em outro navegador sem recarregar. |
| P0.3 | Permissões e dados públicos | Visitante só lê catálogo publicado; cliente só acessa seus dados/pedidos; níveis da equipe aplicados no banco e nas APIs. Nenhum cadastro público gera administrador. |
| P0.4 | Pedido, cobrança e estoque atômicos | Preço calculado no servidor, pedido autorizado, endereço salvo, reserva de estoque, idempotência e cancelamento/expiração sem perda de consistência. |
| P1.1 | CRM e conta do cliente | Identidade ligada ao usuário autenticado; cadastros sem duplicação; edição autorizada refletida em ambas as áreas; endereço e histórico preservados. |
| P1.2 | Financeiro confiável | Recebidos separados de pendentes; reembolso/cancelamento reconciliados; venda manual usa a mesma regra de estoque da loja. |
| P1.3 | Operação de entrega | Política de frete explícita, endereço por pedido, etapas de produção/envio e acompanhamento do cliente. |
| P2 | Qualidade e publicação | Build, lint, tipos e testes críticos passando; teste em celular e dois navegadores; configurações documentadas e monitoramento de falhas. |

## Configurações externas: P0.1 e P0.3

1. Rodar `supabase/audit-sync.sql` no SQL Editor e revisar os resultados. É uma consulta de metadados; não modifica dados e não retorna registros de clientes.
2. Comparar UUID/BIGINT das tabelas com as funções instaladas. Os SQLs antigos da raiz não são uma migração completa e não devem ser reaplicados sem revisão.
3. Revisar RLS e privilégios de `products`, `clients`, `sales`, `sale_items`, `inventory_logs`, `admin_users`, `suppliers`, `financial_transactions` e Storage.
4. Revisar o gatilho de novos usuários: clientes não podem receber acesso administrativo automaticamente nem escolher sua função por metadados de cadastro.
5. Habilitar Realtime apenas nas tabelas necessárias, depois de aprovar suas permissões. A assinatura no frontend não substitui RLS.
6. Confirmar bucket `product-images`: leitura das imagens públicas, upload/edição/exclusão só da equipe autorizada.
7. Conferir ambientes separados de homologação/produção. Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Servidor: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. Nunca colocar chave privilegiada em variável `VITE_*`.
8. Validar URLs de autenticação, provedores sociais realmente configurados e endpoint do webhook. Não ativar cobranças reais para testar.

## Execução nesta rodada

- [x] Roteiro e consulta de auditoria preparados.
- [x] Base local de sincronização do catálogo, carrinho e painel implementada e verificada.
- [ ] Auditoria do banco real e ajustes de RLS/publicação Realtime aplicados.
- [ ] Homologação em duas sessões com usuários de níveis distintos.
- [ ] Checkout seguro e transacional concluído.
- [ ] CRM completo e identidade de clientes consolidados.

## Cenários de aceite

1. Cadastrar produto publicado: aparece no catálogo e na coleção em outra sessão.
2. Alterar nome, preço, imagem e coleção: catálogo, detalhe e carrinho acompanham. Pedido anterior mantém os valores originais.
3. Ocultar produto ou marcá-lo como insumo: some das listagens e não pode ser comprado pela URL direta ou carrinho antigo.
4. Ajustar estoque: painel e loja concordam; carrinho informa quando a quantidade escolhida ficou indisponível.
5. Desconectar/reconectar a rede: dados voltam a atualizar; o painel não anuncia conexão em tempo real quando o canal falhou.
6. Criar/editar cliente e registrar pedido: outras sessões autorizadas do painel atualizam os módulos envolvidos.
7. Entrar como outro usuário no mesmo navegador: nenhum cache privado da sessão anterior permanece.
8. Comprar simultaneamente a última unidade; repetir webhook; cancelar pagamento; simular falha entre as escritas: nenhuma cobrança, baixa ou receita duplicada.

## Limite da implementação local

Alterar arquivos não configura o Supabase ou publica na Vercel. O Realtime e o isolamento de dados só estão homologados após verificar o banco real. A consulta periódica é recuperação de sincronização, não garantia de estoque nem controle de acesso.

## Evidências e pendências desta rodada

- 11 testes automatizados: publicação/coleções, atualização de preço e imagem no carrinho, indisponibilidade, campos do formulário, evento externo atualizando consulta ativa, reconexão, consulta periódica, limpeza do cache privado e preço/custo calculados pelo servidor.
- Lint dos módulos JavaScript de sincronização passou. O TypeScript geral ainda tem 17 erros preexistentes, incluindo o tipo Database ausente; não foi declarado concluído.
- O catálogo público real respondeu HTTP 200 com todas as colunas esperadas.
- PRIORIDADE: consultas anônimas (sem login) retornaram contagens de 7 registros em clients e 1 em sales. Isso confirma visibilidade anônima de registros; não foram exibidos dados pessoais nem testadas escritas. Precisamos revisar as políticas reais antes de publicar.
- admin_users e financial_transactions retornaram contagem zero para a consulta anônima; isso, isoladamente, não prova que suas políticas estejam corretas.
- Aguardando o JSON de audit-sync.sql para preparar uma migração compatível com o banco real. Nenhuma política, publicação Realtime ou dado remoto foi alterado nesta rodada.
- O servidor passou a validar preços e disponibilidade atuais e calcular custo a partir do banco, sem enviar custos ao catálogo público. Autorização do pedido, conferência transacional dos itens e reserva/idempotência seguem na P0.4.
- O painel revalida acesso a cada 30 segundos e por eventos de admin_users. O cache privado é removido na troca de conta. Essas medidas não substituem as políticas do banco.
- A conta do cliente ainda precisa da P1.1; esta rodada atualiza automaticamente os módulos de clientes no painel, mas não conclui o vínculo de identidade nem o cadastro de endereços.
