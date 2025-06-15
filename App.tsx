import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreenWrapper from './Home'; // 단 하나만!
import ScheduleListScreen from './ScheduleListScreen';
import SleepRecommendScreen from './SleepRecommendScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreenWrapper} />
        <Stack.Screen name="ScheduleList" component={ScheduleListScreen} />
        <Stack.Screen name="SleepRecommend" component={SleepRecommendScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
