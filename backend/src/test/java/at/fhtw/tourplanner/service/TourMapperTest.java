package at.fhtw.tourplanner.service;

import at.fhtw.tourplanner.dto.LocationDto;
import at.fhtw.tourplanner.dto.RouteDto;
import at.fhtw.tourplanner.dto.TourDto;
import at.fhtw.tourplanner.model.TourEntity;
import at.fhtw.tourplanner.model.TransportType;
import at.fhtw.tourplanner.model.UserEntity;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class TourMapperTest {

  private final TourMapper mapper = new TourMapper(new ObjectMapper(), new TourStatsService());

  private UserEntity user() {
    UserEntity user = new UserEntity();
    user.setUsername("alice");
    return user;
  }

  private TourDto dto() {
    TourDto dto = new TourDto();
    dto.title = "Tour";
    dto.transportType = TransportType.walking;
    return dto;
  }

  @Test void toDto_nullStartAndEndPoint_returnsEmptyLocationDtoInsteadOfNpe() {
    TourEntity entity = mapper.apply(dto(), new TourEntity(), user());
    entity.setStartPoint(null);
    entity.setEndPoint(null);

    TourDto dto = mapper.toDto(entity);

    assertNotNull(dto.startPoint);
    assertNotNull(dto.endPoint);
  }

  @Test void toDto_nullRoute_returnsEmptyRouteDtoInsteadOfNpe() {
    TourEntity entity = mapper.apply(dto(), new TourEntity(), user());
    entity.setRoute(null);

    TourDto dto = mapper.toDto(entity);

    assertNotNull(dto.route);
    assertEquals(0.0, dto.route.distance);
    assertEquals(0, dto.route.durationMin);
  }

  @Test void apply_nullStartAndEndPointInDto_producesDefaultLocationInsteadOfNpe() {
    TourDto dto = dto();
    dto.startPoint = null;
    dto.endPoint = null;

    TourEntity entity = mapper.apply(dto, new TourEntity(), user());

    assertNotNull(entity.getStartPoint());
    assertNotNull(entity.getEndPoint());
    assertEquals("", entity.getStartPoint().getName());
  }

  @Test void apply_nullRouteInDto_producesDefaultRouteInsteadOfNpe() {
    TourDto dto = dto();
    dto.route = null;

    TourEntity entity = mapper.apply(dto, new TourEntity(), user());

    assertNotNull(entity.getRoute());
    assertEquals(0.0, entity.getRoute().getDistance());
    assertEquals(0, entity.getRoute().getDurationMin());
  }

  @Test void geometryRoundTrip_survivesSerializationAsListOfLists() {
    TourDto dto = dto();
    dto.route = new RouteDto();
    dto.route.distance = 12.3;
    dto.route.durationMin = 45;
    dto.route.geometry = Arrays.asList(
        Arrays.asList(47.1, 16.2),
        Arrays.asList(47.15, 16.25));

    TourEntity entity = mapper.apply(dto, new TourEntity(), user());
    TourDto roundTripped = mapper.toDto(entity);

    assertEquals(dto.route.geometry, roundTripped.route.geometry);
  }

  @Test void apply_emptyPoiList_survivesRoundTrip() {
    TourDto dto = dto();
    dto.poi = Collections.singletonList(new LocationDto());
    dto.poi.get(0).name = "Rastplatz";
    dto.poi.get(0).latitude = 48.1;
    dto.poi.get(0).longitude = 16.1;

    TourEntity entity = mapper.apply(dto, new TourEntity(), user());
    TourDto roundTripped = mapper.toDto(entity);

    assertEquals(1, roundTripped.poi.size());
    assertEquals("Rastplatz", roundTripped.poi.get(0).name);
  }
}
