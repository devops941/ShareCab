import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, Image, Pressable, SafeAreaView, StatusBar } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();

  const handlePress = () => {
    router.push('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#064332" />
      <Pressable style={styles.pressable} onPress={handlePress}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/sharecab_logo.jpg')} 
            style={styles.logoImage} 
            resizeMode="contain"
          />
          <Text style={styles.logoText}>
            <Text style={styles.logoTextWhite}>Share</Text>
            <Text style={styles.logoTextGreen}>Cab</Text>
          </Text>
        </View>

        <View style={styles.taglineContainer}>
          <Text style={styles.taglineText}>Share Rides</Text>
          <Text style={styles.taglineText}>Save Cost</Text>
          <Text style={styles.taglineText}>Travel Together</Text>
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#064332',
  },
  pressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoImage: {
    width: 200,
    height: 200,
    borderRadius: 40,
    marginBottom: 20,
  },
  logoText: {
    fontSize: 42,
    fontWeight: 'bold',
  },
  logoTextWhite: {
    color: '#FFFFFF',
  },
  logoTextGreen: {
    color: '#00D166',
  },
  taglineContainer: {
    alignItems: 'center',
    gap: 8,
  },
  taglineText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
  },
});
