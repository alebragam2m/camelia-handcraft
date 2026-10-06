# Homologação e publicação

## Situação atual

O projeto Vercel local está vinculado a `camelia-handcraft`. O branch atual é
`main`, alinhado ao `origin/main`; as alterações do roadmap ainda estão sem
commit. O único ambiente Supabase identificado anteriormente foi confirmado
como produção. Nenhum deploy ou migração remota deste lote foi realizado.

## Ambientes obrigatórios

Homologação precisa de um projeto Supabase separado, Stripe em modo de teste e
um deployment Preview/Staging da Vercel. Não reutilizar banco, service role,
webhook ou dados de produção.

Configurar no ambiente de homologação:

- `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` do Supabase de homologação;
- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` do mesmo projeto;
- `STRIPE_SECRET_KEY` iniciando com `sk_test_`;
- `STRIPE_WEBHOOK_SECRET` exclusivo do endpoint de homologação;
- `SITE_URL` com a origem HTTPS exata do deployment;
- `RESEND_API_KEY` apropriada para o teste de contato, quando essa etapa for habilitada.

O preflight não imprime segredos:

```powershell
node --env-file=.env.staging scripts/preflight-environment.mjs --target staging
```

Na primeira homologação, `RESEND_API_KEY` pode ficar vazia e o contato deve ser
registrado como não homologado. Quando a Resend estiver configurada, validar com:

```powershell
node --env-file=.env.staging.local scripts/preflight-environment.mjs --target staging --with-contact
```

Produção exige `sk_live_` e deve ser verificada separadamente:

```powershell
node --env-file=.env.production scripts/preflight-environment.mjs --target production
```

Arquivos `.env.staging` e `.env.production` são ignorados por `*.local` apenas
se usarem esse sufixo; portanto, preferir `.env.staging.local` e
`.env.production.local`, ou nunca criá-los dentro do repositório.

## Sequência de homologação

1. Criar backup e obter auditoria SQL completa do banco de homologação.
2. Restaurar uma cópia sanitizada compatível com produção, sem clientes reais.
3. Aplicar `supabase/schema-current.sql` e reaplicá-lo; comparar funções,
   gatilhos, constraints, grants, RLS, Storage e Realtime com a fonte versionada.
4. Executar `npm run check`, `npm run test:db`, `npm run test:db:checkout` e
   `npm run test:catalog`.
5. Criar deployment de homologação e configurar o webhook Stripe para
   `checkout.session.completed`, `checkout.session.async_payment_succeeded` e
   `checkout.session.expired`.
6. Fazer compras reais no modo de teste: aprovada, recusada, cancelada,
   expirada, duas abas na última unidade, webhook reenviado e retorno tardio.
7. Testar painel com usuários dos níveis 1–4, cadastro/edição de produto,
   upload/remoção de fotos, estoque PCP, vitrine e celular. Testar contato quando
   domínio, remetente, destinatário e chave Resend estiverem configurados.
8. Rodar reconciliação em homologação e confirmar que não existem reservas em
   `needs_review`, receitas duplicadas, estoques negativos ou sessões órfãs.
9. Registrar evidências, responsáveis, horário, hashes do commit/schema e decisão.

## Promoção posterior para produção

Publicar banco, APIs e frontend na mesma janela, com compras pausadas. Antes da
mudança: backup verificável, inventário de sessões Stripe antigas, plano de
rollback e credenciais de produção conferidas pelo preflight. Depois: smoke test
com produto controlado, monitoramento de webhook/erros/reservas e conciliação.

Rollback não pode simplesmente restaurar o código antigo depois que reservas
novas existirem, pois o fluxo antigo pode descontar estoque novamente. Se a
publicação falhar, pausar checkout, manter webhooks ativos e reconciliar as
reservas antes de qualquer reversão de schema ou aplicação.

## Bloqueio atual

Para iniciar a homologação remota faltam as credenciais e URLs do Supabase de
homologação, Stripe test, webhook e deployment Vercel. Resend não bloqueia os
fluxos principais, mas contato ficará pendente e continua obrigatório antes da
publicação em produção. Até receber os demais dados, somente a homologação local
está concluída.
