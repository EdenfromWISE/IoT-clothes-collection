import axios from 'axios';

class WeatherService {
  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  // Lấy thông tin thời tiết hiện tại
  async getCurrentWeather(lat, lon) {
    try {
      if (!this.apiKey) {
        console.log('Weather API key not configured');
        return null;
      }

      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric',
          lang: 'vi'
        }
      });

      return {
        temperature: response.data.main.temp,
        humidity: response.data.main.humidity,
        description: response.data.weather[0].description,
        windSpeed: response.data.wind.speed,
        cloudiness: response.data.clouds.all
      };
    } catch (error) {
      console.error('Weather API error:', error.message);
      return null;
    }
  }

  // Dự báo thời tiết (có mưa không?)
  async getWeatherForecast(lat, lon) {
    try {
      if (!this.apiKey) return null;

      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric',
          lang: 'vi'
        }
      });

      // Kiểm tra 3 giờ tới có mưa không
      const nextHours = response.data.list.slice(0, 3);
      const rainProbability = nextHours.some(item => 
        item.weather[0].main.toLowerCase().includes('rain')
      );

      return {
        willRain: rainProbability,
        forecast: nextHours.map(item => ({
          time: new Date(item.dt * 1000),
          weather: item.weather[0].description,
          temp: item.main.temp,
          humidity: item.main.humidity
        }))
      };
    } catch (error) {
      console.error('Weather forecast error:', error.message);
      return null;
    }
  }
}

export default new WeatherService();