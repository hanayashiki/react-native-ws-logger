export function plural(n: number, word: string, pluralForm?: string) {
  return n > 1 ? (pluralForm ? pluralForm : word + 's') : word;
}
