/**
 * Normaliza texto removiendo acentos, convirtiendo a minúsculas y limpiando espacios
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^\w\s]/g, '') // Remover caracteres especiales excepto espacios
    .replace(/\s+/g, ' ') // Normalizar espacios múltiples
    .trim();
}

/**
 * Verifica si un texto contiene alguna de las palabras clave (normalizado)
 */
export function containsKeywords(text: string, keywords: string[]): boolean {
  const normalizedText = normalizeText(text);
  return keywords.some(keyword => normalizedText.includes(normalizeText(keyword)));
}

/**
 * Busca coincidencias parciales en una lista de términos
 */
export function findPartialMatch(text: string, terms: string[]): string | null {
  const normalizedText = normalizeText(text);
  
  for (const term of terms) {
    const normalizedTerm = normalizeText(term);
    if (normalizedText.includes(normalizedTerm) || normalizedTerm.includes(normalizedText)) {
      return term;
    }
  }
  
  return null;
}
