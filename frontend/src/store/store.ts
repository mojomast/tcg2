import { configureStore } from '@reduxjs/toolkit';
// import gameReducer from '../features/game/gameSlice'; // Example placeholder

export const store = configureStore({
  reducer: {
    // Add reducers here
    // game: gameReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
