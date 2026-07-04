package at.fhtw.tourplanner.service;

import at.fhtw.tourplanner.config.AppProperties;
import at.fhtw.tourplanner.dto.LocationDto;
import at.fhtw.tourplanner.dto.TourDto;
import at.fhtw.tourplanner.dto.WeatherDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class WeatherService {
  private static final Logger log = LoggerFactory.getLogger(WeatherService.class);

  private final AppProperties properties;
  private final ObjectMapper objectMapper;
  private final RestTemplate restTemplate = buildRestTemplate();

  private static RestTemplate buildRestTemplate() {
    SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
    f.setConnectTimeout(5_000);
    f.setReadTimeout(10_000);
    return new RestTemplate(f);
  }

  public WeatherService(AppProperties properties, ObjectMapper objectMapper) {
    this.properties = properties;
    this.objectMapper = objectMapper;
  }

  public WeatherDto currentWeather(double latitude, double longitude) {
    String apiKey = properties.getOpenWeather().getApiKey();
    if (apiKey == null || apiKey.trim().isEmpty()) {
      return missingApiKey();
    }

    try {
      Observation observation = fetchObservation(latitude, longitude, apiKey);
      WeatherDto dto = new WeatherDto();
      dto.providerConfigured = true;
      dto.coverageLabel = "Am ausgewaehlten Punkt";
      dto.locationName = observation.locationName;
      dto.description = observation.description;
      dto.temperatureCelsius = round1(observation.temperature);
      dto.temperatureMinCelsius = dto.temperatureCelsius;
      dto.temperatureMaxCelsius = dto.temperatureCelsius;
      dto.feelsLikeCelsius = round1(observation.feelsLike);
      dto.feelsLikeMinCelsius = dto.feelsLikeCelsius;
      dto.feelsLikeMaxCelsius = dto.feelsLikeCelsius;
      dto.humidity = observation.humidity;
      dto.windKmh = round1(observation.windKmh);
      dto.sampleCount = 1;
      dto.clothingAdvice = clothingAdvice(observation.feelsLike, observation.windKmh, observation.description);
      return dto;
    } catch (Exception ex) {
      return failedWeather("Wetterdaten konnten nicht geladen werden.", describeWeatherError(ex));
    }
  }

  public WeatherDto tourWeather(TourDto tour) {
    String apiKey = properties.getOpenWeather().getApiKey();
    if (apiKey == null || apiKey.trim().isEmpty()) {
      return missingApiKey();
    }

    try {
      List<Point> points = sampleTourPoints(tour);
      List<Observation> observations = new ArrayList<Observation>();
      for (Point point : points) {
        observations.add(fetchObservation(point.latitude, point.longitude, apiKey));
      }
      return summarizeObservations(tour, observations);
    } catch (Exception ex) {
      return failedWeather("Wetterdaten konnten nicht geladen werden.", describeWeatherError(ex));
    }
  }

  private WeatherDto summarizeObservations(TourDto tour, List<Observation> observations) {
    WeatherDto dto = new WeatherDto();
    dto.providerConfigured = true;
    dto.coverageLabel = "Im Tourgebiet";
    dto.locationName = tour.title;
    dto.sampleCount = observations.size();

    double temperatureSum = 0;
    double feelsLikeSum = 0;
    double humiditySum = 0;
    double maxWind = 0;
    double minTemperature = Double.MAX_VALUE;
    double maxTemperature = -Double.MAX_VALUE;
    double minFeelsLike = Double.MAX_VALUE;
    double maxFeelsLike = -Double.MAX_VALUE;
    String description = observations.get(0).description;
    StringBuilder descriptions = new StringBuilder();

    for (Observation observation : observations) {
      temperatureSum += observation.temperature;
      feelsLikeSum += observation.feelsLike;
      humiditySum += observation.humidity;
      maxWind = Math.max(maxWind, observation.windKmh);
      minTemperature = Math.min(minTemperature, observation.temperature);
      maxTemperature = Math.max(maxTemperature, observation.temperature);
      minFeelsLike = Math.min(minFeelsLike, observation.feelsLike);
      maxFeelsLike = Math.max(maxFeelsLike, observation.feelsLike);
      descriptions.append(' ').append(observation.description == null ? "" : observation.description);
    }

    dto.description = description;
    dto.temperatureCelsius = round1(temperatureSum / observations.size());
    dto.temperatureMinCelsius = round1(minTemperature);
    dto.temperatureMaxCelsius = round1(maxTemperature);
    dto.feelsLikeCelsius = round1(feelsLikeSum / observations.size());
    dto.feelsLikeMinCelsius = round1(minFeelsLike);
    dto.feelsLikeMaxCelsius = round1(maxFeelsLike);
    dto.humidity = (int) Math.round(humiditySum / observations.size());
    dto.windKmh = round1(maxWind);
    dto.clothingAdvice = clothingAdvice(minFeelsLike, maxWind, descriptions.toString());
    dto.message = observations.size() > 1 ? "Entlang der gespeicherten Route zusammengefasst." : null;
    return dto;
  }

  private Observation fetchObservation(double latitude, double longitude, String apiKey) throws Exception {
    String url = normalizeBaseUrl(properties.getOpenWeather().getBaseUrl())
        + "/data/2.5/weather?lat=" + latitude
        + "&lon=" + longitude
        + "&appid=" + apiKey
        + "&units=metric&lang=de";

    JsonNode root = objectMapper.readTree(restTemplate.getForObject(url, String.class));
    if (root.has("cod") && !"200".equals(root.path("cod").asText()) && root.path("main").isMissingNode()) {
      throw new IllegalStateException(root.path("message").asText("OpenWeather Fehler"));
    }

    Observation observation = new Observation();
    observation.locationName = root.path("name").asText("");
    observation.temperature = root.at("/main/temp").asDouble();
    observation.feelsLike = root.at("/main/feels_like").asDouble();
    observation.humidity = root.at("/main/humidity").asInt();
    observation.windKmh = root.at("/wind/speed").asDouble() * 3.6;
    observation.description = root.path("weather").isArray() && root.path("weather").size() > 0
        ? root.path("weather").get(0).path("description").asText("")
        : "";
    return observation;
  }

  private List<Point> sampleTourPoints(TourDto tour) {
    List<Point> points = new ArrayList<Point>();
    Set<String> seen = new LinkedHashSet<String>();

    if (tour.route != null && tour.route.geometry != null && !tour.route.geometry.isEmpty()) {
      int sampleCount = Math.min(6, tour.route.geometry.size());
      for (int i = 0; i < sampleCount; i++) {
        int index = sampleCount == 1 ? 0 : (int) Math.round(i * (tour.route.geometry.size() - 1.0) / (sampleCount - 1.0));
        List<Double> coordinate = tour.route.geometry.get(index);
        if (coordinate != null && coordinate.size() >= 2) {
          addPoint(points, seen, coordinate.get(0), coordinate.get(1));
        }
      }
    }

    addLocation(points, seen, tour.startPoint);
    addLocation(points, seen, tour.endPoint);
    if (tour.poi != null) {
      for (LocationDto poi : tour.poi) {
        addLocation(points, seen, poi);
      }
    }

    if (points.isEmpty()) {
      throw new IllegalArgumentException("Keine Koordinaten fuer Wetterabfrage verfuegbar.");
    }
    return points;
  }

  private void addLocation(List<Point> points, Set<String> seen, LocationDto location) {
    if (location == null) return;
    addPoint(points, seen, location.latitude, location.longitude);
  }

  private void addPoint(List<Point> points, Set<String> seen, double latitude, double longitude) {
    String key = round4(latitude) + ":" + round4(longitude);
    if (seen.add(key)) {
      points.add(new Point(latitude, longitude));
    }
  }

  private WeatherDto missingApiKey() {
    WeatherDto dto = new WeatherDto();
    dto.providerConfigured = false;
    dto.message = "OPENWEATHER_API_KEY ist nicht gesetzt.";
    dto.clothingAdvice = "Wettercheck nicht verfuegbar.";
    return dto;
  }

  private WeatherDto failedWeather(String message, String detail) {
    log.warn("OpenWeather request failed: {}", detail);
    WeatherDto dto = new WeatherDto();
    dto.providerConfigured = true;
    dto.message = message + (detail == null || detail.isEmpty() ? "" : " " + detail);
    dto.clothingAdvice = "Bitte Wetter manuell pruefen.";
    return dto;
  }

  private String describeWeatherError(Exception ex) {
    if (ex instanceof HttpStatusCodeException) {
      HttpStatusCodeException http = (HttpStatusCodeException) ex;
      return "OpenWeather meldet " + http.getStatusCode().value() + ".";
    }
    return ex.getMessage();
  }

  private String normalizeBaseUrl(String baseUrl) {
    if (baseUrl == null || baseUrl.trim().isEmpty()) {
      return "https://api.openweathermap.org";
    }
    if (baseUrl.endsWith("/")) {
      return baseUrl.substring(0, baseUrl.length() - 1);
    }
    return baseUrl;
  }

  private double round1(double value) {
    return Math.round(value * 10.0) / 10.0;
  }

  private double round4(double value) {
    return Math.round(value * 10000.0) / 10000.0;
  }

  private String clothingAdvice(double feelsLike, double windKmh, String description) {
    String lower = description == null ? "" : description.toLowerCase();
    boolean rain = lower.contains("regen") || lower.contains("rain") || lower.contains("schauer");
    StringBuilder advice = new StringBuilder();
    if (feelsLike < 5) advice.append("Sehr warm anziehen");
    else if (feelsLike < 12) advice.append("Jacke oder Fleece einpacken");
    else if (feelsLike < 20) advice.append("Leichte Jacke reicht meist");
    else if (feelsLike < 27) advice.append("Leichte Kleidung passt");
    else advice.append("Sehr leicht kleiden und genug trinken");

    if (rain) advice.append(", Regenschutz mitnehmen");
    if (windKmh >= 30) advice.append(", winddichte Schicht empfohlen");
    return advice.append('.').toString();
  }

  private static class Observation {
    String locationName;
    String description;
    double temperature;
    double feelsLike;
    int humidity;
    double windKmh;
  }

  private static class Point {
    final double latitude;
    final double longitude;

    Point(double latitude, double longitude) {
      this.latitude = latitude;
      this.longitude = longitude;
    }
  }
}
