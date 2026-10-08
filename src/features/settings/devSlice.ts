import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface DevState {
  /** Forces the next story load to fail. Never persisted. */
  simulateFailure: boolean;
}

const devSlice = createSlice({
  name: 'dev',
  initialState: { simulateFailure: false } as DevState,
  reducers: {
    simulateFailureSet(state, action: PayloadAction<boolean>) {
      state.simulateFailure = action.payload;
    },
  },
});

export const { simulateFailureSet } = devSlice.actions;
export const devReducer = devSlice.reducer;
