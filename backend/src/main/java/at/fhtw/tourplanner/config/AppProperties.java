package at.fhtw.tourplanner.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {
  private final OpenRouteService openRouteService = new OpenRouteService();
  private final OpenWeather openWeather = new OpenWeather();

  public OpenRouteService getOpenRouteService() { return openRouteService; }
  public OpenWeather getOpenWeather() { return openWeather; }

  public static class OpenRouteService {
    private String apiKey;
    private String baseUrl;

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
  }

  public static class OpenWeather {
    private String apiKey;
    private String baseUrl;

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
  }
}
