import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { api } from "../../../src/services/api";
import { getSocket } from "../../../src/services/socket";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  borderRadius,
  shadows,
} from "../../../src/utils/theme";

interface Place {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  photoUrl?: string;
  rating?: number;
  priceLevel?: number;
}

interface PlaceSuggestion {
  id: string;
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  photoUrl?: string;
  rating?: number;
  priceLevel?: number;
  suggestedBy: { id: string; name: string };
  userVote: "LOVE" | "LIKE" | "NEUTRAL" | "DISLIKE" | null;
  otherVote: "LOVE" | "LIKE" | "NEUTRAL" | "DISLIKE" | null;
}

interface PlacesData {
  enabled: boolean;
  bothHaveLocation: boolean;
  inSameCity: boolean;
  suggestions: PlaceSuggestion[];
  agreedPlace: { id: string; name: string; address: string } | null;
  progress: number;
}

export default function PlacesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [placesData, setPlacesData] = useState<PlacesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    "restaurant" | "cafe" | "bar"
  >("restaurant");
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  useEffect(() => {
    requestLocationPermission();
    loadPlacesData();

    // Socket events
    const socket = getSocket();
    socket?.on("place:suggested", handlePlaceSuggested);
    socket?.on("place:voted", handlePlaceVoted);
    socket?.on("place:agreed", handlePlaceAgreed);

    return () => {
      socket?.off("place:suggested", handlePlaceSuggested);
      socket?.off("place:voted", handlePlaceVoted);
      socket?.off("place:agreed", handlePlaceAgreed);
    };
  }, [id]);

  const requestLocationPermission = async () => {
    setIsRequestingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        // Reverse-geocode to get city name
        let locationName = "Ubicación actual";
        try {
          const [geo] = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          if (geo) {
            locationName = [geo.city || geo.subregion, geo.country]
              .filter(Boolean)
              .join(", ");
          }
        } catch {
          // ignore geocode errors, fallback name is fine
        }

        await api.put("/places/location", {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          location: locationName,
        });

        // Reload so the UI reflects the updated status
        await loadPlacesData();
      } else {
        Alert.alert(
          "Ubicación deshabilitada",
          "Necesitamos tu ubicación para sugerir lugares cercanos",
        );
      }
    } catch (error) {
      console.error("Error requesting location:", error);
      Alert.alert("Error", "No se pudo obtener tu ubicación");
    } finally {
      setIsRequestingLocation(false);
    }
  };

  const loadPlacesData = async () => {
    try {
      const response = await api.get(`/places/${id}`);
      setPlacesData(response.data);
    } catch (error) {
      console.error("Error loading places data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceSuggested = (data: any) => {
    if (data.connectionId === id) {
      loadPlacesData();
    }
  };

  const handlePlaceVoted = (data: any) => {
    if (data.connectionId === id) {
      loadPlacesData();
    }
  };

  const handlePlaceAgreed = (data: any) => {
    if (data.connectionId === id) {
      Alert.alert("¡Tienen un lugar! 🎉", `Ambos amaron ${data.place.name}!`, [
        { text: "Genial!", onPress: loadPlacesData },
      ]);
    }
  };

  const searchPlaces = async () => {
    setIsSearching(true);
    try {
      const response = await api.get(`/places/${id}/search`, {
        params: { type: selectedCategory },
      });
      setSearchResults(response.data.places);
    } catch (error) {
      console.error("Error searching places:", error);
      Alert.alert("Error", "No se pudieron buscar lugares");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestPlace = async (place: Place) => {
    try {
      await api.post(`/places/${id}/suggest`, {
        placeId: place.placeId,
      });
      Alert.alert("Sugerido", `Has sugerido ${place.name}`);
      setSearchResults([]);
      loadPlacesData();
    } catch (error: any) {
      console.error("Error suggesting place:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error || "No se pudo sugerir el lugar",
      );
    }
  };

  const handleVote = async (
    suggestionId: string,
    vote: "LOVE" | "LIKE" | "NEUTRAL" | "DISLIKE",
  ) => {
    try {
      await api.post(`/places/suggestions/${suggestionId}/vote`, { vote });
      loadPlacesData();
    } catch (error) {
      console.error("Error voting:", error);
      Alert.alert("Error", "No se pudo votar");
    }
  };

  const getVoteEmoji = (vote: string | null) => {
    switch (vote) {
      case "LOVE":
        return "❤️";
      case "LIKE":
        return "👍";
      case "NEUTRAL":
        return "😐";
      case "DISLIKE":
        return "👎";
      default:
        return "❓";
    }
  };

  const getPriceLevel = (level?: number) => {
    if (!level) return "";
    return "$".repeat(level);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            title: "Lugares",
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!placesData) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: "Lugares",
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <Text style={styles.errorText}>Error al cargar datos</Text>
      </SafeAreaView>
    );
  }

  if (!placesData.enabled) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: "Lugares",
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.disabledContainer}>
          <Ionicons
            name="location-outline"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={styles.disabledTitle}>Lugares no disponibles</Text>
          {!placesData.bothHaveLocation && (
            <Text style={styles.disabledText}>
              Ambos necesitan habilitar su ubicación para usar esta función
            </Text>
          )}
          {placesData.bothHaveLocation && !placesData.inSameCity && (
            <Text style={styles.disabledText}>
              Deben estar en la misma ciudad (menos de 50km de distancia) para
              sugerir lugares
            </Text>
          )}
          <TouchableOpacity
            style={[
              styles.enableButton,
              isRequestingLocation && { opacity: 0.7 },
            ]}
            onPress={requestLocationPermission}
            disabled={isRequestingLocation}
          >
            {isRequestingLocation ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.enableButtonText}>Habilitar Ubicación</Text>
            )}
          </TouchableOpacity>
          {placesData.bothHaveLocation && !placesData.inSameCity && (
            <Text
              style={[
                styles.disabledText,
                {
                  marginTop: spacing.sm,
                  fontSize: fontSize.sm,
                  color: colors.textMuted ?? colors.textSecondary,
                },
              ]}
            >
              ¡Tu ubicación fue guardada! Estás esperando que la otra persona
              también la habilite o que estén en la misma ciudad.
            </Text>
          )}
          {!placesData.bothHaveLocation && userLocation && (
            <Text
              style={[
                styles.disabledText,
                {
                  marginTop: spacing.sm,
                  fontSize: fontSize.sm,
                  color: colors.success,
                },
              ]}
            >
              ✓ Tu ubicación fue guardada. Esperando a la otra persona...
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Lugares",
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress indicator */}
        {placesData.agreedPlace && (
          <View style={styles.agreedCard}>
            <Text style={styles.agreedEmoji}>🎉</Text>
            <Text style={styles.agreedTitle}>¡Tienen un lugar acordado!</Text>
            <Text style={styles.agreedPlace}>
              {placesData.agreedPlace.name}
            </Text>
            <Text style={styles.agreedAddress}>
              {placesData.agreedPlace.address}
            </Text>
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>+5% Progreso</Text>
            </View>
          </View>
        )}

        {/* Search section */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Buscar Lugares</Text>
          <Text style={styles.sectionDescription}>
            Encuentra restaurantes, cafés o bares para su primera cita
          </Text>

          <View style={styles.categoryButtons}>
            {(["restaurant", "cafe", "bar"] as const).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  selectedCategory === cat && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === cat && styles.categoryButtonTextActive,
                  ]}
                >
                  {cat === "restaurant" && "🍽️ Restaurante"}
                  {cat === "cafe" && "☕ Café"}
                  {cat === "bar" && "🍹 Bar"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.searchButton}
            onPress={searchPlaces}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.searchButtonText}>Buscar</Text>
            )}
          </TouchableOpacity>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>
                Resultados ({searchResults.length})
              </Text>
              {searchResults.map((place) => (
                <View key={place.placeId} style={styles.resultCard}>
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{place.name}</Text>
                    <Text style={styles.resultAddress}>{place.address}</Text>
                    <View style={styles.resultMeta}>
                      {place.rating && (
                        <Text style={styles.resultRating}>
                          ⭐ {place.rating.toFixed(1)}
                        </Text>
                      )}
                      {place.priceLevel && (
                        <Text style={styles.resultPrice}>
                          {getPriceLevel(place.priceLevel)}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.suggestButton}
                    onPress={() => handleSuggestPlace(place)}
                  >
                    <Text style={styles.suggestButtonText}>Sugerir</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Suggestions section */}
        {placesData.suggestions.length > 0 && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.sectionTitle}>Lugares Sugeridos</Text>
            {placesData.suggestions.map((suggestion) => (
              <View key={suggestion.id} style={styles.suggestionCard}>
                <View style={styles.suggestionHeader}>
                  <View>
                    <Text style={styles.suggestionName}>{suggestion.name}</Text>
                    <Text style={styles.suggestionAddress}>
                      {suggestion.address}
                    </Text>
                  </View>
                  <Text style={styles.suggestedBy}>
                    Por {suggestion.suggestedBy.name}
                  </Text>
                </View>

                {suggestion.rating && (
                  <Text style={styles.suggestionRating}>
                    ⭐ {suggestion.rating.toFixed(1)}
                    {suggestion.priceLevel &&
                      ` • ${getPriceLevel(suggestion.priceLevel)}`}
                  </Text>
                )}

                {/* Vote buttons */}
                <View style={styles.voteButtons}>
                  {(["LOVE", "LIKE", "NEUTRAL", "DISLIKE"] as const).map(
                    (vote) => (
                      <TouchableOpacity
                        key={vote}
                        style={[
                          styles.voteButton,
                          suggestion.userVote === vote &&
                            styles.voteButtonActive,
                        ]}
                        onPress={() => handleVote(suggestion.id, vote)}
                      >
                        <Text style={styles.voteEmoji}>
                          {getVoteEmoji(vote)}
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </View>

                {/* Show other user's vote if they've voted */}
                {suggestion.otherVote && (
                  <View style={styles.otherVote}>
                    <Text style={styles.otherVoteText}>
                      Su voto: {getVoteEmoji(suggestion.otherVote)}
                    </Text>
                  </View>
                )}

                {/* Show agreement badge if both voted LOVE */}
                {suggestion.userVote === "LOVE" &&
                  suggestion.otherVote === "LOVE" && (
                    <View style={styles.agreedBadge}>
                      <Text style={styles.agreedBadgeText}>
                        ¡Ambos aman este lugar! 💕
                      </Text>
                    </View>
                  )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  disabledContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  disabledTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  disabledText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  enableButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xl,
  },
  enableButtonText: {
    color: "white",
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.error,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  agreedCard: {
    backgroundColor: colors.success,
    padding: spacing.lg,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    ...shadows.md,
  },
  agreedEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  agreedTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: "white",
    marginBottom: spacing.xs,
  },
  agreedPlace: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: "white",
    marginBottom: spacing.xs,
  },
  agreedAddress: {
    fontSize: fontSize.sm,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  progressBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },
  progressBadgeText: {
    color: "white",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  searchSection: {
    padding: spacing.lg,
    backgroundColor: colors.backgroundCard,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  categoryButtons: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
  },
  categoryButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  categoryButtonText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  categoryButtonTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  searchButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  searchButtonText: {
    color: "white",
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  resultsContainer: {
    marginTop: spacing.lg,
  },
  resultsTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  resultCard: {
    flexDirection: "row",
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    alignItems: "center",
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  resultAddress: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  resultMeta: {
    flexDirection: "row",
    gap: spacing.md,
  },
  resultRating: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  resultPrice: {
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: fontWeight.semibold,
  },
  suggestButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  suggestButtonText: {
    color: "white",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  suggestionsSection: {
    padding: spacing.lg,
  },
  suggestionCard: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  suggestionHeader: {
    marginBottom: spacing.md,
  },
  suggestionName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  suggestionAddress: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  suggestedBy: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginTop: spacing.xs,
  },
  suggestionRating: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing.md,
  },
  voteButtons: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  voteButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.background,
  },
  voteButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  voteEmoji: {
    fontSize: 24,
  },
  otherVote: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  otherVoteText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  agreedBadge: {
    backgroundColor: colors.success,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  agreedBadgeText: {
    color: "white",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
