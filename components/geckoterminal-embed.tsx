"use client"

interface GeckoTerminalEmbedProps {
  address: string
  addressType?: 'token' | 'pool'
  network?: string
  theme?: 'light' | 'dark'
  className?: string
  // Legacy prop for backward compatibility
  poolAddress?: string
}

export function GeckoTerminalEmbed({ 
  address,
  addressType = 'pool',
  network = 'solana',
  theme = 'dark',
  className = '',
  poolAddress // Legacy support
}: GeckoTerminalEmbedProps) {
  // Use legacy poolAddress if provided, otherwise use address
  const finalAddress = poolAddress || address
  const finalType = poolAddress ? 'pool' : addressType
  
  // Detect network from address if not provided
  const detectNetwork = (addr: string) => {
    if (addr.startsWith('0x') && addr.length === 42) {
      return 'eth' // Ethereum
    }
    return network // Default to provided network (usually 'solana')
  }
  
  const finalNetwork = detectNetwork(finalAddress)
  const endpoint = finalType === 'token' ? 'tokens' : 'pools'
  
  const embedUrl = `https://www.geckoterminal.com/${finalNetwork}/${endpoint}/${finalAddress}?embed=1&info=0&swaps=0&grayscale=0&light_chart=${theme === 'light' ? '1' : '0'}&volume=0&header=0&branding=0&watermark=0&logo=0&attribution=0&powered_by=0&utm_source=&utm_medium=&utm_campaign=`

  return (
    <div className={`w-full h-full ${className}`}>
      <iframe
        src={embedUrl}
        width="100%"
        height="100%"
        style={{ 
          border: 0, 
          borderRadius: '8px',
          backgroundColor: '#131820'
        }}
        allow="clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        title="Price Chart"
      />
    </div>
  )
}