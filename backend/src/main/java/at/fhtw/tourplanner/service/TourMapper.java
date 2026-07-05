package at.fhtw.tourplanner.service;

import at.fhtw.tourplanner.model.*;
import at.fhtw.tourplanner.dto.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class TourMapper {
  private final ObjectMapper objectMapper;
  private final TourStatsService stats;

  public TourMapper(ObjectMapper objectMapper, TourStatsService stats) {
    this.objectMapper = objectMapper;
    this.stats = stats;
  }

  public TourDto toDto(TourEntity entity) {
    TourDto dto = new TourDto();
    dto.id = entity.getId();
    dto.username = entity.getUser().getUsername();
    dto.title = entity.getTitle();
    dto.transportType = entity.getTransportType();
    dto.accessible = entity.isAccessible();
    dto.favorite = entity.isFavorite();
    dto.description = entity.getDescription();
    dto.startPoint = locationToDto(entity.getStartPoint());
    dto.endPoint = locationToDto(entity.getEndPoint());
    dto.poi = entity.getPoi().stream().map(this::locationToDto).collect(Collectors.toList());
    dto.route = routeToDto(entity.getRoute());
    dto.logs = entity.getLogs().stream().map(this::logToDto).collect(Collectors.toList());
    dto.popularity = stats.popularity(entity);
    dto.childFriendliness = stats.childFriendliness(entity).getLabel();
    return dto;
  }

  public TourEntity apply(TourDto dto, TourEntity entity, UserEntity user) {
    entity.setId(dto.id == null || dto.id.trim().isEmpty() ? UUID.randomUUID().toString() : dto.id);
    entity.setUser(user);
    entity.setTitle(dto.title);
    entity.setTransportType(dto.transportType == null ? TransportType.walking : dto.transportType);
    entity.setAccessible(dto.accessible);
    entity.setFavorite(dto.favorite);
    entity.setDescription(dto.description == null ? "" : dto.description);
    entity.setStartPoint(locationFromDto(dto.startPoint));
    entity.setEndPoint(locationFromDto(dto.endPoint));
    entity.setPoi(dto.poi == null ? new ArrayList<>() : dto.poi.stream().map(this::locationFromDto).collect(Collectors.toList()));
    entity.setRoute(routeFromDto(dto.route));
    return entity;
  }

  public TourLogDto logToDto(TourLogEntity entity) {
    TourLogDto dto = new TourLogDto();
    dto.id = entity.getId();
    dto.date = entity.getDate() == null ? null : entity.getDate().toString();
    dto.comment = entity.getComment();
    dto.difficulty = entity.getDifficulty();
    dto.totalDistance = entity.getTotalDistance();
    dto.totalTime = entity.getTotalTime();
    dto.rating = entity.getRating();
    return dto;
  }

  public TourLogEntity applyLog(TourLogDto dto, TourLogEntity entity, TourEntity tour) {
    entity.setId(dto.id == null || dto.id.trim().isEmpty() ? UUID.randomUUID().toString() : dto.id);
    entity.setTour(tour);
    entity.setDate(parseDate(dto.date));
    entity.setComment(dto.comment);
    entity.setDifficulty(dto.difficulty);
    entity.setTotalDistance(dto.totalDistance);
    entity.setTotalTime(dto.totalTime);
    entity.setRating(dto.rating);
    return entity;
  }

  private LocationDto locationToDto(LocationEmbeddable loc) {
    if (loc == null) return new LocationDto();
    LocationDto dto = new LocationDto();
    dto.name = loc.getName();
    dto.latitude = loc.getLatitude();
    dto.longitude = loc.getLongitude();
    return dto;
  }

  private LocationEmbeddable locationFromDto(LocationDto dto) {
    if (dto == null) return new LocationEmbeddable("", 0, 0);
    return new LocationEmbeddable(dto.name, dto.latitude, dto.longitude);
  }

  private RouteDto routeToDto(RouteEmbeddable route) {
    RouteDto dto = new RouteDto();
    if (route == null) return dto;
    dto.distance = route.getDistance();
    dto.durationMin = route.getDurationMin();
    try {
      dto.geometry = route.getGeometryJson() == null ? new ArrayList<>() : objectMapper.readValue(route.getGeometryJson(), new TypeReference<List<List<Double>>>() {});
    } catch (JsonProcessingException ex) {
      dto.geometry = new ArrayList<>();
    }
    return dto;
  }

  private RouteEmbeddable routeFromDto(RouteDto dto) {
    RouteEmbeddable route = new RouteEmbeddable();
    if (dto != null) {
      route.setDistance(dto.distance);
      route.setDurationMin(dto.durationMin);
      try {
        route.setGeometryJson(objectMapper.writeValueAsString(dto.geometry == null ? new ArrayList<>() : dto.geometry));
      } catch (JsonProcessingException ex) {
        route.setGeometryJson("[]");
      }
    }
    return route;
  }

  private LocalDateTime parseDate(String value) {
    if (value == null || value.trim().isEmpty()) return LocalDateTime.now();
    try {
      return OffsetDateTime.parse(value).toLocalDateTime();
    } catch (Exception ignored) {
      return LocalDateTime.parse(value);
    }
  }
}
