import axios from "axios";

export async function getRainyDays(cityName) {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${apiKey}&units=metric`;

  try {
    const response = await axios.get(url);
    const forecastList = response.data.list;

    const dailyConditions = {};
    forecastList.forEach(item => {
      const date = item.dt_txt.split(" ")[0];
      const condition = item.weather[0].main.toLowerCase();

      if (!dailyConditions[date]) dailyConditions[date] = [];
      dailyConditions[date].push(condition);
    });

    const rainyDays = Object.entries(dailyConditions)
      .filter(([_, conditions]) => conditions.filter(c => c.includes("rain")).length >= 2)
      .map(([date]) => date);
    return rainyDays;
  } catch (err) {
    console.error("Error fetching weather:", err.response?.data || err.message);
    return [];
  }
}