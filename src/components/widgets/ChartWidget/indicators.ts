/**
 * Pure technical indicator computation functions.
 * Each takes close prices array and returns values aligned with input length.
 * null = insufficient data for that index.
 */

export function computeSMA(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null)
  if (closes.length < period) return result

  let sum = 0
  for (let i = 0; i < period; i++) sum += closes[i]
  result[period - 1] = sum / period

  for (let i = period; i < closes.length; i++) {
    sum += closes[i] - closes[i - period]
    result[i] = sum / period
  }
  return result
}

export function computeEMA(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null)
  if (closes.length < period) return result

  // Seed with SMA
  let sum = 0
  for (let i = 0; i < period; i++) sum += closes[i]
  let ema = sum / period
  result[period - 1] = ema

  const k = 2 / (period + 1)
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k)
    result[i] = ema
  }
  return result
}

export interface BollingerBandsResult {
  upper: (number | null)[]
  middle: (number | null)[]
  lower: (number | null)[]
}

export function computeBollingerBands(
  closes: number[],
  period: number,
  stdDev: number,
): BollingerBandsResult {
  const len = closes.length
  const upper: (number | null)[] = new Array(len).fill(null)
  const middle: (number | null)[] = new Array(len).fill(null)
  const lower: (number | null)[] = new Array(len).fill(null)
  if (len < period) return { upper, middle, lower }

  for (let i = period - 1; i < len; i++) {
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += closes[j]
    const mean = sum / period

    let sqSum = 0
    for (let j = i - period + 1; j <= i; j++) {
      const diff = closes[j] - mean
      sqSum += diff * diff
    }
    const sd = Math.sqrt(sqSum / period)

    middle[i] = mean
    upper[i] = mean + stdDev * sd
    lower[i] = mean - stdDev * sd
  }

  return { upper, middle, lower }
}

export function computeRSI(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null)
  if (closes.length < period + 1) return result

  // Initial avg gain/loss
  let avgGain = 0
  let avgLoss = 0
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1]
    if (change > 0) avgGain += change
    else avgLoss -= change
  }
  avgGain /= period
  avgLoss /= period

  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)

  // Wilder's smoothing
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1]
    const gain = change > 0 ? change : 0
    const loss = change < 0 ? -change : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }
  return result
}

export interface MACDResult {
  macd: (number | null)[]
  signal: (number | null)[]
  histogram: (number | null)[]
}

export function computeMACD(
  closes: number[],
  fast: number,
  slow: number,
  signalPeriod: number,
): MACDResult {
  const len = closes.length
  const macd: (number | null)[] = new Array(len).fill(null)
  const signal: (number | null)[] = new Array(len).fill(null)
  const histogram: (number | null)[] = new Array(len).fill(null)

  const emaFast = computeEMA(closes, fast)
  const emaSlow = computeEMA(closes, slow)

  // MACD line = fast EMA - slow EMA
  const macdValues: number[] = []
  const macdStartIdx = slow - 1 // first index where both EMAs exist
  for (let i = 0; i < len; i++) {
    const f = emaFast[i]
    const s = emaSlow[i]
    if (f !== null && s !== null) {
      const val = f - s
      macd[i] = val
      macdValues.push(val)
    }
  }

  // Signal line = EMA of MACD values
  if (macdValues.length >= signalPeriod) {
    const signalEma = computeEMA(macdValues, signalPeriod)
    let j = 0
    for (let i = macdStartIdx; i < len; i++) {
      if (macd[i] !== null) {
        signal[i] = signalEma[j]
        if (signalEma[j] !== null) {
          histogram[i] = macd[i]! - signalEma[j]!
        }
        j++
      }
    }
  }

  return { macd, signal, histogram }
}
