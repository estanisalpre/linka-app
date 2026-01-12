import { Stack } from 'expo-router';
import { colors } from '../../../src/utils/theme';

export default function NucleusLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerBackVisible: true,
        animation: 'slide_from_right',
      }}
    />
  );
}
