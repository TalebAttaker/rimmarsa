// Mauritania IP ranges (CIDR notation)
// Source: Regional Internet Registries (RIRs) - AFRINIC
const MAURITANIA_IP_RANGES = [
  '41.138.128.0/17',    // Mauritel
  '41.202.192.0/18',    // Chinguitel
  '41.221.128.0/17',    // Mattel
  '196.200.96.0/19',    // Various ISPs
  '154.73.0.0/16',      // Additional Mauritania ranges
  '41.188.128.0/17',    // More ISP ranges
  // Add more ranges as needed - consult AFRINIC database
]

// Convert CIDR to IP range for checking
function cidrToRange(cidr: string): { start: number; end: number } {
  const [ip, bits] = cidr.split('/')
  const mask = ~(2 ** (32 - parseInt(bits)) - 1)
  const ipNum = ipToNumber(ip)
  return {
    start: ipNum & mask,
    end: ipNum | ~mask,
  }
}

function ipToNumber(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0
}

export function isIpInMauritania(ip: string): boolean {
  // SECURITY FIX (VULN-006): Explicit localhost allowance with separate flag
  // Only allow localhost when BOTH conditions are true:
  // 1. NODE_ENV === 'development'
  // 2. ALLOW_LOCALHOST === 'true' (explicit opt-in)
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.ALLOW_LOCALHOST === 'true'
  ) {
    if (
      ip === 'unknown' ||
      ip.startsWith('127.') ||
      ip.startsWith('192.168.') ||
      ip.startsWith('10.') ||
      ip.startsWith('172.16.')
    ) {
      return true
    }
  }

  // Allow whitelisted IPs (for testing, VPN, etc.)
  // Use IP_WHITELIST_TEST for development/testing
  // Use IP_WHITELIST for production exceptions (requires documentation)
  const whitelist = (
    process.env.NODE_ENV === 'production'
      ? process.env.IP_WHITELIST
      : process.env.IP_WHITELIST_TEST
  )?.split(',') || []

  if (whitelist.includes(ip)) {
    return true
  }

  const ipNum = ipToNumber(ip)

  return MAURITANIA_IP_RANGES.some((cidr) => {
    const { start, end } = cidrToRange(cidr)
    return ipNum >= start && ipNum <= end
  })
}

// Alternative: Use Vercel geolocation header (more accurate and easier)
export function isCountryMauritania(country: string | null): boolean {
  // SECURITY FIX (VULN-006): NEVER bypass geo-fence based on NODE_ENV alone!
  // Only allow specific countries via explicit whitelist

  // Check for explicit country whitelist (for testing/VPN scenarios)
  const allowedCountries = process.env.GEO_WHITELIST?.split(',') || []
  if (allowedCountries.includes(country || '')) {
    return true
  }

  // Vercel provides 'x-vercel-ip-country' header
  // MR = Mauritania (ISO 3166-1 alpha-2 code)
  // Allow MR OR if country is null (local development)
  if (country === null && process.env.NODE_ENV === 'development' && process.env.ALLOW_LOCALHOST === 'true') {
    // Only in development with explicit flag
    return true
  }

  return country === 'MR'
}
