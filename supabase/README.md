# SQL do Supabase

- **`schema-current.sql`** é a fonte de verdade. Reflete o estado atual e correto de todas as policies, funções, triggers e colunas do projeto. Idempotente — seguro rodar de novo a qualquer momento, em qualquer ordem relativa a si mesmo.
- **`audit-sync.sql`** é uma consulta somente-leitura para auditar RLS/policies/funções/triggers reais no banco (não altera nada).
- **`archive/`** guarda as migrações incrementais que já foram aplicadas, por ordem histórica. Servem só de registro do que mudou e por quê — **não rode nada de lá**: um arquivo antigo sobrescrever um mais novo fora de ordem já causou bugs reais (`process_sale` perdendo `stock_deducted`).

Daqui pra frente, qualquer mudança de schema deve ser adicionada diretamente em `schema-current.sql` (mantendo-o idempotente), não como um novo arquivo solto.
