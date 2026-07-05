package at.fhtw.tourplanner.service;

import at.fhtw.tourplanner.config.AppProperties;
import at.fhtw.tourplanner.model.LocationEmbeddable;
import at.fhtw.tourplanner.model.RouteEmbeddable;
import at.fhtw.tourplanner.model.TransportType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class OpenRouteServiceClient {
  private static final Logger log = LoggerFactory.getLogger(OpenRouteServiceClient.class);
  private static final double RUNNING_SPEED_KMH = 8.0;
  private final AppProperties properties;
  private final ObjectMapper objectMapper;
  private final RestTemplate restTemplate = buildRestTemplate();

  private static RestTemplate buildRestTemplate() {
    SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
    f.setConnectTimeout(5_000);
    f.setReadTimeout(10_000);
    return new RestTemplate(f);
  }

  public OpenRouteServiceClient(AppProperties properties, ObjectMapper objectMapper) {
    this.properties = properties;
    this.objectMapper = objectMapper;
  }

  public RouteEmbeddable enrich(RouteEmbeddable current, LocationEmbeddable start, LocationEmbeddable end, List<LocationEmbeddable> waypoints, TransportType type, boolean accessible) {
    if (properties.getOpenRouteService().getApiKey() == null || properties.getOpenRouteService().getApiKey().trim().isEmpty()) {
      return current;
    }
    try {
      String profile = profile(type, accessible);
      String url = properties.getOpenRouteService().getBaseUrl() + "/v2/directions/" + profile + "/geojson";
      List<List<Double>> coordinates = buildCoordinates(start, waypoints, end);
      Map<String, Object> body = new HashMap<>();
      body.put("coordinates", coordinates);
      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);
      headers.set("Authorization", properties.getOpenRouteService().getApiKey());
      ResponseEntity<String> response = restTemplate.postForEntity(url, new HttpEntity<>(body, headers), String.class);
      String responseBody = response.getBody();
      if (responseBody == null || responseBody.isBlank()) {
        throw new Exception("Leere ORS-Antwort");
      }
      JsonNode root = objectMapper.readTree(responseBody);
      JsonNode summary = root.at("/features/0/properties/summary");
      if (summary.isMissingNode()) {
        throw new Exception("Ungültige ORS-Antwortstruktur: summary fehlt");
      }
      current.setDistance(Math.round(summary.path("distance").asDouble() / 10.0) / 100.0);
      current.setDurationMin((int) Math.round(summary.path("duration").asDouble() / 60.0));
      List<List<Double>> latLngs = new ArrayList<>();
      for (JsonNode coordinate : root.at("/features/0/geometry/coordinates")) {
        latLngs.add(Arrays.asList(coordinate.get(1).asDouble(), coordinate.get(0).asDouble()));
      }
      current.setGeometryJson(objectMapper.writeValueAsString(latLngs));
      if (type == TransportType.running) {
        current.setDurationMin(runningDurationMin(current.getDistance()));
      }
    } catch (Exception ex) {
      log.warn("OpenRouteService request failed, keeping submitted route values: {}", ex.getMessage());
    }
    return current;
  }

  static List<List<Double>> buildCoordinates(LocationEmbeddable start, List<LocationEmbeddable> waypoints, LocationEmbeddable end) {
    List<List<Double>> coordinates = new ArrayList<>();
    coordinates.add(Arrays.asList(start.getLongitude(), start.getLatitude()));
    if (waypoints != null) {
      for (LocationEmbeddable wp : waypoints) {
        coordinates.add(Arrays.asList(wp.getLongitude(), wp.getLatitude()));
      }
    }
    coordinates.add(Arrays.asList(end.getLongitude(), end.getLatitude()));
    return coordinates;
  }

  static int runningDurationMin(double distanceKm) {
    return (int) Math.round(distanceKm / RUNNING_SPEED_KMH * 60);
  }

  private String profile(TransportType type, boolean accessible) {
    if (accessible) return "wheelchair";
    if (type == TransportType.cycling) return "cycling-regular";
    if (type == TransportType.driving) return "driving-car";
    if (type == TransportType.running) return "foot-walking";
    return "foot-hiking";
  }
}
