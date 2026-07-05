package at.fhtw.tourplanner.service;

import at.fhtw.tourplanner.config.AppProperties;
import at.fhtw.tourplanner.model.LocationEmbeddable;
import at.fhtw.tourplanner.model.RouteEmbeddable;
import at.fhtw.tourplanner.model.TransportType;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class OpenRouteServiceClientTest {

  @Test void enrich_noApiKeyConfigured_returnsRouteUnchanged() {
    AppProperties properties = new AppProperties();
    OpenRouteServiceClient client = new OpenRouteServiceClient(properties, new ObjectMapper());
    RouteEmbeddable route = new RouteEmbeddable();
    route.setDistance(5.0);
    route.setDurationMin(50);
    LocationEmbeddable start = new LocationEmbeddable("Start", 48.2, 16.3);
    LocationEmbeddable end = new LocationEmbeddable("End", 48.3, 16.4);

    RouteEmbeddable result = client.enrich(route, start, end, Collections.emptyList(), TransportType.walking, false);

    assertSame(route, result);
    assertEquals(5.0, result.getDistance());
    assertEquals(50, result.getDurationMin());
  }

  @Test void buildCoordinates_ordersStartWaypointsEndAsLonLat() {
    LocationEmbeddable start = new LocationEmbeddable("Start", 48.2, 16.3);
    LocationEmbeddable wp1 = new LocationEmbeddable("POI1", 48.3, 16.4);
    LocationEmbeddable wp2 = new LocationEmbeddable("POI2", 48.4, 16.5);
    LocationEmbeddable end = new LocationEmbeddable("End", 48.5, 16.6);

    List<List<Double>> coordinates = OpenRouteServiceClient.buildCoordinates(start, Arrays.asList(wp1, wp2), end);

    assertEquals(4, coordinates.size());
    assertEquals(Arrays.asList(16.3, 48.2), coordinates.get(0));
    assertEquals(Arrays.asList(16.4, 48.3), coordinates.get(1));
    assertEquals(Arrays.asList(16.5, 48.4), coordinates.get(2));
    assertEquals(Arrays.asList(16.6, 48.5), coordinates.get(3));
  }

  @Test void buildCoordinates_noWaypoints_onlyStartAndEnd() {
    LocationEmbeddable start = new LocationEmbeddable("Start", 48.2, 16.3);
    LocationEmbeddable end = new LocationEmbeddable("End", 48.5, 16.6);

    List<List<Double>> coordinates = OpenRouteServiceClient.buildCoordinates(start, null, end);

    assertEquals(2, coordinates.size());
  }

  @Test void runningDurationMin_usesEightKmhAverageSpeed() {
    assertEquals(60, OpenRouteServiceClient.runningDurationMin(8.0));
    assertEquals(30, OpenRouteServiceClient.runningDurationMin(4.0));
    assertEquals(75, OpenRouteServiceClient.runningDurationMin(10.0));
  }
}
