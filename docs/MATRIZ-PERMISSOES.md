# Matriz de permissões — alvo da fase P0

Esta é a especificação para a próxima migração, não a descrição das permissões
já aplicadas. Mudanças no banco devem ser testadas antes em homologação.

| Recurso/ação | Visitante | Cliente | Nível 1 | Nível 2 | Nível 3 | Nível 4 |
| --- | --- | --- | --- | --- | --- | --- |
| Catálogo publicado, tarifas de frete | Ler | Ler | Ler | Ler | Ler | Ler |
| Perfil e pedidos pessoais | Sem acesso por e-mail digitado | Próprios, vínculo verificado | Próprios | Próprios | Próprios | Próprios |
| Clientes e pedidos operacionais | Não | Não | Ler campos permitidos | Ler/operar | Ler/operar | Ler/operar |
| Cadastro de produtos e estoque | Não | Não | Leitura operacional | Operar por funções validadas | Operar | Operar |
| Venda manual | Não | Não | Não | Criar/concluir por função validada | Sim | Sim |
| Cancelamento e solicitação de reembolso | Não | Solicitar atendimento | Não | Solicitar à gestão | Executar fluxo auditável | Executar fluxo auditável |
| Custos, margens e financeiro | Não | Não | Não | Não | Ler/operar | Ler/operar |
| Fornecedores | Não | Não | Não | Campos operacionais | Completo | Completo |
| Tarifas de entrega | Ler | Ler | Ler | Configurar | Configurar | Configurar |
| Usuários e permissões | Não | Não | Próprio acesso | Próprio acesso | Próprio acesso | Gerenciar |
| Exclusão permanente de registros comerciais | Não | Não | Não | Não | Não | Somente operação atômica e auditável |
| Upload de imagem de produto | Não | Não | Não | Sim | Sim | Sim |

## Regras de implementação

- Impedir acesso também por API direta/RPC, não apenas escondendo botões.
- Permissão por linha não protege colunas internas. Separar projeções públicas,
  próprias e operacionais; restringir acesso às tabelas base conforme a função.
- Custos calculados pelo servidor não precisam chegar ao navegador do vendedor.
- Cliente precisa de vínculo estável com auth.users; migrar e-mails existentes
  com relatório de conflitos, sem vincular registros ambíguos automaticamente.
- Compra visitante mantém contato no pedido e não sobrescreve perfil existente.
  Associação posterior exige comprovação de identidade e fluxo específico.
- Evitar autoexclusão/rebaixamento do último administrador ativo.
- Revogação de acesso deve impedir consultas e escritas novas; limpar cache privado.
- Testar visitante, clientes A/B e níveis 1–4, inclusive acesso direto a campos
  internos, funções privilegiadas, Storage e eventos Realtime.

## Situação desta entrega

API de checkout valida token quando fornecido, exige e-mail confirmado e não
reutiliza cartões/Stripe Customer. Para usuários autenticados, o vínculo com CRM
por e-mail verificado permanece transitório até a migração de auth_user_id.
O banco de produção ainda não recebeu a matriz acima.
