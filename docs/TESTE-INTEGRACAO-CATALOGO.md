# Integração painel, estoque, fotos e vitrine — 03/10/2026

O teste usa as telas reais em Chromium e uma API Supabase sintética que persiste
produtos e estoque no PostgreSQL Docker local. Autenticação e Storage são
simulados dentro do navegador. Toda rede fora do servidor Vite e da API local é
bloqueada. Produção não recebe leituras nem escritas durante esta suíte.

Execute com Docker e o contêiner `camelia-roadmap-db` ativos:

```powershell
npm run test:catalog
```

Os 12 cenários cobrem:

1. cadastro pelo painel e persistência no PostgreSQL;
2. produto público sem custo ou notas internas;
3. recorte da capa, quatro uploads e galeria da página do produto;
4. preço atualizado automaticamente numa página aberta após 30 segundos;
5. coleção criada com a foto publicada e filtro da vitrine;
6. ocultação, acesso direto indisponível e republicação;
7. saída pelo PCP, log de estoque e bloqueio da compra esgotada;
8. conflito entre formulário antigo e saldo alterado em outra sessão;
9. botão de salvar bloqueado durante upload;
10. falha de gravação preservando formulário e dados publicados;
11. remoção de foto extra refletida na galeria;
12. página de produto em 390 × 844 sem rolagem horizontal.

Foram corrigidos dois problemas encontrados pelo teste:

- o formulário agora impede salvar enquanto uma foto está em processamento;
- edição usa o saldo original como condição. Se o PCP ou outra sessão alterou o
  estoque, a gravação é recusada com orientação para reabrir o produto, evitando
  restaurar silenciosamente um saldo antigo.

Arquivos gerados ficam em `test-results/catalog/`: relatório JSON e capturas do
painel e da tela móvel. A pasta é ignorada pelo Git.

Este teste prova a integração local entre componentes reais e PostgreSQL. Ainda
não comprova políticas e publicação Realtime instaladas em produção, permissões
reais do Storage, CDN/cache remoto, upload pela rede real nem experiência em
Safari/Firefox. Esses pontos pertencem à homologação antes da publicação.

## Resultado

Rodada 1: 12/12 cenários aprovados. Rodada 2: 12/12 cenários aprovados.

Nas duas rodadas, `npm run check` também aprovou 40/40 testes, ESLint,
TypeScript e build. Permanecem os avisos já conhecidos de bundle principal acima
de 500 kB e base Browserslist desatualizada.
