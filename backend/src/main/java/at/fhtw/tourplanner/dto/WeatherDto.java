package at.fhtw.tourplanner.dto;

public class WeatherDto {
  public boolean providerConfigured;
  public String coverageLabel;
  public String locationName;
  public String description;
  public double temperatureCelsius;
  public Double temperatureMinCelsius;
  public Double temperatureMaxCelsius;
  public double feelsLikeCelsius;
  public Double feelsLikeMinCelsius;
  public Double feelsLikeMaxCelsius;
  public int humidity;
  public double windKmh;
  public int sampleCount;
  public String clothingAdvice;
  public String message;
}
