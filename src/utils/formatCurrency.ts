/**
 * FORMATAÇÃO MONETÁRIA - CAMÉLIA (MISSION CRITICAL)
 * 
 * PILLAR 1: TypeScript
 */
export const formatCurrency = (value: number | string | null | undefined): string => {
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;

  if (numericValue === null || numericValue === undefined || isNaN(numericValue)) {
    return 'R$ 0,00';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericValue);
};
