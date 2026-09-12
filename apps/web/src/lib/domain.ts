/**
 * Multi-tenant domain and subdomain resolution utilities.
 */

export const RESERVED_SUBDOMAINS = new Set([
  'www',
  'api',
  'admin',
  'auth',
  'app',
  'localhost',
  '127.0.0.1',
  'preview',
  'staging',
  'mail',
  'smtp',
  'ftp',
  'status',
  'docs',
  'support',
  'help',
]);

const KNOWN_HOSTING_PLATFORM_SUFFIXES = [
  'vercel.app',
  'now.sh',
  'pages.dev',
  'netlify.app',
  'onrender.com',
  'railway.app',
  'fly.dev',
];

const KNOWN_TWO_PART_TLDS = new Set([
  'co.uk',
  'org.uk',
  'me.uk',
  'ltd.uk',
  'plc.uk',
  'net.uk',
  'sch.uk',
  'ac.uk',
  'gov.uk',
  'com.au',
  'net.au',
  'org.au',
  'edu.au',
  'gov.au',
  'co.nz',
  'net.nz',
  'org.nz',
  'govt.nz',
  'com.br',
  'net.br',
  'org.br',
  'com.mx',
  'org.mx',
  'edu.mx',
  'com.sg',
  'edu.sg',
  'gov.sg',
  'co.za',
  'org.za',
  'com.eg',
  'com.tr',
  'co.jp',
  'ne.jp',
  'or.jp',
  'co.kr',
  'ne.kr',
  're.kr',
]);

export interface ParsedTenantDomain {
  subdomain: string | null;
  rootDomain: string;
}

/**
 * Extracts the tenant subdomain and root domain from a hostname.
 *
 * Examples:
 * - "mystocky.vercel.app" -> { subdomain: null, rootDomain: "mystocky.vercel.app" }
 * - "circlek.mystocky.vercel.app" -> { subdomain: "circlek", rootDomain: "mystocky.vercel.app" }
 * - "localhost" -> { subdomain: null, rootDomain: "localhost" }
 * - "circlek.localhost" -> { subdomain: "circlek", rootDomain: "localhost" }
 * - "stocky.app" -> { subdomain: null, rootDomain: "stocky.app" }
 * - "circlek.stocky.app" -> { subdomain: "circlek", rootDomain: "stocky.app" }
 * - "www.stocky.app" -> { subdomain: null, rootDomain: "stocky.app" }
 */
export function parseTenantDomain(
  rawHostname: string,
  configuredRootDomain?: string
): ParsedTenantDomain {
  const hostWithoutPort = (rawHostname || '').split(':')[0].toLowerCase().trim();

  if (!hostWithoutPort) {
    return { subdomain: null, rootDomain: '' };
  }

  // 1. IP addresses (IPv4 & IPv6 localhost) have no subdomains
  const isIp =
    /^(\d{1,3}\.){3}\d{1,3}$/.test(hostWithoutPort) ||
    hostWithoutPort === '::1' ||
    hostWithoutPort.startsWith('[');
  if (isIp) {
    return { subdomain: null, rootDomain: hostWithoutPort };
  }

  // 2. If an explicit root domain is configured (e.g. via NEXT_PUBLIC_ROOT_DOMAIN)
  const envRoot = (
    configuredRootDomain ||
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
    process.env.NEXT_PUBLIC_APP_DOMAIN ||
    ''
  )
    .replace(/^https?:\/\//, '')
    .split(':')[0]
    .toLowerCase()
    .trim();

  if (envRoot && (hostWithoutPort === envRoot || hostWithoutPort.endsWith(`.${envRoot}`))) {
    if (hostWithoutPort === envRoot) {
      return { subdomain: null, rootDomain: envRoot };
    }
    const prefix = hostWithoutPort.slice(0, -(envRoot.length + 1));
    const sub = prefix.split('.')[0];
    if (sub && !RESERVED_SUBDOMAINS.has(sub)) {
      return { subdomain: sub, rootDomain: envRoot };
    }
    return { subdomain: null, rootDomain: envRoot };
  }

  // 3. Localhost environments
  if (hostWithoutPort === 'localhost') {
    return { subdomain: null, rootDomain: 'localhost' };
  }
  if (hostWithoutPort.endsWith('.localhost')) {
    const parts = hostWithoutPort.split('.');
    // circlek.localhost -> parts: ['circlek', 'localhost']
    const sub = parts[0];
    if (sub && !RESERVED_SUBDOMAINS.has(sub)) {
      return { subdomain: sub, rootDomain: 'localhost' };
    }
    return { subdomain: null, rootDomain: 'localhost' };
  }

  // 4. Known cloud hosting platform domains (e.g. *.vercel.app, *.pages.dev)
  // For these platforms, `<project>.<platform>.<tld>` (3 parts) is the root application domain.
  for (const suffix of KNOWN_HOSTING_PLATFORM_SUFFIXES) {
    if (hostWithoutPort === suffix || hostWithoutPort.endsWith(`.${suffix}`)) {
      const parts = hostWithoutPort.split('.');
      // e.g. mystocky.vercel.app -> parts.length === 3 -> root domain is mystocky.vercel.app
      if (parts.length <= 3) {
        return { subdomain: null, rootDomain: hostWithoutPort };
      }
      // e.g. circlek.mystocky.vercel.app -> parts.length === 4 -> subdomain is circlek
      const sub = parts[0];
      const rootDomain = parts.slice(1).join('.');
      if (sub && !RESERVED_SUBDOMAINS.has(sub)) {
        return { subdomain: sub, rootDomain };
      }
      return { subdomain: null, rootDomain };
    }
  }

  // 5. Standard custom domains (e.g. stocky.app, stocky.co.uk)
  const parts = hostWithoutPort.split('.');

  // Check if ending matches a two-part TLD (e.g. .co.uk)
  const lastTwoParts = parts.slice(-2).join('.');
  const isTwoPartTld = KNOWN_TWO_PART_TLDS.has(lastTwoParts);

  const baseDomainPartsCount = isTwoPartTld ? 3 : 2;

  if (parts.length <= baseDomainPartsCount) {
    return { subdomain: null, rootDomain: hostWithoutPort };
  }

  const sub = parts[0];
  const rootDomain = parts.slice(1).join('.');

  if (sub && !RESERVED_SUBDOMAINS.has(sub)) {
    return { subdomain: sub, rootDomain };
  }

  return { subdomain: null, rootDomain };
}
