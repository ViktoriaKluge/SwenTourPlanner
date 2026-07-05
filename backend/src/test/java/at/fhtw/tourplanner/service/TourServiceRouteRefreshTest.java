package at.fhtw.tourplanner.service;

import at.fhtw.tourplanner.dto.LocationDto;
import at.fhtw.tourplanner.dto.TourDto;
import at.fhtw.tourplanner.model.LocationEmbeddable;
import at.fhtw.tourplanner.model.RouteEmbeddable;
import at.fhtw.tourplanner.model.TourEntity;
import at.fhtw.tourplanner.model.TransportType;
import at.fhtw.tourplanner.model.UserEntity;
import at.fhtw.tourplanner.repo.TourLogRepository;
import at.fhtw.tourplanner.repo.TourRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TourServiceRouteRefreshTest {

  @Mock private TourRepository tours;
  @Mock private TourLogRepository logs;
  @Mock private AuthService auth;
  @Mock private TourMapper mapper;
  @Mock private FullTextSearchService search;
  @Mock private OpenRouteServiceClient routeClient;

  private TourService service() {
    return new TourService(tours, logs, auth, mapper, search, routeClient);
  }

  private TourEntity existingTour() {
    UserEntity user = new UserEntity();
    user.setUsername("alice");
    TourEntity entity = new TourEntity();
    entity.setId("tour-1");
    entity.setUser(user);
    entity.setTransportType(TransportType.walking);
    entity.setAccessible(false);
    entity.setStartPoint(new LocationEmbeddable("Start", 48.2, 16.3));
    entity.setEndPoint(new LocationEmbeddable("End", 48.5, 16.6));
    entity.setPoi(new ArrayList<>());
    entity.setRoute(new RouteEmbeddable());
    when(tours.findByIdAndUserUsername("tour-1", "alice")).thenReturn(Optional.of(entity));
    return entity;
  }

  private TourDto dtoMatching(TourEntity existing) {
    TourDto dto = new TourDto();
    dto.transportType = existing.getTransportType();
    dto.accessible = existing.isAccessible();
    dto.startPoint = locationDto(existing.getStartPoint());
    dto.endPoint = locationDto(existing.getEndPoint());
    dto.poi = new ArrayList<>();
    for (LocationEmbeddable poi : existing.getPoi()) {
      dto.poi.add(locationDto(poi));
    }
    return dto;
  }

  private LocationDto locationDto(LocationEmbeddable loc) {
    LocationDto dto = new LocationDto();
    dto.name = loc.getName();
    dto.latitude = loc.getLatitude();
    dto.longitude = loc.getLongitude();
    return dto;
  }

  @Test void update_noRelevantChanges_doesNotCallRouteClient() {
    TourEntity existing = existingTour();

    service().update("alice", "tour-1", dtoMatching(existing));

    verify(routeClient, never()).enrich(any(), any(), any(), any(), any(), anyBoolean());
  }

  @Test void update_transportTypeChanged_refreshesRoute() {
    TourEntity existing = existingTour();
    TourDto dto = dtoMatching(existing);
    dto.transportType = TransportType.cycling;
    when(routeClient.enrich(any(), any(), any(), any(), any(), anyBoolean())).thenReturn(new RouteEmbeddable());

    service().update("alice", "tour-1", dto);

    verify(routeClient, times(1)).enrich(any(), any(), any(), any(), any(), anyBoolean());
  }

  @Test void update_accessibleFlagChanged_refreshesRoute() {
    TourEntity existing = existingTour();
    TourDto dto = dtoMatching(existing);
    dto.accessible = true;
    when(routeClient.enrich(any(), any(), any(), any(), any(), anyBoolean())).thenReturn(new RouteEmbeddable());

    service().update("alice", "tour-1", dto);

    verify(routeClient, times(1)).enrich(any(), any(), any(), any(), any(), anyBoolean());
  }

  @Test void update_startPointMoved_refreshesRoute() {
    TourEntity existing = existingTour();
    TourDto dto = dtoMatching(existing);
    dto.startPoint.latitude = 49.0;
    when(routeClient.enrich(any(), any(), any(), any(), any(), anyBoolean())).thenReturn(new RouteEmbeddable());

    service().update("alice", "tour-1", dto);

    verify(routeClient, times(1)).enrich(any(), any(), any(), any(), any(), anyBoolean());
  }

  @Test void update_poiAdded_refreshesRoute() {
    TourEntity existing = existingTour();
    TourDto dto = dtoMatching(existing);
    dto.poi = Collections.singletonList(locationDto(new LocationEmbeddable("Rastplatz", 48.3, 16.4)));
    when(routeClient.enrich(any(), any(), any(), any(), any(), anyBoolean())).thenReturn(new RouteEmbeddable());

    service().update("alice", "tour-1", dto);

    verify(routeClient, times(1)).enrich(any(), any(), any(), any(), any(), anyBoolean());
  }

  @Test void update_poiMovedSameCount_refreshesRoute() {
    TourEntity existing = existingTour();
    existing.setPoi(new ArrayList<>(Collections.singletonList(new LocationEmbeddable("Rastplatz", 48.3, 16.4))));
    List<LocationDto> unchanged = Collections.singletonList(locationDto(existing.getPoi().get(0)));
    TourDto dto = dtoMatching(existing);
    dto.poi = new ArrayList<>(unchanged);
    dto.poi.get(0).latitude = 48.35;
    when(routeClient.enrich(any(), any(), any(), any(), any(), anyBoolean())).thenReturn(new RouteEmbeddable());

    service().update("alice", "tour-1", dto);

    verify(routeClient, times(1)).enrich(any(), any(), any(), any(), any(), anyBoolean());
  }
}
