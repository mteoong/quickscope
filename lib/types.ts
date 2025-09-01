export interface TokenSummary {
  id: string
  name: string
  symbol: string
  logoUrl: string
  network: string
  priceUsd: number
  change24hPct: number
  mcUsd: number
  liqUsd: number
  vol24hUsd: number
  fees24h: string
  dex: string
  pairTitle: string
  candleOHLC: CandleData[]
}

export interface SidebarItem {
  address: string
  symbol: string
  price: number
  pct1h: number
  pct24h: number
  vol24h: number
  logoUrl: string
  tags: string[]
}

export interface CandleData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface SafetyScore {
  score: number
  verified: boolean
  renounced: boolean
  honeypot: boolean
  buyTaxPct: number
  sellTaxPct: number
  bullets: number[]
}

export interface TokenSecurity {
  honeypot: boolean
  buyTax: number
  sellTax: number
  blacklist: boolean
  noMint: boolean
  canBurn: boolean
  isProxy: boolean
  hasRenounced: boolean
}

export interface TokenSocials {
  website?: string
  twitter?: string
  telegram?: string
  discord?: string
  github?: string
}

export interface PoolData {
  pairAddress: string
  pairCreated: string
  baseToken: {
    address: string
    name: string
    symbol: string
    amount: string
  }
  quoteToken: {
    address: string
    name: string
    symbol: string
    amount: string
  }
  liquidity: number
}

export interface PriceChanges {
  change5m: number
  change1h: number
  change6h: number
  change24h: number
}

export interface TokenData {
  // Basic info
  address: string
  name: string
  symbol: string
  image?: string
  description?: string
  
  // Price & Market data
  price: number
  marketCap?: number
  liquidity?: number
  volume24h?: number
  priceChanges: PriceChanges
  
  // Supply info
  totalSupply?: number
  circulatingSupply?: number
  
  // Additional token info
  holderCount?: number
  creator?: string
  pairCreated?: string
  
  // Holders data
  holders?: TokenHolder[]
  
  // Security data
  security: TokenSecurity
  
  // Social links
  socials: TokenSocials
  
  // Pool information
  pools: PoolData[]
  
  // Network
  network: string
  
  // Metadata
  fetchedAt: number
  isLoading?: boolean
  error?: string
}

export interface TokenHolder {
  rank: number
  address: string
  percentage: number
  amount: string
  uiAmount: number
  value: number
  rawAmount: string
}

export interface TokenSpec {
  label: string
  value?: string
  valueShort?: string
  copyValue?: string
  type?: "address" | "text"
}

export interface VolumeData {
  date: string
  value: number
}

export interface HoldersData {
  day: string
  holders: number
}

export interface TraderData {
  rank: number
  trader: string
  bought: string
  boughtTokens: string
  boughtTx: string
  sold: string
  soldTokens: string
  soldTx: string
  pnl: string
  pnlPercent: string
  balance: string
}
