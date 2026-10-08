import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
  type EntityState,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type { StoryRepository } from '../../services/storyRepository';
import type {
  AppError,
  CategoryFilter,
  LoadStatus,
  Story,
} from '../../types/domain';

export interface StoriesFilter {
  query: string;
  category: CategoryFilter;
}

export interface StoriesState extends EntityState<Story, string> {
  status: LoadStatus;
  error: AppError | null;
  filter: StoriesFilter;
}

export const storiesAdapter = createEntityAdapter<Story>();

export const initialFilter: StoriesFilter = { query: '', category: 'all' };

export interface ThunkExtra {
  repository: StoryRepository;
}

// The thunk only needs these slices, so its state type does not depend on the
// root reducer (which would make the types circular).
interface ThunkState {
  stories: StoriesState;
  dev: { simulateFailure: boolean };
}

const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: ThunkState;
  extra: ThunkExtra;
  rejectValue: AppError;
}>();

export function toAppError(value: unknown): AppError {
  if (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    typeof value.message === 'string'
  ) {
    const code = value.code;
    if (code === 'LOAD_FAILED' || code === 'NOT_FOUND' || code === 'UNKNOWN') {
      return { code, message: value.message };
    }
  }
  return {
    code: 'UNKNOWN',
    message: value instanceof Error ? value.message : 'Something went wrong.',
  };
}

export const fetchStories = createAppAsyncThunk<
  Story[],
  { force?: boolean } | undefined
>(
  'stories/fetch',
  async (_arg, { getState, extra, rejectWithValue }) => {
    try {
      return await extra.repository.getStories({
        simulateFailure: getState().dev.simulateFailure,
      });
    } catch (error) {
      const appError = toAppError(error);
      if (__DEV__) {
        console.log(`[stories] fetch failed ${appError.code}`);
      }
      return rejectWithValue(appError);
    }
  },
  {
    // Skip a duplicate request while one is running, and skip a refetch of
    // data that is already loaded unless the caller forces it.
    condition: (arg, { getState }) => {
      const { status } = getState().stories;
      if (status === 'loading') {
        return false;
      }
      return !(status === 'succeeded' && !arg?.force);
    },
  },
);

const storiesSlice = createSlice({
  name: 'stories',
  initialState: storiesAdapter.getInitialState({
    status: 'idle' as LoadStatus,
    error: null as AppError | null,
    filter: initialFilter,
  }),
  reducers: {
    querySet(state, action: PayloadAction<string>) {
      state.filter.query = action.payload;
    },
    categorySet(state, action: PayloadAction<CategoryFilter>) {
      state.filter.category = action.payload;
    },
    filterCleared(state) {
      state.filter = initialFilter;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchStories.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchStories.fulfilled, (state, action) => {
        storiesAdapter.setAll(state, action.payload);
        state.status = 'succeeded';
      })
      .addCase(fetchStories.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? toAppError(action.error);
      });
  },
});

export const { querySet, categorySet, filterCleared } = storiesSlice.actions;
export const storiesReducer = storiesSlice.reducer;
