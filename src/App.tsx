import 'react-native-gesture-handler'; // Must be at the top!
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RunAnywhere, SDKEnvironment } from '@runanywhere/core';
import { ModelServiceProvider, registerDefaultModels } from './services/ModelService';
import { AppColors } from './theme';

import { HomeScreen, InteractionScreen, SavedNotesScreen } from './screens';
import { RootStackParamList } from './navigation/types';
import { NotesProvider } from '../src/context/NotesContext';

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        await RunAnywhere.initialize({
          environment: SDKEnvironment.Development,
        });

        const { LlamaCPP } = await import('@runanywhere/llamacpp');
        const { ONNX } = await import('@runanywhere/onnx');

        LlamaCPP.register();
        ONNX.register();

        await registerDefaultModels();

        console.log('RunAnywhere SDK initialized successfully');
      } catch (error) {
        console.error('Failed to initialize RunAnywhere SDK:', error);
      }
    };

    initializeSDK();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NotesProvider>
        <ModelServiceProvider>
          <StatusBar barStyle="light-content" backgroundColor={AppColors.primaryDark} />
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                headerStyle: {
                  backgroundColor: AppColors.primaryDark,
                  elevation: 0,
                  shadowOpacity: 0,
                  borderBottomWidth: 0,
                },
                headerTintColor: AppColors.textPrimary,
                headerTitleStyle: {
                  fontWeight: '700',
                  fontSize: 18,
                },
                cardStyle: {
                  backgroundColor: AppColors.primaryDark,
                },
                ...TransitionPresets.SlideFromRightIOS,
              }}
            >
              <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
              <Stack.Screen
                name="Interaction"
                component={InteractionScreen}
                options={{ title: 'BolSaathi Assistant' }}
              />
              <Stack.Screen
                name="SavedNotes"
                component={SavedNotesScreen}
                options={{ title: 'Saved Notes' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </ModelServiceProvider>
      </NotesProvider>
    </GestureHandlerRootView>
  );
};

export default App;
