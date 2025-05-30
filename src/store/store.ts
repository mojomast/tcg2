import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './slices/gameSlice'; // Import the game reducer
import playerReducer from './slices/playerSlice'; // Import the player reducer

const store = configureStore({
  reducer: {
    game: gameReducer, // Add the game reducer to the store
    player: playerReducer, // Add the player reducer to the store
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
