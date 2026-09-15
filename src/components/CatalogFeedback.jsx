export default function CatalogFeedback({ error }) {
  if (!error) return null;
  return <p role="alert" className="m-4 rounded-xl bg-amber-50 p-4 text-center text-sm text-amber-900">Não foi possível atualizar o catálogo. Verifique sua conexão; tentaremos novamente automaticamente.</p>;
}
