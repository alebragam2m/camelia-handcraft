# Roadmap de prioridades — Camélia Handcraft

Atualizado: 03/10/2026. Status: execução local em andamento, sem publicação.
Entregas e limites: `EXECUCAO-LOTE-1.md`. Itens marcados indicam implementação
local testada; a homologação integrada e a publicação permanecem pendentes.

Este é o roteiro principal para as próximas entregas. O documento
`ROTEIRO-SINCRONIZACAO.md` permanece como histórico da iniciativa de sincronização.
As observações antigas sobre exposição remota e erros de TypeScript precisam ser
interpretadas pela data de sua verificação, não como diagnóstico atual de produção.

## Ponto de partida

- Duas execuções locais: 11/11 testes, lint, build e TypeScript passaram.
- Build: JavaScript principal de 797,31 kB (221,58 kB gzip), com aviso de tamanho.
- Três comportamentos reproduzidos duas vezes com serviços simulados: checkout
  reutiliza cliente sem verificar identidade; falha na consulta de frete vira zero;
  recusa de ajuste de estoque não é propagada como erro pelo serviço.
- Banco remoto, pagamentos reais e experiência em navegador/celular não foram
  homologados nesta revisão. As conclusões sobre SQL descrevem os arquivos locais.
- Preservar: preço autoritativo em centavos, catálogo compartilhado, reconciliação
  do carrinho, limpeza do cache privado, assinatura do webhook e organização por serviços.

## Ordem de execução

| Ordem | Prioridade | Entrega | Dependência |
| --- | --- | --- | --- |
| 0 | P0 | Diagnóstico do ambiente e plano de migração | Nenhuma |
| 1 | P0 | Identidade e autorização | 0 para mudanças no banco |
| 2 | P0 | Correções imediatas nos fluxos atuais | Pode começar durante 0 |
| 3 | P0 | Consistência de pedido, pagamento e estoque | 0 e 1 |
| 4 | P1 | Financeiro, CRM e histórico confiáveis | 3 |
| 5 | P1 | Jornada completa de compra e atendimento | 1, 2 e 3 |
| 6 | P2 | Desempenho, acessibilidade e manutenção | Fluxos críticos estabilizados |
| 7 | P0/P1 | Homologação e publicação da operação corrigida | Critérios críticos aprovados |

Testes acompanham cada entrega. A fase 7 é a validação integrada; não é o início
dos testes. Melhorias cosméticas da fase 6 não bloqueiam correções críticas.

## 0. Conhecer e reproduzir o ambiente

- [ ] Comparar `supabase/audit-sync.sql` com schema, funções, gatilhos, constraints,
  privilégios, RLS, Storage e publicação Realtime efetivamente instalados.
- [ ] Identificar ambientes de desenvolvimento, homologação e produção; conferir
  configuração de autenticação, URLs, Stripe, webhook e envio de contato.
- [ ] Preservar backup antes de migrações e definir recuperação de falhas.
- [ ] Completar a representação versionada do banco: tabelas/colunas necessárias,
  habilitação de RLS, políticas de Storage e gatilho de pagamento hoje pressupostos.
- [ ] Definir migração do estado existente e procedimento de instalação limpa;
  manter o schema consolidado coerente e arquivar SQLs antigos perigosos da raiz.
- [ ] Inventariar inconsistências existentes sem corrigir saldos automaticamente:
  pedidos sem itens, sessões órfãs, receitas divergentes e cadastros duplicados.

Aceite: ambiente de homologação reproduzível; diferenças com produção documentadas;
migração testada em cópia e segunda aplicação sem efeitos indevidos.

## 1. Impedir acesso e alterações indevidas

- [ ] Vincular o cliente autenticado a uma identidade estável (`auth_user_id`),
  com migração cuidadosa dos cadastros associados atualmente por e-mail.
- [x] Checkout autenticado valida identidade no servidor antes de atualizar perfil
  ou reutilizar Stripe Customer. E-mail enviado no formulário não prova identidade.
- [ ] Preservar compra como visitante com dados próprios do pedido, sem sobrescrever
  cadastro existente nem reutilizar Customer/cartões de outra pessoa. Vincular
  compras ao perfil somente após comprovação de identidade.
- [ ] Definir matriz de ações e campos por nível: 1 consulta permitida; 2 operação
  comercial/estoque; 3 gestão financeira; 4 administração. Aplicar no banco e APIs.
- [ ] Separar dados públicos, dados do próprio cliente e campos internos; remover
  acesso a custos/notas por consultas alternativas às tabelas base.
- [ ] Alinhar telas e consultas às permissões, inclusive revogação durante a sessão.
- [ ] Revisar acesso a logs de estoque, uploads e funções SECURITY DEFINER.
- [ ] Impedir que cadastro público ou metadados escolhidos pelo usuário criem admin.
- [ ] Validar origem de retorno do checkout por configuração confiável; limitar e
  validar entradas das APIs; definir proteção contra abuso em checkout e contato.

Aceite: testes com visitante, clientes A/B e níveis 1–4 comprovam isolamento de
linhas e colunas; nível 1 não escreve; visitante não altera cadastro conhecido;
nenhuma sessão de checkout usa Customer de terceiro por coincidência de e-mail.

## 2. Eliminar respostas incorretas ao usuário

- [x] Página de pagamento distingue sessão ausente/inválida, aguardando confirmação,
  pago, falha e cancelamento; reconsulta enquanto espera confirmação, com limite e
  caminho de recuperação.
- [x] Preservar carrinho ao sair para Stripe e ao cancelar; limpar apenas os itens
  do pedido confirmado, sem apagar itens adicionados depois em outra aba.
- [ ] Converter `{ success: false }` das RPCs em erro tratado pelos componentes.
- [x] Falha de consulta de frete interrompe/reprograma a tentativa; frete grátis
  só ocorre por regra comercial explícita. Validar UF e valores no servidor.
- [ ] Distinguir erro de carregamento de lista vazia nos módulos administrativos
  e na conta do cliente; oferecer nova tentativa e mensagens compreensíveis.
- [x] Alinhar anúncio de PIX ao meio realmente habilitado; enquanto a API aceitar
  apenas cartão, ajustar a comunicação. Não ativar modalidade sem homologação.

Aceite: cenários sem sessão, webhook atrasado, recusa da RPC, banco indisponível e
retorno da Stripe não produzem falso sucesso, frete grátis acidental ou perda do carrinho.

## 3. Tornar pedido, estoque e pagamento consistentes

Entrega local de reservas: `EXECUCAO-RESERVA-CHECKOUT.md`. As marcações de
webhook/baixa/liberação referem-se aos novos pedidos com reserva; pedidos legados
e vendas manuais ainda têm itens próprios pendentes. Stripe real não homologada.

- [ ] Definir estados e transições válidas de pedido, pagamento, reserva, entrega e
  reembolso; normalizar os status legados sem causar nova baixa de estoque.
- [x] Criar pedido, itens e reserva em transação no banco, com preços e quantidades
  validados, bloqueio de concorrência e identificador idempotente da tentativa.
- [ ] Integrar Stripe com idempotência e recuperação: banco e Stripe não compartilham
  uma única transação. Registrar etapas e compensar falhas/expirar sessões órfãs.
- [x] Processar webhook por identificador único do evento e transição válida;
  conferir pedido, sessão, valor, moeda e condição de pagamento antes de confirmar.
- [x] Evitar baixa/receita duplicada em repetição, concorrência e eventos fora de
  ordem; um evento antigo não deve reabrir pedido cancelado indevidamente.
- [x] Liberar reservas por expiração/cancelamento com tratamento de disputa entre
  confirmação e liberação. Não reutilizar estoque com pagamento ainda indefinido.
- [ ] Unificar venda manual e online sob invariantes comuns; validar quantidades
  positivas, valores, itens e permissões também nas RPCs.
- [x] Tornar ajuste de estoque seguro sob concorrência e rejeitar entradas inválidas.
- [ ] Retirar `GREATEST(0, ...)` como ocultação de insuficiência; registrar e resolver
  conflitos existentes sem fabricar estoque em cancelamento/devolução.
- [ ] Evitar exclusão parcial de venda: preferir cancelamento auditável; se exclusão
  for necessária, aplicar operação atômica e restrita no banco.
- [ ] Separar cancelamento operacional de reembolso; registrar pendência, resultado
  e reconciliação do dinheiro, mantendo rastreabilidade.

Aceite: duas compras concorrentes da última unidade não geram dois pedidos pagos
atendíveis; repetição de evento não duplica baixa/receita; falha em cada etapa tem
recuperação; cancelamento/expiração não perde nem cria unidades.

## 4. Corrigir registros comerciais e relatórios

- [ ] LTV/total comprado usa a regra de pagamentos confirmados e reembolsos;
  pedidos pendentes/cancelados continuam no histórico, separados das métricas.
- [ ] Venda manual persiste desconto, frete, data e demais componentes do total;
  datas financeiras e comerciais seguem regra explícita, sem atualização posterior
  silenciosa ou busca da última venda como fallback.
- [ ] Definir como concluir venda manual pendente sem baixar estoque novamente.
- [ ] Preservar snapshots de nome, preço, custo, itens e endereço no pedido;
  alteração do catálogo não reescreve a descrição de uma compra histórica.
- [ ] Padronizar CEP/telefone/endereço e seus tipos; migrar duplicidades sem perda.
- [ ] Atualização do perfil invalida/refaz as consultas pertinentes; sincronizar
  também conta do cliente e fretes conforme a necessidade de cada tela.
- [ ] Uniformizar datas e fuso nos relatórios; distinguir faturamento, recebimento,
  custo de produto, despesas, taxas, frete e lucro estimado.
- [ ] Corrigir diferenças históricas apenas após relatório de reconciliação revisado.

Aceite: pedido de exemplo com frete/desconto confere no banco, recibo e relatórios;
cancelados não inflacionam LTV; renomear produto não altera histórico; totais são
conferidos contra registros completos, não apenas a primeira página de consulta.

## 5. Completar a jornada comercial

- [ ] Implementar recibo ou retirar o botão sem ação até sua entrega.
- [ ] Completar dados/endereço da conta e preenchimento do checkout; preservar telefone
  informado no cadastro quando a confirmação de e-mail exige outra sessão.
- [ ] Alinhar política exibida de frete/prazo com cálculo e opções reais; usar prazos
  cadastrados quando aplicáveis e informar ausência de estimativa.
- [ ] Validar endereço necessário para a operação de entrega escolhida.
- [ ] Revisar edição de fornecedores e gestão de acessos: ações disponíveis,
  erros de permissão e instruções para criação efetiva de acesso administrativo.
- [ ] Conferir login, confirmação de e-mail, retorno ao checkout e recuperação de conta.
- [ ] Homologar rastreio, status de entrega, contato e comunicações de erro/sucesso.
- [ ] Revisar textos institucionais para corresponder ao serviço implementado;
  revisão jurídica de políticas é uma atividade separada da revisão técnica.

Aceite: usuário percorre cadastro/entrada, compra, cancelamento de pagamento,
confirmação e acompanhamento sem botão inerte ou promessa não implementada.

## 6. Qualidade técnica, desempenho e experiência

- [ ] Executar lint em TS/TSX e tornar checagem de tipos parte da validação de entrega;
  reduzir `any` nas fronteiras críticas e tipar banco, payloads e resultados.
- [ ] Adicionar CI com testes, lint, tipos e build; testar cada correção junto com sua
  implementação, incluindo integração com banco de homologação e APIs simuladas.
- [ ] Separar carregamento de loja/painel por rota e medir tamanho e carregamento;
  definir orçamento de desempenho a partir de medição em celular.
- [ ] Paginar consultas e calcular agregados completos no banco quando necessário.
- [ ] Otimizar imagens, remover textura legada de ~26 MB se sem uso, evitar publicar
  `debug_logos.html` e revisar dependências de imagens/fontes externas.
- [ ] Melhorar labels, nomes acessíveis, teclado, foco/Escape nos modais, contraste,
  tamanho de texto e tabelas em telas pequenas; respeitar movimento reduzido.
- [ ] Consolidar formatação monetária e remover telas simuladas/CSS/scripts obsoletos
  após conferir referências; corrigir configuração que aponta para vite.config.ts inexistente.
- [ ] Melhorar metadados e compartilhamento das páginas públicas.
- [ ] Substituir README de template por instalação, variáveis sem segredos, comandos,
  arquitetura, migrações, publicação e recuperação; atualizar documentação histórica.
- [ ] Atualizar dados do Browserslist e revisar dependências com validação de compatibilidade.

Aceite: pipeline cobre código efetivamente usado; desempenho antes/depois registrado;
fluxos principais utilizáveis no teclado e celular; instalação documentada funciona.

## 7. Homologar e publicar com evidências

- [ ] Reexecutar duas vezes testes automatizados, lint, tipos e build após as correções.
- [ ] Repetir duas vezes os cenários críticos em homologação: duas sessões/contas,
  estoque concorrente, falha de rede, webhook repetido/atrasado, cancelamento e retorno.
- [ ] Confirmar atualização entre painel/loja: até 5 s com eventos funcionais e até
  30 s por consulta em aba ativa; adaptar a assinatura às políticas efetivas.
- [ ] Verificar se os alertas refletem conexão real e se dados privados somem na troca
  de conta e revogação de acesso.
- [ ] Validar Stripe em modo de teste, frete e envio de contato em ambiente controlado.
- [ ] Preparar logs e alertas para falhas de checkout, webhook, estoque e reconciliação,
  com identificadores de correlação e sem conteúdo pessoal desnecessário.
- [ ] Preparar publicação, aplicação de migração, rollback e verificação pós-publicação.
- [ ] Registrar evidências e pendências; só marcar concluído o que foi verificado no
  ambiente correspondente. Build local não comprova segurança do banco remoto.

Critério de liberação: P0 aprovado; nenhuma falha conhecida de identidade, cobrança,
estoque ou falso sucesso; limitações P1 remanescentes explicitadas e compatíveis com
o escopo efetivamente oferecido. Publicação é uma etapa própria de execução.

## Primeiro lote de trabalho

1. Inventário remoto somente-leitura e desenho da matriz de permissões (fase 0/1).
2. Correções locais de falso pagamento confirmado, carrinho, erro de RPC e frete (fase 2).
3. Identidade segura no checkout e plano de migração dos clientes (fase 1).
4. Transação de pedido/reserva e idempotência Stripe/webhook (fase 3).

O roadmap não fixa datas sem conhecer o banco instalado. Cada lote deve terminar
com mudança revisável, testes, evidências e lista explícita do que ainda depende
de configuração externa. Funcionalidades novas entram depois da estabilização.

## Evidência local — 03/10/2026

Duas rodadas de `npm run check`: 28/28 testes, ESLint, TypeScript e build
aprovados em ambas. Bundle principal: 802,33 kB (223,89 kB gzip); permanecem
os avisos de tamanho e base Browserslist desatualizada.

Ajuste manual de estoque corrigido e validado em PostgreSQL isolado. A suíte
`npm run test:db` cobre concorrência e rollback. A reserva do checkout, identidade
estável e matriz completa de permissões continuam pendentes; esta entrega não
encerra P0 nem libera publicação. Compra visitante já não altera CRM, mas a
associação posterior segura ao perfil permanece pendente.

### Continuação: reservas do checkout

Implementados pedido/itens/reserva atômicos, idempotência de tentativa e Stripe,
confirmação/expiração serializadas, cancelamento confirmado pela Stripe e
recuperação operacional de sessões. Casos ambíguos retêm saldo para revisão.
Identidade estável, matriz completa, reembolsos, proteção contra abuso e
homologação/publicação continuam pendentes.

Validação final deste lote: duas rodadas de 40/40 testes, lint, TypeScript, build,
ajuste manual no PostgreSQL e reserva/checkout no PostgreSQL aprovadas.
Detalhes, recuperação e pré-requisitos de publicação no documento de execução.

### Integração catálogo — 03/10/2026

Duas rodadas de 12/12 cenários no Chromium aprovaram cadastro e edição de
produto, fotos, coleção, publicação/ocultação, estoque PCP, polling da vitrine,
falhas de gravação e layout móvel, usando PostgreSQL local. O formulário bloqueia
salvamento durante upload e detecta alteração concorrente do estoque. Evidências
e limites constam em `TESTE-INTEGRACAO-CATALOGO.md`. Storage, Realtime e RLS de
produção ainda dependem da homologação do ambiente real.
