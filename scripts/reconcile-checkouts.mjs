import { getServerClients } from '../server/clients.js';
import { reconcileCheckouts } from '../server/reconcile-checkouts.js';
// Não executado durante testes. Exige arquivo de ambiente escolhido pelo operador.
if (!process.argv.includes('--run')) throw new Error('Informe --run para reconciliar o ambiente configurado.');
if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') && !process.argv.includes('--allow-live')) {
  throw new Error('Chave de teste esperada. Produção exige revisão e autorização explícitas.');
}
let cursor = null;
const clients = getServerClients();
do {
  const page = await reconcileCheckouts(clients, cursor);
  for (const result of page.results) console.log(JSON.stringify(result));
  cursor = page.nextCursor;
} while (cursor);
