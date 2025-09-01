import type { TokenSummary, SidebarItem, SafetyScore, TokenSpec, VolumeData, HoldersData } from "./types"

export const mockTokens: SidebarItem[] = [
  {
    address: "0xa0b7...34456b",
    symbol: "TRUMP",
    price: 0.1463,
    pct1h: -1.76,
    pct24h: -1.76,
    vol24h: 125000,
    logoUrl: "/placeholder-wik7w.png",
    tags: ["DEV", "CA"],
  },
  {
    address: "0xb1c8...45567c",
    symbol: "PEPE",
    price: 0.0000234,
    pct1h: 2.34,
    pct24h: 5.67,
    vol24h: 890000,
    logoUrl: "/placeholder-jf1dj.png",
    tags: ["MEME"],
  },
  {
    address: "0xc2d9...56678d",
    symbol: "DOGE",
    price: 0.087,
    pct1h: -0.45,
    pct24h: 1.23,
    vol24h: 2300000,
    logoUrl: "/dogecoin.png",
    tags: ["MEME", "OG"],
  },
  {
    address: "0xd3ea...67789e",
    symbol: "SHIB",
    price: 0.0000089,
    pct1h: 1.89,
    pct24h: -2.45,
    vol24h: 1250000,
    logoUrl: "/placeholder-gyzvh.png",
    tags: ["MEME"],
  },
  {
    address: "0xe4fb...78890f",
    symbol: "BONK",
    price: 0.0000156,
    pct1h: 3.21,
    pct24h: 7.89,
    vol24h: 567000,
    logoUrl: "/bonk-token.png",
    tags: ["SOL", "MEME"],
  },
]

export const mockSelectedToken: TokenSummary = {
  id: "eagle-sol",
  name: "Eagle",
  symbol: "EGL",
  logoUrl: "/eagle-token.png",
  network: "SOL",
  priceUsd: 0.0056676,
  change24hPct: -2.13,
  mcUsd: 5686000,
  liqUsd: 92800,
  vol24hUsd: 9359378,
  fees24h: "0.14 SOL",
  dex: "Raydium",
  pairTitle: "Eagle/SOL on Raydium",
  candleOHLC: Array.from({ length: 100 }, (_, i) => ({
    time: Date.now() - (100 - i) * 60000,
    open: 0.005 + Math.random() * 0.002,
    high: 0.005 + Math.random() * 0.003,
    low: 0.004 + Math.random() * 0.001,
    close: 0.005 + Math.random() * 0.002,
    volume: Math.random() * 1000000,
  })),
}

export const mockVolumeData: VolumeData[] = Array.from({ length: 15 }, (_, i) => ({
  date: new Date(Date.now() - (14 - i) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  value: Math.random() * 5000000 + 1000000,
}))

export const mockHoldersData: HoldersData[] = [
  { day: "21", holders: 298000 },
  { day: "22", holders: 312000 },
  { day: "23", holders: 325000 },
  { day: "24", holders: 332000 },
  { day: "25", holders: 345000 },
]

export const mockHoldersChangeData: VolumeData[] = Array.from({ length: 5 }, (_, i) => ({
  date: `Day ${i + 21}`,
  value: Math.random() * 20000 + 5000,
}))

export const mockSafetyScore: SafetyScore = {
  score: 99,
  verified: true,
  renounced: true,
  honeypot: false,
  buyTaxPct: 0,
  sellTaxPct: 0,
  bullets: [99, 99, 99, 99],
}

export const mockTokenSpecs: TokenSpec[] = [
  { label: "Pair created", value: "08/05/2021 07:05" },
  { label: "Pooled BASE", value: "1,583,913  ($485,492)" },
  { label: "Pooled WETH", value: "158.3  ($689,751)" },
  { label: "BASE", valueShort: "0xa0b7...34456b", copyValue: "0xa0b734456b", type: "address" },
  { label: "WETH", valueShort: "0xc02a...756cc2", copyValue: "0xc02a756cc2", type: "address" },
  { label: "Pair", valueShort: "0x87b1...eccf12", copyValue: "0x87b1eccf12", type: "address" },
]
