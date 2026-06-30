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
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class OpenRouteServiceClient {
  private static final Logger log = LoggerFactory.getLogger(OpenRouteServiceClient.class);
  private static final double RUNNING_SPEED_KMH = 8.0;
  private final AppProperties properties;
  private final ObjectMapper objectMapper;
  private final RestTemplate restTemplate = new RestTemplate();

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
      List<List<Double>> coordinates = new ArrayList<>();
      coordinates.add(Arrays.asList(start.getLongitude(), start.getLatitude()));
      if (waypoints != null) {
        for (LocationEmbeddable wp : waypoints) {
          coordinates.add(Arrays.asList(wp.getLongitude(), wp.getLatitude()));
        }
      }
      coordinates.add(Arrays.asList(end.getLongitude(), end.getLatitude()));
      Map<String, Object> body = new HashMap<>();
      body.put("coordinates", coordinates);
      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);
      headers.set("Authorization", properties.getOpenRouteService().getApiKey());
      ResponseEntity<String> response = restTemplate.postForEntity(url, new HttpEntity<>(body, headers), String.class);
      JsonNode root = objectMapper.readTree(response.getBody());
      JsonNode summary = root.at("/features/0/properties/summary");
      current.setDistance(Math.round(summary.path("distance").asDouble() / 10.0) / 100.0);
      current.setDurationMin((int) Math.round(summary.path("duration").asDouble() / 60.0));
      current.setRouteInfo("OpenRouteService " + profile);
      List<List<Double>> latLngs = new ArrayList<>();
      for (JsonNode coordinate : root.at("/features/0/geometry/coordinates")) {
        latLngs.add(Arrays.asList(coordinate.get(1).asDouble(), coordinate.get(0).asDouble()));
      }
      current.setGeometryJson(objectMapper.writeValueAsString(latLngs));
      if (type == TransportType.running) {
        current.setDurationMin((int) Math.round(current.getDistance() / RUNNING_SPEED_KMH * 60)); // ors duration is not accurate for running, so we calculate it based on distance and average running speed
      }
    } catch (Exception ex) {
      log.warn("OpenRouteService request failed, keeping submitted route values: {}", ex.getMessage());
    }
    return current;
  }

  private String profile(TransportType type, boolean accessible) {
    if (accessible) return "wheelchair";
    if (type == TransportType.cycling) return "cycling-regular";
    if (type == TransportType.driving) return "driving-car";
    if (type == TransportType.running) return "foot-walking";
    return "foot-hiking";
  }
}
