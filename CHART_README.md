# Price Chart Implementation

This document describes the real-time price chart implementation that replaces the placeholder chart on the token detail page.

## Overview

The price chart system consists of two main components:
- **Server API Endpoint**: `/api/price-data` - Fetches and normalizes price data
- **Client Component**: `PriceChart` - Renders interactive charts with timeframe controls

## Architecture

### Server Endpoint (`/app/api/price-data/route.ts`)

**Endpoint**: `GET /api/price-data`

**Query Parameters**:
- `address` (string): Token address or symbol (e.g., "ethereum", "solana")
- `timeframe` (string): Time period ("1m", "5m", "15m", "1h", "4h", "1d", "1w")
- `chain` (string): Blockchain network (currently supports "ethereum")

**Response Format**:
```typescript
interface NormalizedResponse {
  success: boolean
  data: CandleData[]
  hasOHLC: boolean
  fallbackReason?: string
  symbol: string
  lastUpdate: number
  error?: string
}
```

**Data Sources**:
1. **Primary**: CryptoCompare API (free tier, no API key required) - Provides real OHLC data with volumes
2. **Secondary**: CoinGecko API (free tier) - Fallback for price-only data  
3. **Fallback**: Enhanced mock data generator with realistic patterns when APIs are unavailable

**Caching**: 30-second in-memory cache to avoid rate limits and improve performance.

### Client Component (`/components/price-chart.tsx`)

**Features**:
- **Professional candlestick charts** using TradingView's lightweight-charts library
- **Automatic chart type selection**: Candlesticks for OHLC data, line charts for price-only data
- **Volume indicators** at the bottom of candlestick charts
- Interactive crosshair with precise price readings
- Timeframe switching (1M to 1W)
- Auto-refresh every 30 seconds
- Dark theme styling matching the app
- Loading, error, and empty state handling
- Responsive design for mobile and desktop
- Zoom and pan functionality on candlestick charts

**Props**:
```typescript
interface PriceChartProps {
  tokenAddress: string      // Token to display
  chain?: string           // Blockchain (default: "ethereum")
  initialTimeframe?: string // Starting timeframe (default: "1d")
  className?: string       // Additional CSS classes
  autoRefresh?: boolean    // Enable auto-refresh (default: true)
  refreshInterval?: number // Refresh interval in ms (default: 30000)
}
```

## Integration

### CandleChart Component

The existing `CandleChart` component has been updated to use the new `PriceChart`:

```tsx
<CandleChart 
  data={selectedToken.candleOHLC} 
  timeframe={timeframe}
  tokenAddress={selectedToken.symbol.toLowerCase()}
  tokenSymbol={selectedToken.symbol}
/>
```

### Token Address Mapping

The system maps common token symbols to CoinGecko IDs:
- ethereum → ethereum
- bitcoin → bitcoin  
- solana → solana
- etc.

For unmapped tokens, the system uses the symbol directly and falls back to mock data if not found.

## Fallback Behavior

When real data is unavailable, the system:
1. Shows a notice: "OHLC data not available, showing price line"
2. Generates realistic mock data with:
   - Appropriate base prices for known tokens
   - Simulated volatility (±2%)
   - Token-specific trend patterns
   - Realistic volume data

## Error Handling

The component gracefully handles:
- **Network errors**: Shows retry button with error message
- **API rate limits**: Uses cached data when available
- **Invalid responses**: Falls back to mock data
- **Empty data**: Shows "No data available" message

## Styling

The chart uses a dark theme that matches the application:
- Background: Card background with dark borders
- Chart colors: Yellow accent (#EAB308) for lines and highlights
- Text: Light gray for labels, white for values
- Hover states: Dark tooltips with yellow accents

## Performance

- **Bundle size**: Uses existing Recharts library (~60KB gzipped)
- **Caching**: Server-side 30s cache reduces API calls
- **Loading**: Skeleton loading states prevent layout shift
- **Memory**: Limited cache size prevents memory leaks

## Testing

### Manual Testing Checklist

- [ ] Chart loads within 1-2 seconds on warm cache
- [ ] Timeframe switching works smoothly without layout shift
- [ ] Auto-refresh updates data every 30 seconds
- [ ] Error states show retry button and clear messages
- [ ] Mobile and desktop both display correctly
- [ ] Dark theme styling matches the rest of the app
- [ ] Tooltips show correct price and timestamp data

### API Testing

Test the endpoint directly:
```bash
curl "http://localhost:3000/api/price-data?address=ethereum&timeframe=1d&chain=ethereum"
```

## Provider Configuration

### Data Provider Hierarchy

The system tries providers in this order:
1. **CryptoCompare** - Primary provider with OHLC + volume data
2. **CoinGecko** - Secondary provider for price-only data  
3. **Enhanced Mock Data** - Realistic fallback when APIs fail

To switch primary providers:

1. Update the `fetchPriceData` function in `/app/api/price-data/route.ts`
2. Modify the URL and response parsing logic
3. Update the symbol mapping functions (`getCryptoCompareSymbol`, `getCoinGeckoId`)
4. Test with the new provider's rate limits and data format

### Adding API Keys

For production use with higher rate limits:

1. Add environment variable: `COINGECKO_API_KEY`
2. Update fetch headers in the API route:
   ```typescript
   headers: {
     'x-cg-demo-api-key': process.env.COINGECKO_API_KEY
   }
   ```

## Troubleshooting

### Common Issues

1. **401 Errors**: CoinGecko rate limiting - the fallback mock data will be used
2. **Slow Loading**: Check network connectivity and API response times
3. **Chart Not Updating**: Verify auto-refresh is enabled and not paused by errors
4. **Wrong Data**: Check token address mapping in `TOKEN_ADDRESSES`

### Debug Mode

Add `?debug=true` to see additional logging:
- API response times
- Cache hit/miss ratios  
- Fallback reasons
- Data normalization steps

## Future Improvements

1. **WebSocket Integration**: Real-time price updates instead of polling
2. **Multiple Exchanges**: Aggregate data from multiple sources
3. **Advanced Charts**: Candlestick charts when OHLC data is available
4. **Technical Indicators**: Moving averages, RSI, volume indicators
5. **Database Caching**: Persistent cache for better performance
6. **Compression**: Gzip API responses for faster loading