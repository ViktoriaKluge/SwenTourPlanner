package at.fhtw.tourplanner.controller;

import at.fhtw.tourplanner.service.TourService;
import at.fhtw.tourplanner.dto.TourDto;
import at.fhtw.tourplanner.dto.TourLogDto;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/tours")
@CrossOrigin
public class TourController {
  private final TourService tours;

  public TourController(TourService tours) {
    this.tours = tours;
  }

  @GetMapping
  public List<TourDto> list(@RequestHeader("X-User") String username) {
    return tours.list(username);
  }

  @GetMapping("/search")
  public List<TourDto> search(@RequestHeader("X-User") String username, @RequestParam String q) {
    return tours.search(username, q);
  }

  @PostMapping
  public TourDto create(@RequestHeader("X-User") String username, @Valid @RequestBody TourDto dto) {
    return tours.create(username, dto);
  }

  @PutMapping("/{id}")
  public TourDto update(@RequestHeader("X-User") String username, @PathVariable String id, @Valid @RequestBody TourDto dto) {
    return tours.update(username, id, dto);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@RequestHeader("X-User") String username, @PathVariable String id) {
    tours.delete(username, id);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{tourId}/logs")
  public TourLogDto addLog(@RequestHeader("X-User") String username, @PathVariable String tourId, @Valid @RequestBody TourLogDto dto) {
    return tours.addLog(username, tourId, dto);
  }

  @PutMapping("/{tourId}/logs/{logId}")
  public TourLogDto updateLog(@RequestHeader("X-User") String username, @PathVariable String tourId,
                              @PathVariable String logId, @Valid @RequestBody TourLogDto dto) {
    return tours.updateLog(username, tourId, logId, dto);
  }

  @DeleteMapping("/{tourId}/logs/{logId}")
  public ResponseEntity<Void> deleteLog(@RequestHeader("X-User") String username, @PathVariable String tourId,
                                        @PathVariable String logId) {
    tours.deleteLog(username, tourId, logId);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/export")
  public ResponseEntity<List<TourDto>> exportTours(@RequestParam String username) {
    List<TourDto> dtos = tours.list(username);
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
  public ResponseEntity<List<TourDto>> exportTour(@PathVariable String id, @RequestParam String username) {
    TourDto dto = tours.get(username, id);
    dto.id = null;
    dto.username = null;
    dto.favorite = false;
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=tour-export.json")
        .body(Collections.singletonList(dto));
  }

  @PostMapping("/import")
  public List<TourDto> importTours(@RequestHeader("X-User") String username, @RequestBody List<TourDto> imported) {
    imported.forEach(dto -> {
      dto.id = null;
      tours.create(username, dto);
    });
    return tours.list(username);
  }
}
