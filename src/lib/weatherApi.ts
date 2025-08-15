//yesma chai helper functions haru cha jasle weather data fetch garxa from openweathermap


 const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;




// const API_KEY='af9dc50369732b627c28f98ad9f15d60'

// API bata aaune data ko structure
//geographic coordinate data ko type, structure
export type Coords = {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
};

//City name-> Coordinates convert hunxa
//geocodeCity function ley ki ta coordinates dinxa ki null
export async function geocodeCity(name: string): Promise<Coords | null> {
//if tyo name ko city xaina bhane null ra error throw garndine

    if (!name.trim()) return null;

  const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(name)}&limit=1&appid=${API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to search location');

  //response aauxa coordinates
  const data = await res.json() as Array<{
    name: string;
    country: string;
    lat: number;
    lon: number;
  }>;

  //first data liney
  const first = data[0];
  return first ? {
    name: first.name,
    country: first.country,
    latitude: first.lat,
    longitude: first.lon,
  } : null;
};

// Function: Reverse geocode coordinates , get city from coordinates
export async function reverseGeocode(lat: number, lon: number): Promise<{name: string, country: string} | null> {
  const url = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json() as Array<{
    name: string;
    country: string;
  }>;
  const first = data[0];
  if (!first) return null;
  return {name: first.name || 'Your Location', country: first.country || ''};
}

// Type for Current Weather data from OpenWeatherMap
export type CurrentWeather = {
  coord: { lon: number; lat: number };
  weather: Array<{ id: number; main: string; description: string; icon: string }>;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: { speed: number; deg: number; gust?: number };
  rain?: { '1h': number };
  clouds: { all: number };
  dt: number;
  sys: { country: string; sunrise: number; sunset: number };
  timezone: number;
  name: string;
};

// Fetch current weather for given lat/lon using Current Weather API
export async function getCurrentWeather(lat: number, lon: number): Promise<CurrentWeather> {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch current weather');

  return await res.json() as CurrentWeather;
};

// Type for 5-Day/3-Hour Forecast data 
export type ForecastWeather = {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      pressure: number;
      humidity: number;
    };
    weather: Array<{ id: number; main: string; description: string; icon: string }>;
    clouds: { all: number };
    wind: { speed: number; deg: number; gust?: number };
    visibility: number;
    pop: number;
    rain?: { '3h': number };
    snow?: { '3h': number };
    sys: { pod: string };
    dt_txt: string;
  }>;
  city: {
    name: string;
    country: string;
    coord: { lat: number; lon: number };
    timezone: number;
  };
};

// Fetch 5-day/3-hour forecast for given lat/lon 
export async function getForecast(lat: number, lon: number): Promise<ForecastWeather> {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch forecast');

  return await res.json() as ForecastWeather;
};

// Map OpenWeatherMap weather code to human-readable text
export function weatherCodeToText(code: number): string {
  const map: Record<number, string> = {
    200: 'Thunderstorm with light rain',
    201: 'Thunderstorm with rain',
    202: 'Thunderstorm with heavy rain',
    210: 'Light thunderstorm',
    211: 'Thunderstorm',
    212: 'Heavy thunderstorm',
    221: 'Ragged thunderstorm',
    230: 'Thunderstorm with light drizzle',
    231: 'Thunderstorm with drizzle',
    232: 'Thunderstorm with heavy drizzle',
    300: 'Light intensity drizzle',
    301: 'Drizzle',
    302: 'Heavy intensity drizzle',
    310: 'Light intensity drizzle rain',
    311: 'Drizzle rain',
    312: 'Heavy intensity drizzle rain',
    313: 'Shower rain and drizzle',
    314: 'Heavy shower rain and drizzle',
    321: 'Shower drizzle',
    500: 'Light rain',
    501: 'Moderate rain',
    502: 'Heavy intensity rain',
    503: 'Very heavy rain',
    504: 'Extreme rain',
    511: 'Freezing rain',
    520: 'Light intensity shower rain',
    521: 'Shower rain',
    522: 'Heavy intensity shower rain',
    531: 'Ragged shower rain',
    600: 'Light snow',
    601: 'Snow',
    602: 'Heavy snow',
    611: 'Sleet',
    612: 'Light shower sleet',
    613: 'Shower sleet',
    615: 'Light rain and snow',
    616: 'Rain and snow',
    620: 'Light shower snow',
    621: 'Shower snow',
    622: 'Heavy shower snow',
    701: 'Mist',
    711: 'Smoke',
    721: 'Haze',
    731: 'Sand/dust whirls',
    741: 'Fog',
    751: 'Sand',
    761: 'Dust',
    762: 'Volcanic ash',
    771: 'Squalls',
    781: 'Tornado',
    800: 'Clear sky',
    801: 'Few clouds',
    802: 'Scattered clouds',
    803: 'Broken clouds',
    804: 'Overcast clouds',
  };
  return map[code] ?? `Code ${code}`;
}