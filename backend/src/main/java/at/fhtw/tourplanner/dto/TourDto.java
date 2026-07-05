package at.fhtw.tourplanner.dto;

import at.fhtw.tourplanner.model.TransportType;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;

public class TourDto {
  public String id;
  public String username;
  @NotBlank(message = "Tourname darf nicht leer sein")
  public String title;
  public TransportType transportType;
  public boolean accessible;
  public boolean favorite;
  public String description;
  @Valid
  public LocationDto startPoint;
  @Valid
  public LocationDto endPoint;
  public List<LocationDto> poi = new ArrayList<>();
  @Valid
  public RouteDto route;
  public List<TourLogDto> logs = new ArrayList<>();
  public int popularity;
  public String childFriendliness;
}
