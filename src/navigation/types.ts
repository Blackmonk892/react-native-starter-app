export type InteractionMode = 'ask' | 'listen' | 'reply';

export type RootStackParamList = {
  Home: undefined;
  Interaction: { mode: InteractionMode; scenario: string };
  SavedNotes: undefined;
};