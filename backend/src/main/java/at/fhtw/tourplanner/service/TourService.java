package at.fhtw.tourplanner.service;

import at.fhtw.tourplanner.model.TourEntity;
import at.fhtw.tourplanner.model.TourLogEntity;
import at.fhtw.tourplanner.model.LocationEmbeddable;
import at.fhtw.tourplanner.model.UserEntity;
import at.fhtw.tourplanner.repo.TourLogRepository;
import at.fhtw.tourplanner.repo.TourRepository;
import at.fhtw.tourplanner.dto.TourDto;
import at.fhtw.tourplanner.dto.TourLogDto;
import at.fhtw.tourplanner.util.NotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TourService {
  private static final Logger log = LoggerFactory.getLogger(TourService.class);
  private final TourRepository tours;
  private final TourLogRepository logs;
  private final AuthService auth;
  private final TourMapper mapper;
  private final FullTextSearchService search;
  private final OpenRouteServiceClient routeClient;

  public TourService(TourRepository tours, TourLogRepository logs, AuthService auth, TourMapper mapper,
                     FullTextSearchService search, OpenRouteServiceClient routeClient) {
    this.tours = tours;
    this.logs = logs;
    this.auth = auth;
    this.mapper = mapper;
    this.search = search;
    this.routeClient = routeClient;
  }

  @Transactional(readOnly = true)
  public List<TourDto> list(String username) {
    return tours.findByUserUsernameOrderByTitleAsc(username).stream().map(mapper::toDto).collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public List<TourDto> search(String username, String query) {
    return tours.findByUserUsernameOrderByTitleAsc(username).stream()
        .filter(tour -> search.matches(tour, query))
        .map(mapper::toDto)
        .collect(Collectors.toList());
  }

  @Transactional
  public TourDto create(String username, TourDto dto) {
    UserEntity user = auth.find(username);
    TourEntity entity = mapper.apply(dto, new TourEntity(), user);
    entity.setRoute(routeClient.enrich(entity.getRoute(), entity.getStartPoint(), entity.getEndPoint(), entity.getTransportType(), entity.isAccessible()));
    log.info("Creating tour {} for {}", entity.getTitle(), username);
    return mapper.toDto(tours.save(entity));
  }

  @Transactional
  public TourDto update(String username, String id, TourDto dto) {
    TourEntity entity = findTour(username, id);
    boolean routeNeedsRefresh = routeRelevantFieldsChanged(entity, dto);
    mapper.apply(dto, entity, entity.getUser());
    entity.setId(id);
    if (routeNeedsRefresh) {
      entity.setRoute(routeClient.enrich(entity.getRoute(), entity.getStartPoint(), entity.getEndPoint(), entity.getTransportType(), entity.isAccessible()));
    }
    log.info("Updating tour {} for {}", id, username);
    return mapper.toDto(tours.save(entity));
  }

  @Transactional
  public void delete(String username, String id) {
    tours.delete(findTour(username, id));
  }

  @Transactional
  public TourLogDto addLog(String username, String tourId, TourLogDto dto) {
    TourEntity tour = findTour(username, tourId);
    TourLogEntity log = mapper.applyLog(dto, new TourLogEntity(), tour);
    return mapper.logToDto(logs.save(log));
  }

  @Transactional
  public TourLogDto updateLog(String username, String tourId, String logId, TourLogDto dto) {
    TourLogEntity log = logs.findByIdAndTourIdAndTourUserUsername(logId, tourId, username)
        .orElseThrow(() -> new NotFoundException("Tour log not found"));
    mapper.applyLog(dto, log, log.getTour());
    log.setId(logId);
    return mapper.logToDto(logs.save(log));
  }

  @Transactional
  public void deleteLog(String username, String tourId, String logId) {
    TourLogEntity log = logs.findByIdAndTourIdAndTourUserUsername(logId, tourId, username)
        .orElseThrow(() -> new NotFoundException("Tour log not found"));
    logs.delete(log);
  }

  private TourEntity findTour(String username, String id) {
    return tours.findByIdAndUserUsername(id, username).orElseThrow(() -> new NotFoundException("Tour not found"));
  }

  private boolean routeRelevantFieldsChanged(TourEntity existing, TourDto incoming) {
    if (incoming == null) return false;
    if (incoming.category != null && incoming.category != existing.getCategory()) return true;
    if (incoming.transportType != null && incoming.transportType != existing.getTransportType()) return true;
    if (incoming.accessible != existing.isAccessible()) return true;
    if (locationChanged(existing.getStartPoint(), incoming.startPoint)) return true;
    if (locationChanged(existing.getEndPoint(), incoming.endPoint)) return true;
    int existingPoiCount = existing.getPoi() == null ? 0 : existing.getPoi().size();
    int incomingPoiCount = incoming.poi == null ? 0 : incoming.poi.size();
    if (existingPoiCount != incomingPoiCount) return true;
    for (int i = 0; i < existingPoiCount; i++) {
      if (locationChanged(existing.getPoi().get(i), incoming.poi.get(i))) return true;
    }
    return false;
  }

  private boolean locationChanged(LocationEmbeddable existing, at.fhtw.tourplanner.dto.LocationDto incoming) {
    if (existing == null || incoming == null) return existing != null || incoming != null;
    return !same(existing.getLatitude(), incoming.latitude)
        || !same(existing.getLongitude(), incoming.longitude);
  }

  private boolean same(double left, double right) {
    return Math.abs(left - right) < 0.000001;
  }
}
