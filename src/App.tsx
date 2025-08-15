import './App.css';
import { useState, useEffect } from 'react';
import { Search, Cloud, Sun, CloudRain, CloudFog, CloudLightning, Snowflake, Wind } from 'lucide-react';


// React Query hooks for data fetching and caching
import { keepPreviousData, useQuery } from '@tanstack/react-query';

// Helper functions and types from weather API
import { geocodeCity, getCurrentWeather, getForecast, weatherCodeToText, reverseGeocode, type Coords, type CurrentWeather, type ForecastWeather } from './lib/weatherApi';

function App() {
  //initial data Kathmandu ko weather
  const [cityInput, setCityInput] = useState('Kathmandu');
  const [city, setCity] = useState('Kathmandu');
  //device ko location ko lagi state
  const [useUserLocation, setUseUserLocation] = useState(false);
  //device ko coordinates if xa bhane
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  // State to control forecast page navigation
  const [showForecast, setShowForecast] = useState(false); // controls forecast page

  //first choti app load huda, user ko location detect garna khojne
  useEffect(() => {
    if (navigator.geolocation) {
      //ask for location, browser ma
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          //coordinates lai reverse garne, to find city name
          const location = await reverseGeocode(latitude, longitude);
          const name = location?.name || 'Your Location';
          const country = location?.country || '';
         
          //save data in state
          setUserCoords({ latitude, longitude, name, country });
          setUseUserLocation(true);
          setCityInput(name); //detect bhako city ko name input box ma dekhaune
        },
        (error) => {
          console.error('Geolocation error:', error);
          //if user ley location deny garxa bhane, default city Kathmandu dekhaidine
          setUseUserLocation(false);
          setCity('Kathmandu');
          setCityInput('Kathmandu');
        }
      );
    } else {
      //broswer ley geolocation support gardaina bhane pani Kathmandu ko weather dekhaune
      setUseUserLocation(false);
      setCity('Kathmandu');
      setCityInput('Kathmandu');
    }
  }, []);

  //if device ko location use bhaxaina, Fetch coordinates based on city name entered
  const {
    data: geocodeCoords,
    isLoading: geocodeLoading,
    isError: geocodeError,
    error: geocodeErrObj
  } = useQuery<Coords | null>({
    queryKey: ['geocode', city], //Cache key for REact Query, (unique key= query key)
    queryFn: () => geocodeCity(city), //queryfn used to fetch data
    enabled: !useUserLocation && !!city, //run only if not using location
    staleTime: 1000 * 60 * 10, //cache for 10 minutes, if we have to refetch same city 
    retry: 1, //if fail bhayo bhane 1 choti retry
  });
 //kun coordinates use garne ,userlocation bhaye tei natra entered city
  const effectiveCoords = useUserLocation ? userCoords : geocodeCoords;

  //fetch current weather for chosen coordinates, different status hunxa, loading Error or data if success
  const {
    data: currentWeather,
    isLoading: currentLoading,
    isError: currentError,
    error: currentErrObj
  } = useQuery<CurrentWeather>({
    queryKey: ['current', effectiveCoords?.latitude, effectiveCoords?.longitude],
    enabled: !!effectiveCoords, //only run if coordinates exist
    queryFn: () => getCurrentWeather(effectiveCoords!.latitude, effectiveCoords!.longitude),
    staleTime: 1000 * 60 * 10,
    retry: 1,
    placeholderData: keepPreviousData, //new data arrive nabhaye samma keep old data
  });

  //fetch forecast for selected coordinates
  const {
    data: forecast,
    isLoading: forecastLoading,
    isError: forecastError,
    error: forecastErrObj
  } = useQuery<ForecastWeather>({
    queryKey: ['forecast', effectiveCoords?.latitude, effectiveCoords?.longitude],
    enabled: !!effectiveCoords,
    queryFn: () => getForecast(effectiveCoords!.latitude, effectiveCoords!.longitude),
    staleTime: 1000 * 60 * 1, //1 minute
    retry: 1,
    placeholderData: keepPreviousData,
  });

  //when user submit search form
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedCity = cityInput.trim();
    if(trimmedCity){ // Only update city if input is not empty
        setUseUserLocation(false); //switch to manual mode
    setCity(trimmedCity); //trigger data fetch for city
    }
  }

  // If any error (location, current, or forecast), show error message 
  let anyError = geocodeError || currentError || forecastError;
  let errorMsg = '';
  if (geocodeError) {
    // For  error  , 
    if ((geocodeErrObj as Error)?.message?.toLowerCase().includes('devtools')) {
      errorMsg = ' ERROR.';
    } else {
      errorMsg = `Could not find location. ${(geocodeErrObj as Error)?.message}. Please try another city.`;
    }
  } else if (currentError) {
    errorMsg = `Unable to fetch weather data. ${(currentErrObj as Error)?.message}`;
  } else if (forecastError) {
    errorMsg = `Unable to fetch forecast data. ${(forecastErrObj as Error)?.message}`;
  }

  // Main render
  return (
    <div className="app-bg-gradient">
     
      <main style={{ width: '100%', maxWidth: 900, margin: '0 auto', flexGrow: 1 }}>
        <div className="weather-card">
          {/*  show only error message if any error present */}
          {anyError ? (
            <div className="error-message">{errorMsg}</div>
          ) : (geocodeLoading || currentLoading || forecastLoading) ? (
            // Show only loading if any loading state is true
            <p className="weather-sub">Loading...</p>
          ) : showForecast ? (
            // 5-day forecast page
            <>
              <div className="forecast-title">5-Day Forecast for {effectiveCoords?.name}</div>
              {forecast && <DailyForecast forecast={forecast} />}
              <button className="forecast-nav-btn" onClick={() => setShowForecast(false)}>
                ← Back to Current Weather
              </button>
            </>
          ) : (
            // Main weather page
            <>
              <form onSubmit={handleSubmit} className="weather-search">
                <input
                  value={cityInput}
                  onChange={e => setCityInput(e.target.value)}
                  placeholder="Enter the city name"
                  className="weather-input"
                  autoComplete="off"
                  aria-label="City name"
                />
                <button type="submit" className="weather-btn" aria-label="Search">
                  <Search style={{ marginRight: 4, verticalAlign: 'middle' }} size={20} />
                </button>
              </form>
              {/* Only show weather if we have coordinates and not loading */}
              {effectiveCoords && currentWeather && forecast && (
                <>
                  <div style={{ textAlign: 'center' }}>
                    <div className="weather-header">{effectiveCoords.name}, {effectiveCoords.country}</div>
                    <CurrentWeather currentWeather={currentWeather} />
                  </div>
                  <button className="forecast-nav-btn" onClick={() => setShowForecast(true)}>
                    5 Day Forecast →
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

//  Weather Display 
function CurrentWeather({ currentWeather }: { currentWeather: CurrentWeather }) {
  // Calculate temperatures
  const tempC = Math.round(currentWeather.main.temp * 100) / 100;
  //  Fahrenheit conversion
  const tempF = Math.round(((currentWeather.main.temp * 9/5) + 32) * 100) / 100;
  const minC = Math.round(currentWeather.main.temp_min * 100) / 100;
  const minF = Math.round(((currentWeather.main.temp_min * 9/5) + 32) * 100) / 100;
  const maxC = Math.round(currentWeather.main.temp_max * 100) / 100;
  const maxF = Math.round(((currentWeather.main.temp_max * 9/5) + 32) * 100) / 100;

  const currentDate = new Date(currentWeather.dt * 1000);
  const timeStr = currentDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });
  const dateStr = currentDate.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: 'numeric' });

  const pressure = Math.round(currentWeather.main.pressure);
  const humidity = Math.round(currentWeather.main.humidity);

  return (
    <div style={{ width: '100%' }}>
      <div className="weather-sub">Today</div>
      <div className="weather-sub">Time: {timeStr} &nbsp; Date: {dateStr}</div>
      {/* temperature display */}
      <div className="weather-temp-row">
        <div className="weather-temp">{tempC}<span className="weather-temp-unit">°C</span></div>
        <div className="weather-temp">{tempF}<span className="weather-temp-unit">°F</span></div>
      </div>
      {/* icon */}
      <div className="weather-main-row">
        <div className="weather-icon">{getWeatherIcon(currentWeather.weather[0].id)}</div>
        <div className="weather-desc">{weatherCodeToText(currentWeather.weather[0].id)}</div>
      </div>
      {/* Weather details  */}
      <div className="weather-details">
        <div className="weather-detail-box">
          <div>Pressure</div>
          <div style={{ fontWeight: 700 }}>{pressure} hPa</div>
        </div>
        <div className="weather-detail-box">
          <div>Humidity</div>
          <div style={{ fontWeight: 700 }}>{humidity}%</div>
        </div>
        <div className="weather-detail-box">
          <div>Min Temp</div>
          <div style={{ fontWeight: 700 }}>{minC}°C / {minF}°F</div>
        </div>
        <div className="weather-detail-box">
          <div>Max Temp</div>
          <div style={{ fontWeight: 700 }}>{maxC}°C / {maxF}°F</div>
        </div>
      </div>
    </div>
  );
}

// 5-Day Forecast Display cards (on next page)
function DailyForecast({ forecast }: { forecast: ForecastWeather }) {
  //5 wota group
  const dailyData = Array.from({ length: 5 }, (_, i) => {
    const dayStart = i * 8; // 24 hours / 3 hours = 8 entries per day
    const dayEntries = forecast.list.slice(dayStart, dayStart + 8);
    const temps = dayEntries.map(entry => entry.main.temp);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const firstEntry = dayEntries[0];
    return {
      dt: firstEntry.dt,
      minTemp,
      maxTemp,
      weather: firstEntry.weather[0],
    };
  });

  return (
    <div className="forecast-cards">
      {dailyData.map((day, i) => {
        const maxC = Math.round(day.maxTemp * 100) / 100;
        const minC = Math.round(day.minTemp * 100) / 100;
        return (
          <div key={i} className="forecast-card">
            <div style={{ fontWeight: 600 }}>{new Date(day.dt * 1000).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: 'numeric' })}</div>
            <div className="weather-icon">{getWeatherIcon(day.weather.id)}</div>
            <div style={{ fontSize: '1rem', fontWeight: 500 }}>{weatherCodeToText(day.weather.id)}</div>
            <div style={{ fontWeight: 700 }}>Max: {maxC}°C</div>
            <div style={{ fontWeight: 700 }}>Min: {minC}°C</div>
          </div>
        );
      })}
    </div>
  );
}

// Get weather icon based on code ()
function getWeatherIcon(code: number) {
  if (code >= 200 && code < 300) return <CloudLightning className='h-10 w-10 text-purple-600' />;
  if (code >= 300 && code < 400) return <CloudRain className='h-10 w-10 text-blue-600' />;
  if (code >= 500 && code < 600) return <CloudRain className='h-10 w-10 text-blue-600' />;
  if (code >= 600 && code < 700) return <Snowflake className='h-10 w-10 text-blue-300' />;
  if (code >= 700 && code < 800) return <CloudFog className='h-10 w-10 text-gray-500' />;
  if (code === 800) return <Sun className='h-10 w-10 text-yellow-500' />;
  if (code > 800) return <Cloud className='h-10 w-10 text-gray-500' />;
  return <Wind className='h-10 w-10 text-blue-600' />;
}

export default App;