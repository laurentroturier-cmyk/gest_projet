export const formatCurrency = (value: string | number | undefined | null) => {
  if (value === null || value === undefined || value === "") return "0 €";
  const cleanValue = String(value).replace(/\s/g, '').replace(/,/g, '.');
  const num = parseFloat(cleanValue);
  if (isNaN(num)) return "0 €";
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(num);
};

export const getUniqueValues = (data: any[], key: string): string[] => {
  if (!Array.isArray(data)) return [];
  const values = data
    .map(item => item && item[key])
    .filter(v => v !== undefined && v !== null && v !== "");
  return Array.from(new Set(values)).sort();
};

export const formatDateFr = (value: any): string => {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toLocaleDateString('fr-FR');
    return String(value);
  } catch { return String(value); }
};

export const normalizeDateInput = (value: any): string => {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    return "";
  } catch { return ""; }
};
