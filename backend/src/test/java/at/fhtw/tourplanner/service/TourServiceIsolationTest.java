package at.fhtw.tourplanner.service;

import at.fhtw.tourplanner.dto.TourDto;
import at.fhtw.tourplanner.dto.TourLogDto;
import at.fhtw.tourplanner.repo.TourLogRepository;
import at.fhtw.tourplanner.repo.TourRepository;
import at.fhtw.tourplanner.util.NotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TourServiceIsolationTest {

  @Mock private TourRepository tours;
  @Mock private TourLogRepository logs;
  @Mock private AuthService auth;
  @Mock private TourMapper mapper;
  @Mock private FullTextSearchService search;
  @Mock private OpenRouteServiceClient routeClient;

  private TourService service() {
    return new TourService(tours, logs, auth, mapper, search, routeClient);
  }

  @Test void get_tourBelongsToOtherUser_throwsNotFound() {
    when(tours.findByIdAndUserUsername("tour-1", "eve")).thenReturn(Optional.empty());

    assertThrows(NotFoundException.class, () -> service().get("eve", "tour-1"));
  }

  @Test void update_tourBelongsToOtherUser_throwsNotFound() {
    when(tours.findByIdAndUserUsername("tour-1", "eve")).thenReturn(Optional.empty());

    assertThrows(NotFoundException.class, () -> service().update("eve", "tour-1", new TourDto()));
    verify(tours, never()).save(any());
  }

  @Test void delete_tourBelongsToOtherUser_throwsNotFound() {
    when(tours.findByIdAndUserUsername("tour-1", "eve")).thenReturn(Optional.empty());

    assertThrows(NotFoundException.class, () -> service().delete("eve", "tour-1"));
    verify(tours, never()).delete(any());
  }

  @Test void updateLog_logBelongsToOtherUser_throwsNotFound() {
    when(logs.findByIdAndTourIdAndTourUserUsername("log-1", "tour-1", "eve")).thenReturn(Optional.empty());

    assertThrows(NotFoundException.class, () -> service().updateLog("eve", "tour-1", "log-1", new TourLogDto()));
    verify(logs, never()).save(any());
  }

  @Test void deleteLog_logBelongsToOtherUser_throwsNotFound() {
    when(logs.findByIdAndTourIdAndTourUserUsername("log-1", "tour-1", "eve")).thenReturn(Optional.empty());

    assertThrows(NotFoundException.class, () -> service().deleteLog("eve", "tour-1", "log-1"));
    verify(logs, never()).delete(any());
  }
}
