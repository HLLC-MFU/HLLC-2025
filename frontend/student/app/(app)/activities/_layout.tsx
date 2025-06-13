import { createSharedElementStackNavigator, SharedElementSceneComponent } from 'react-navigation-shared-element';
import ActivitiesPage from '.';
import ActivityDetailPage from './[id]';
const Stack = createSharedElementStackNavigator();

export default function Layout() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        presentation: 'transparentModal', // or 'modal' if you want it with backdrop
        cardStyleInterpolator: ({ current: { progress } }) => ({
          cardStyle: {
            transform: [
              {
                scale: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                  extrapolate: 'clamp',
                }),
              },
            ],
            opacity: progress,
          },
        }),
        transitionSpec: {
          open: { animation: 'timing', config: { duration: 300 } },
          close: { animation: 'timing', config: { duration: 200 } },
        },
      }}
    >

      <Stack.Screen name="index" component={ActivitiesPage} options={
        {
          headerShown: false,
          animation: 'fade_from_bottom',
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }
      } />
      <Stack.Screen
        name="[id]"
        component={ActivityDetailPage as SharedElementSceneComponent<any>}
        sharedElements={(route) => {
          const { id } = route.params;
          return [`activity-image-${id}`];
        }}
        options={{
          headerShown: false,
          // ✅ Apple-style zoom/fade effect
          cardStyleInterpolator: ({
            current: { progress },
          }: import('@react-navigation/stack').StackCardInterpolationProps) => ({
            cardStyle: {
              opacity: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
              transform: [
                {
                  scale: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1], // Zoom in
                  }),
                },
              ],
            },
          }),
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 250,
              },
            },
          },
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      />

    </Stack.Navigator>
  );
}
