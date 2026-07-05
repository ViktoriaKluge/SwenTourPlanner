package at.fhtw.tourplanner.controller;

import at.fhtw.tourplanner.dto.TourDto;
import at.fhtw.tourplanner.service.TourService;
import at.fhtw.tourplanner.util.BadRequestException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.security.Principal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TourControllerImportTest {

  @Mock private TourService tours;
  @Mock private Principal principal;

  private TourController controller() {
    return new TourController(tours);
  }

  @Test void importTours_withPreExistingId_clearsIdBeforeCreate() {
    when(principal.getName()).thenReturn("bob");
    TourDto dto = new TourDto();
    dto.id = "tour-from-alice";
    dto.title = "Imported tour";

    controller().importTours(principal, new ArrayList<>(Collections.singletonList(dto)));

    ArgumentCaptor<TourDto> captor = ArgumentCaptor.forClass(TourDto.class);
    verify(tours).create(eq("bob"), captor.capture());
    assertNull(captor.getValue().id);
  }

  @Test void importTours_moreThan100Tours_throwsBadRequestAndSkipsCreate() {
    when(principal.getName()).thenReturn("bob");
    List<TourDto> imported = new ArrayList<>();
    for (int i = 0; i < 101; i++) {
      imported.add(new TourDto());
    }

    assertThrows(BadRequestException.class, () -> controller().importTours(principal, imported));
    verify(tours, never()).create(any(), any());
  }

  @Test void importTours_exactly100Tours_isAllowed() {
    when(principal.getName()).thenReturn("bob");
    when(tours.list("bob")).thenReturn(new ArrayList<>());
    List<TourDto> imported = new ArrayList<>();
    for (int i = 0; i < 100; i++) {
      imported.add(new TourDto());
    }

    controller().importTours(principal, imported);

    verify(tours, times(100)).create(eq("bob"), any());
  }
}
