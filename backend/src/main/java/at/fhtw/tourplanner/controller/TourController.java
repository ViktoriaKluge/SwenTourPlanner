package at.fhtw.tourplanner.controller;

import at.fhtw.tourplanner.service.TourService;
import at.fhtw.tourplanner.dto.TourDto;
import at.fhtw.tourplanner.dto.TourLogDto;
import at.fhtw.tourplanner.util.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.security.Principal;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/tours")
@CrossOrigin(origins = "http://localhost:4200")
public class TourController {
  private static final Logger log = LoggerFactory.getLogger(TourController.class);
  private final TourService tours;

  public TourController(TourService tours) {
    this.tours = tours;
  }

  @GetMapping
  public List<TourDto> list(Principal principal) {
    return tours.list(principal.getName());
  }

  @GetMapping("/search")
  public List<TourDto> search(Principal principal, @RequestParam String q) {
    return tours.search(principal.getName(), q);
  }

  @PostMapping
  public TourDto create(Principal principal, @Valid @RequestBody TourDto dto) {
    return tours.create(principal.getName(), dto);
  }

  @PutMapping("/{id}")
  public TourDto update(Principal principal, @PathVariable String id, @Valid @RequestBody TourDto dto) {
    return tours.update(principal.getName(), id, dto);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(Principal principal, @PathVariable String id) {
    tours.delete(principal.getName(), id);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{tourId}/logs")
  public TourLogDto addLog(Principal principal, @PathVariable String tourId, @Valid @RequestBody TourLogDto dto) {
    return tours.addLog(principal.getName(), tourId, dto);
  }

  @PutMapping("/{tourId}/logs/{logId}")
  public TourLogDto updateLog(Principal principal, @PathVariable String tourId,
                              @PathVariable String logId, @Valid @RequestBody TourLogDto dto) {
    return tours.updateLog(principal.getName(), tourId, logId, dto);
  }

  @DeleteMapping("/{tourId}/logs/{logId}")
  public ResponseEntity<Void> deleteLog(Principal principal, @PathVariable String tourId,
                                        @PathVariable String logId) {
    tours.deleteLog(principal.getName(), tourId, logId);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/export")
  public ResponseEntity<List<TourDto>> exportTours(Principal principal) {
    List<TourDto> dtos = tours.list(principal.getName());
    dtos.forEach(dto -> {
      dto.id = null;
      dto.username = null;
      dto.favorite = false;
    });
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=tour-export.json")
        .body(dtos);
  }

  @GetMapping("/{id}/export")
  public ResponseEntity<List<TourDto>> exportTour(Principal principal, @PathVariable String id) {
    TourDto dto = tours.get(principal.getName(), id);
    dto.id = null;
    dto.username = null;
    dto.favorite = false;
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=tour-export.json")
        .body(Collections.singletonList(dto));
  }

  @PostMapping("/import")
  public List<TourDto> importTours(Principal principal, @RequestBody List<TourDto> imported) {
    if (imported.size() > 100) {
      log.warn("Import rejected for user {}: {} tours exceeds the limit", principal.getName(), imported.size());
      throw new BadRequestException("Maximal 100 Touren pro Import erlaubt.");
    }
    imported.forEach(dto -> {
      dto.id = null;
      tours.create(principal.getName(), dto);
    });
    return tours.list(principal.getName());
  }
}
