# Reserva de estoque no checkout — execução local, 03/10/2026

## Comportamento implementado

- `reserve_checkout` cria pedido, itens, reserva e logs na mesma transação.
  Preço, custo, publicação, quantidade e tarifa são validados dentro do banco.
  O preço enviado pelo navegador serve apenas para detectar alteração.
- Produtos são bloqueados em ordem de UUID. Chave UUID aleatória por tentativa
  serializa repetições e preserva o pedido original, inclusive após timeout.
- `products.stock` representa saldo disponível: a reserva já desconta unidades.
  O pagamento não desconta novamente. Uma confirmação gera uma única receita.
- O payload Stripe fica congelado em tabela privada. Cada repetição usa a mesma
  chave de idempotência e os mesmos parâmetros. A sessão expira em uma hora.
  Após 29 minutos da reserva, a aplicação só recupera sessões existentes.
- A chave da tentativa não fica na tabela de vendas acessível pelo painel.
  `sales.checkout_managed` é apenas um marcador booleano. Os dados da tentativa,
  incluindo identidade, chave e payload Stripe, têm acesso somente pelo servidor.
- `apply_checkout_session` bloqueia reserva/pedido, verifica sessão, metadata,
  valor e moeda. Eventos repetidos não duplicam receita ou movimento de estoque.
  Webhook recupera o estado atual da Stripe antes de aplicar um evento atrasado.
- Cancelar a tentativa expira a sessão na Stripe. Só a confirmação de sessão
  `expired` e `unpaid` devolve estoque. Voltar pelo botão da Stripe não basta.
  Se o pagamento vencer a disputa, o pedido permanece pago.
- Cancelamento anterior à chegada da reserva deixa uma marca privada: uma
  requisição atrasada não pode criar essa tentativa depois do cancelamento.
- Timeout/erro da Stripe não significa cancelamento: a reserva é preservada.
  Falha ao persistir a sessão também é recuperável com a mesma chave.
- Carrinho mantém a tentativa até pagamento/cancelamento. Retomada usa snapshot
  anterior, mesmo quando a própria reserva esgotou o saldo público. Respostas
  atrasadas não reaplicam a limpeza de um carrinho já processado.
- Painel bloqueia alteração genérica de pagamento, itens e financeiro desses
  pedidos. Entrega/rastreio permanecem editáveis. Exclusão é impedida.

## Arquivos e execução local

A fonte SQL permanece `supabase/schema-current.sql`, seção delimitada por
`CHECKOUT_RESERVATIONS_BEGIN/END`, mais adaptações nos gatilhos existentes.
Não há SQL incremental separado para executar em produção.

```powershell
npm run check
npm run test:db
npm run test:db:checkout
```

Os testes de banco usam apenas o contêiner fixo `camelia-roadmap-db`, isolado
com `--network none`, sem portas/volumes. As bases são `camelia_test` (ajuste
manual) e `camelia_checkout_test` (checkout). Fixtures limpam apenas tabelas
sintéticas desses bancos. Outros projetos Docker não são usados.

A suíte de checkout aplica a seção SQL duas vezes, utiliza os gatilhos atuais
e testa última unidade concorrente, mesma chave concorrente, carrinhos em
ordem inversa, payload alterado, permissões das RPCs/tabelas privadas, identidade,
frete ausente, rollback após falha no segundo item e no financeiro, pagamento e
expiração duplicados, evento fora de ordem e cancelamento anterior à reserva.
As fixtures não são clone de produção e não validam sua RLS completa.

APIs usam doubles da Stripe; páginas reais são renderizadas no servidor em
alguns testes. Isso não é homologação de Stripe real nem teste de navegador.

## Recuperação operacional

`server/reconcile-checkouts.js` processa páginas de reservas pendentes e consulta
sessões conhecidas ou busca por metadata na janela da criação. Há cursor para
casos antigos sem solução não bloquearem os posteriores. O script abaixo é
operacional, não faz parte da suíte e **não foi executado contra produção**:

```powershell
node --env-file=.env.staging scripts/reconcile-checkouts.mjs --run
```

Exige chave Stripe de teste por padrão. O arquivo `.env.staging` não foi criado
nem suas credenciais presumidas. A opção `--allow-live` existe para operação
posterior, somente após homologação e autorização de publicação.

Agendar essa reconciliação e monitorar `needs_review` é requisito de publicação;
não foi instalado cron remoto. Caso nenhuma sessão seja localizada, a reserva
permanece retida para revisão: ausência em uma busca não é prova suficiente
para liberar estoque. Não há limpeza automática só pelo relógio.

## Antes de publicar

1. Auditar SQL real, gatilhos adicionais, tipos, constraints e grants; obter backup.
   O schema consolidado ainda pressupõe tabelas e políticas legadas.
2. Homologar a migração em cópia compatível, com reaplicação e recuperação. Pausar
   compras durante a mudança coordenada de banco/API/frontend e validar sessões
   antigas ainda abertas. Não restaurar cegamente o código antigo depois de
   criar reservas: ele descontaria estoque novamente.
3. Usar Stripe de teste para compra aprovada/recusada, perda de resposta, webhook
   reenviado, retorno/cancelamento e expiração real. Configurar eventos
   `checkout.session.completed`, `checkout.session.async_payment_succeeded` e
   `checkout.session.expired`, assinatura e URLs corretas.
4. Homologar duas abas, recarga, armazenamento indisponível e troca de conta em
   navegador/celular. Contato/endereço da tentativa são persistidos localmente
   até conclusão/cancelamento; avaliar política de retenção para dispositivos
   compartilhados. Sem Web Locks, não há garantia de serialização entre abas.
5. Definir rotina de reconciliação/alertas e proteção contra abuso antes de
   habilitar reservas públicas: tentativas falsas podem reter disponibilidade.

## Limites mantidos explícitos

Reembolso não foi implementado. Cancelar uma sessão pendente não reembolsa um
pedido pago. O financeiro de reservas pagas não é apagado por cancelamento.
Sessões legadas usam compatibilidade com verificação de valor/sessão, mas não
recebem reserva retroativa. Estoque de pedidos legados e edições administrativas
de saldo ainda precisam da auditoria e da matriz completa de permissões.
Identidade de CRM por `auth_user_id` continua em outro lote; o vínculo atual
por e-mail confirmado não foi convertido silenciosamente.

As regras de expiração e idempotência seguem a documentação da Stripe:
[criação de sessão](https://docs.stripe.com/api/checkout/sessions/create),
[idempotência](https://docs.stripe.com/api/idempotent_requests),
[expiração](https://docs.stripe.com/api/checkout/sessions/expire) e
[webhooks](https://docs.stripe.com/webhooks).

## Resultado final

Duas rodadas finais concluídas em 03/10/2026:

| Verificação | Rodada 1 | Rodada 2 |
| --- | --- | --- |
| Testes da aplicação | 40/40 | 40/40 |
| ESLint e TypeScript | Aprovados | Aprovados |
| Build | Aprovado | Aprovado |
| Ajuste manual no PostgreSQL | Aprovado | Aprovado |
| Reserva/checkout no PostgreSQL | Aprovado | Aprovado |

A suíte reaplica a seção SQL antes dos cenários e após pagamento, conferindo
que os saldos e a receita não mudam. O build ainda avisa sobre bundle principal
(803,62 kB; 224,32 kB gzip) e base Browserslist desatualizada.
Nenhuma escrita em produção, cobrança, deploy ou chamada à Stripe real foi feita.
