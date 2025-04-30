import { configureStore } from '@reduxjs/toolkit';
import formDataReducer from './formDataSlice'; // Import the reducer

// Combine reducers
const rootReducer = {
  formData: formDataReducer,
  // Add other reducers here as needed
};

export const store = configureStore({
  reducer: rootReducer,
  // Middleware and devTools are enabled by default, which is good for development.
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
