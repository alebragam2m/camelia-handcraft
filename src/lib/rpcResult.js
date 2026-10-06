export function requireRpcSuccess(data, error, fallback = 'Não foi possível concluir a operação.') {
  if (error || data?.success !== true) throw new Error(error?.message || data?.error || fallback);
  return data;
}
