import type { ConditionCode } from '@/types/weather'

export interface WeatherVisual {
  /** Tailwind gradient classes for the scene background. */
  gradientClass: string
  /** Short emoji-free label used in aria attributes. */
  label: string
}

const DAY_GRADIENTS: Record<ConditionCode, string> = {
  clear: 'from-sky-400 via-sky-300 to-amber-100',
  'partly-cloudy': 'from-sky-500 via-sky-300 to-slate-200',
  cloudy: 'from-slate-400 via-slate-300 to-slate-200',
  fog: 'from-slate-300 via-slate-200 to-slate-100',
  drizzle: 'from-slate-500 via-slate-400 to-slate-300',
  rain: 'from-slate-600 via-slate-500 to-slate-400',
  'heavy-rain': 'from-slate-700 via-slate-600 to-slate-500',
  thunderstorm: 'from-slate-800 via-slate-700 to-indigo-700',
  snow: 'from-slate-300 via-sky-100 to-white',
  sleet: 'from-slate-400 via-sky-200 to-slate-200',
  windy: 'from-teal-400 via-sky-300 to-slate-100',
}

const NIGHT_GRADIENTS: Record<ConditionCode, string> = {
  clear: 'from-indigo-950 via-indigo-900 to-slate-800',
  'partly-cloudy': 'from-slate-900 via-indigo-950 to-slate-800',
  cloudy: 'from-slate-900 via-slate-800 to-slate-700',
  fog: 'from-slate-800 via-slate-700 to-slate-600',
  drizzle: 'from-slate-900 via-slate-800 to-slate-700',
  rain: 'from-slate-950 via-slate-900 to-slate-800',
  'heavy-rain': 'from-black via-slate-900 to-slate-800',
  thunderstorm: 'from-black via-slate-950 to-indigo-950',
  snow: 'from-slate-800 via-indigo-950 to-slate-700',
  sleet: 'from-slate-900 via-slate-800 to-slate-700',
  windy: 'from-slate-900 via-teal-950 to-slate-800',
}

const LABELS: Record<ConditionCode, string> = {
  clear: 'Clear',
  'partly-cloudy': 'Partly cloudy',
  cloudy: 'Cloudy',
  fog: 'Foggy',
  drizzle: 'Drizzle',
  rain: 'Rain',
  'heavy-rain': 'Heavy rain',
  thunderstorm: 'Thunderstorm',
  snow: 'Snow',
  sleet: 'Sleet',
  windy: 'Windy',
}

export function useWeatherVisuals() {
  function visualFor(code: ConditionCode, isDay: boolean): WeatherVisual {
    const gradientClass = (isDay ? DAY_GRADIENTS : NIGHT_GRADIENTS)[code]
    return { gradientClass, label: LABELS[code] }
  }

  return { visualFor, LABELS }
}
