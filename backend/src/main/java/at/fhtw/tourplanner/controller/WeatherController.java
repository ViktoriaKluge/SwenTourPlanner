package at.fhtw.tourplanner.controller;

import at.fhtw.tourplanner.service.WeatherService;
import at.fhtw.tourplanner.dto.TourDto;
import at.fhtw.tourplanner.dto.WeatherDto;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/weather")
@CrossOrigin(origins = "http://localhost:4200")
public class WeatherController {
  private final WeatherService weather;

  public WeatherController(WeatherService weather) {
    this.weather = weather;
  }

  @GetMapping("/current")
  public WeatherDto current(@RequestParam double lat, @RequestParam double lon) {
    return weather.currentWeather(lat, lon);
  }

  @PostMapping("/tour-summary")
  public WeatherDto tourSummary(@RequestBody TourDto tour) {
    return weather.tourWeather(tour);
  }
}
