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
  // Allow localhost/private IPs in development
  if (process.env.NODE_ENV === 'development') {
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
  const whitelist = process.env.IP_WHITELIST?.split(',') || []
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
  // Allow in development
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  // Vercel provides 'x-vercel-ip-country' header
  // MR = Mauritania (ISO 3166-1 alpha-2 code)
  return country === 'MR'
}
