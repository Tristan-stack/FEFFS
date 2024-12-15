import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { View, Text, Image, StyleSheet, Pressable, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Collapsible } from "@/components/Collapsible";

export default function Event() {
  const colorScheme = useColorScheme();

  const [eventsWithShowtimes, setEventsWithShowtimes] = useState<any[]>([]);
  const [hasError, setHasError] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<boolean>(false);

  useEffect(() => {
    const fetchEventsAndShowtimes = async () => {
      try {
        const eventsResponse = await fetch("https://feffs.elioooooo.fr/event/get/");
        const eventsData = await eventsResponse.json();

        const showtimesResponse = await fetch("https://feffs.elioooooo.fr/showtime/get/");
        const showtimesData = await showtimesResponse.json();

        // Combine et regroupe les showtimes selon leurs événements
        const combinedData = eventsData.map((event: any) => {
          return {
            ...event,
            showtimes: showtimesData.filter((showtime: any) => showtime.event === event._id),
          };
        });

        setEventsWithShowtimes(combinedData);
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
      }
    };

    fetchEventsAndShowtimes();
  }, []);

  const handleAdd = async (eventId: string) => {
    try {
      console.log("Add event to personal calendar...");
      const userEmail = await AsyncStorage.getItem("email");
      if (!userEmail) throw new Error("Vous devez être connecté pour ajouter un évènement à votre programme");

      const userIdResponse = await fetch("https://feffs.elioooooo.fr/user/get/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const userIdData = await userIdResponse.json();
      const userId = userIdData.userId;

      const userProgramResponse = await fetch("https://feffs.elioooooo.fr/program/get/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      let userProgramId;
      if (userProgramResponse.status === 200) {
        const userProgramData = await userProgramResponse.json();
        userProgramId = userProgramData._id;
      } else if (userProgramResponse.status === 404) {
        const newProgramResponse = await fetch("https://feffs.elioooooo.fr/program/add/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        });

        const newProgramData = await newProgramResponse.json();
        await AsyncStorage.setItem("program", JSON.stringify(newProgramData));
        userProgramId = newProgramData._id;
      }

      if (userProgramId) {
        const addEventResponse = await fetch(`https://feffs.elioooooo.fr/program/add-event/${userProgramId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ event: eventId }),
        });

        if (addEventResponse.status === 200) {
          setError("Évènement ajouté au programme avec succès");
        } else {
          throw new Error("Erreur lors de l'ajout du programme");
        }
      } else {
        throw new Error("Programme personnel introuvable");
      }
    } catch (error: any) {
      setError(error.message);
    }
    setHasError(true);
    setNotification(true);
  };

  return (
    <>
      {notification && (
        <View style={{ width: "100%", padding: 10, position: "absolute" }}>
          <View
            style={[
              styles.notification,
              {
                zIndex: 20,
                backgroundColor: Colors[colorScheme ?? "light"].background,
              },
            ]}
          >
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "space-between",
                width: "100%",
                gap: 20,
                flex: 1,
              }}
            >
              <View style={{ display: "flex", alignItems: "flex-start", flex: 1 }}>
                {error && error.startsWith("Erreur") ? (
                  <Text
                    style={[
                      styles.message,
                      { color: Colors[colorScheme ?? "light"].texterror, flex: 1 },
                    ]}
                  >
                    Erreur...
                  </Text>
                ) : (
                  <Text
                    style={[
                      styles.message,
                      { color: Colors[colorScheme ?? "light"].textsuccess, flex: 1 },
                    ]}
                  >
                    Succès !
                  </Text>
                )}
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 5,
                    flex: 1,
                  }}
                >
                  {error && error.startsWith("Erreur") ? (
                    <IconSymbol
                      name="error.fill"
                      size={16}
                      color={Colors[colorScheme ?? "light"].texterror}
                    />
                  ) : (
                    <IconSymbol
                      name="checkmark"
                      size={16}
                      color={Colors[colorScheme ?? "light"].textsuccess}
                    />
                  )}
                  <Text
                    style={[
                      styles.message,
                      { color: Colors[colorScheme ?? "light"].text, flex: 1, textAlign: "left" },
                    ]}
                  >
                    {error}
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => setNotification(false)}>
                <Text
                  style={[
                    styles.message,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  ✖
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
      <View style={{ marginTop: 64, marginBottom: 36, paddingHorizontal: 20 }}>
        <View style={{
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
        }}>
          <View style={styles.logoContainer}>
            <Image
              style={styles.logo}
              source={require("@/assets/images/logo.png")}
            />
          </View>
          <View style={{ justifyContent: "center" }}>
            <Text
              style={[
                styles.welcomeText,
                { color: Colors[colorScheme ?? "light"].headerText },
              ]}
            >
              Consultez
            </Text>
            <Text
              style={[
                styles.titleText,
                { color: Colors[colorScheme ?? "light"].headerText },
              ]}
            >
              Les évènements disponibles
            </Text>
          </View>
        </View>
      </View>

      <View>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {eventsWithShowtimes.length > 0 ? (
            eventsWithShowtimes.map((event) => (
              <View key={event._id} style={[styles.eventContainer, { borderBottomColor: Colors[colorScheme ?? 'light'].dateTagBg , }, { backgroundColor: Colors[colorScheme ?? 'light'].cardDarkBg }]}>
                <Text style={[{ fontWeight: 'bold', fontSize: 20, textAlign: "center", marginBottom: 10 } , { color: Colors[colorScheme ?? 'light'].text }]}>
                  {event.title}
                </Text>
                <Image
                  source={require('@/assets/images/bandeau-1.png')}
                  style={{ width: '100%', height: 200, marginBottom: 10, borderColor: 'transparent' }}
                />
                <View>
                  <Text style={[{ fontWeight: 'bold', fontSize: 18, textAlign: "left", marginBottom: 5, marginTop: 5,  }, { color: Colors[colorScheme ?? 'light'].text }]}>Description :</Text>
                  <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>{event.description}</Text>
                </View>
                <View>
                  <Text style={[{ fontWeight: 'bold', fontSize: 18, textAlign: "left", marginBottom: 5, marginTop: 5,  }, { color: Colors[colorScheme ?? 'light'].text }]}>Durée :</Text>
                  <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>{event.duration} minutes</Text>
                </View>
                <Text style={[{ fontWeight: 'bold', fontSize: 18, textAlign: "left", marginBottom: 5, marginTop: 5,  }, { color: Colors[colorScheme ?? 'light'].text }]}>Séances :</Text>
                {event.showtimes.length > 0 ? (
                  event.showtimes.map((showtime) => (
                    <View key={showtime._id} style={[styles.showtimeContainer, { borderColor: Colors[colorScheme ?? 'light'].dateTagBg }]}>
                      <Text style={[{ fontWeight: 'bold' }, { color: Colors[colorScheme ?? 'light'].text }]}>
                        Date : {new Date(showtime.date).toLocaleString()}
                      </Text>
                      <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>
                        Lieu: {showtime.localisation}
                      </Text>
                      <Pressable onPress={() => handleAdd(showtime._id)} style={[styles.addButton, { backgroundColor: Colors[colorScheme ?? 'light'].dateTagBg }]}>
                        <Text style={[styles.buyButtonText, { color: Colors[colorScheme ?? 'light'].dateTagText }]}>
                          Ajouter au planning
                        </Text>
                      </Pressable>
                    </View>
                  ))
                ) : 
                  <Text style={ { color: Colors[colorScheme ?? 'light'].text }}>Aucune séance à afficher</Text>
              }
              </View>
            ))
          ) : (
            <Text style={{ color: Colors[colorScheme ?? "light"].text }}>
              Aucun évènement disponible
            </Text>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    height: 40,
    width: 40,
    borderRadius: 20,
    marginRight: 12,
    boxShadow: "0px 0px 80px rgba(255, 255, 255, 1)",
  },
  logo: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  welcomeText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "bold",
  },
  titleText: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "bold",
  },
  notification: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-end",
    padding: 10,
    width: "95%",
    borderRadius: 5,
    left: 0,
    marginTop: 50,
    marginLeft: "auto",
    marginRight: "auto",
    zIndex: 20,
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  button: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    borderRadius: 5,
    alignSelf: "center",
    width: "auto",
  },
  addButton: {
    backgroundColor: "transparent",
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "transparent",
    marginBottom: 10,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventInfos: {
    backgroundColor: "transparent",
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#d35446",
    marginTop: 0,
    marginBottom: 10,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  eventContainer: {
    marginBottom: 20,
    borderBottomWidth: 3,
    paddingBottom: 10,
    marginRight: 10,
    marginLeft: 10,
    paddingTop: 10,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 8,
  },
  showtimeContainer: {
    marginTop: 10,
    paddingLeft: 10,
    paddingBottom: 10,
    paddingTop: 10,
    paddingRight: 10,
    borderWidth: 2,
    borderRadius: 5,
  },
});