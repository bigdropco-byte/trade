/**
 * TradeScrapbook Privacy Utilities
 * Provides masking, obfuscation, and alias management for account numbers,
 * trader names, and broker identities across the application.
 */

/**
 * Masks an account number for secure display, streaming, and screenshot sharing.
 * Examples:
 *   "94827105" -> "••••7105"
 *   "1234"     -> "••••1234"
 *   "12"       -> "••••••••"
 */
export function maskAccountNumber(
  account: string | undefined | null,
  isMasked: boolean = true
): string {
  if (!account) return isMasked ? '••••••••' : 'Sample Portfolio';
  if (!isMasked) return String(account);

  const clean = String(account).trim();
  if (clean.length <= 3) return '••••••••';
  // Show only last 4 digits
  const lastFour = clean.slice(-4);
  return `••••${lastFour}`;
}

/**
 * Masks a trader's personal name for privacy.
 * Examples:
 *   "Marcus Sterling" -> "Marcus S."
 *   "Johnathan Doe"   -> "Johnathan D."
 */
export function maskTraderName(
  name: string | undefined | null,
  isMasked: boolean = true
): string {
  if (!name) return 'Verified Trader';
  if (!isMasked) return name;

  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length > 1) {
    return `${parts[0]} ${parts[1][0]}.`;
  }
  return trimmed;
}

/**
 * Obfuscates broker / server identity if privacy mode is engaged.
 */
export function maskBroker(
  broker: string | undefined | null,
  isMasked: boolean = true
): string {
  if (!broker) return 'Regulated Broker';
  if (!isMasked) return broker;
  return 'Regulated Broker';
}
