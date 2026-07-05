package at.fhtw.tourplanner.model;

import javax.persistence.*;
import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tours")
public class TourEntity {
  @Id
  private String id;
  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  private UserEntity user;
  @NotBlank
  private String title;
  @Enumerated(EnumType.STRING)
  private TransportType transportType;
  private boolean accessible;
  private boolean favorite;
  @Column(length = 2000)
  private String description;
  @Valid
  @AttributeOverrides({
      @AttributeOverride(name = "name", column = @Column(name = "start_name")),
      @AttributeOverride(name = "latitude", column = @Column(name = "start_latitude")),
      @AttributeOverride(name = "longitude", column = @Column(name = "start_longitude"))
  })
  private LocationEmbeddable startPoint;
  @Valid
  @AttributeOverrides({
      @AttributeOverride(name = "name", column = @Column(name = "end_name")),
      @AttributeOverride(name = "latitude", column = @Column(name = "end_latitude")),
      @AttributeOverride(name = "longitude", column = @Column(name = "end_longitude"))
  })
  private LocationEmbeddable endPoint;
  @ElementCollection
  @CollectionTable(name = "tour_pois", joinColumns = @JoinColumn(name = "tour_id"))
  private List<LocationEmbeddable> poi = new ArrayList<>();
  @Valid
  private RouteEmbeddable route = new RouteEmbeddable();
  @OneToMany(mappedBy = "tour", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<TourLogEntity> logs = new ArrayList<>();

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public UserEntity getUser() { return user; }
  public void setUser(UserEntity user) { this.user = user; }
  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }
  public TransportType getTransportType() { return transportType; }
  public void setTransportType(TransportType transportType) { this.transportType = transportType; }
  public boolean isAccessible() { return accessible; }
  public void setAccessible(boolean accessible) { this.accessible = accessible; }
  public boolean isFavorite() { return favorite; }
  public void setFavorite(boolean favorite) { this.favorite = favorite; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public LocationEmbeddable getStartPoint() { return startPoint; }
  public void setStartPoint(LocationEmbeddable startPoint) { this.startPoint = startPoint; }
  public LocationEmbeddable getEndPoint() { return endPoint; }
  public void setEndPoint(LocationEmbeddable endPoint) { this.endPoint = endPoint; }
  public List<LocationEmbeddable> getPoi() { return poi; }
  public void setPoi(List<LocationEmbeddable> poi) { this.poi = poi; }
  public RouteEmbeddable getRoute() { return route; }
  public void setRoute(RouteEmbeddable route) { this.route = route; }
  public List<TourLogEntity> getLogs() { return logs; }
  public void setLogs(List<TourLogEntity> logs) { this.logs = logs; }
}
