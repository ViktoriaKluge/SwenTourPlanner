package at.fhtw.tourplanner.service;

import at.fhtw.tourplanner.config.AppProperties;
import at.fhtw.tourplanner.dto.TourDto;
import at.fhtw.tourplanner.dto.WeatherDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class WeatherServiceTest {

  private WeatherService service(String apiKey) {
    AppProperties properties = new AppProperties();
    properties.getOpenWeather().setApiKey(apiKey);
    return new WeatherService(properties, new ObjectMapper());
  }

  @Test void currentWeather_noApiKeyConfigured_returnsUnconfiguredDto() {
    WeatherDto dto = service(null).currentWeather(48.2, 16.3);

    assertFalse(dto.providerConfigured);
    assertEquals("OPENWEATHER_API_KEY ist nicht gesetzt.", dto.message);
  }

  @Test void tourWeather_noApiKeyConfigured_returnsUnconfiguredDto() {
    WeatherDto dto = service(null).tourWeather(new TourDto());

    assertFalse(dto.providerConfigured);
    assertEquals("OPENWEATHER_API_KEY ist nicht gesetzt.", dto.message);
  }

  @Test void tourWeather_noCoordinatesAvailable_returnsFailedDtoWithoutNetworkCall() {
    TourDto tour = new TourDto();
    tour.title = "Tour ohne Koordinaten";

    WeatherDto dto = service("dummy-key").tourWeather(tour);

    assertFalse(dto.providerConfigured);
    assertEquals("Bitte Wetter manuell pruefen.", dto.clothingAdvice);
  }

  @Test void clothingAdvice_veryCold_recommendsWarmClothing() {
    assertEquals("Sehr warm anziehen.", service("k").clothingAdvice(2, 0, ""));
  }

  @Test void clothingAdvice_mild_recommendsLightJacket() {
    assertEquals("Leichte Jacke reicht meist.", service("k").clothingAdvice(15, 0, ""));
  }

  @Test void clothingAdvice_hot_recommendsLightClothing() {
    assertEquals("Sehr leicht kleiden und genug trinken.", service("k").clothingAdvice(30, 0, ""));
  }

  @Test void clothingAdvice_rainInDescription_addsRainWarning() {
    assertEquals("Leichte Jacke reicht meist, Regenschutz mitnehmen.", service("k").clothingAdvice(15, 0, "Regenschauer"));
  }

  @Test void clothingAdvice_strongWind_addsWindWarning() {
    assertEquals("Leichte Jacke reicht meist, winddichte Schicht empfohlen.", service("k").clothingAdvice(15, 35, ""));
  }
}
