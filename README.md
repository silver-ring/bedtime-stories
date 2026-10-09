# Bedtime Stories

A small bedtime stories reader built with React Native 0.86, TypeScript and Redux Toolkit.
Browse public-domain fairy tales and fables, read them with adjustable type and themes,
keep favorites, and pick up where you left off after the app is closed.

## Features

- **Library**: search, category filter, a "Continue reading" card, pull to refresh.
- **Reader**: comfortable typography, text size steps, light / sepia / dark themes,
  a progress bar, and the scroll position restored when you reopen a story.
- **Favorites** and **Settings** tabs (theme, text size, reset progress).
- **States handled**: loading, error with retry, empty results, story not found.
- **Offline**: all stories ship inside the app. No network is used.
- **Persistence**: favorites, progress and settings survive restarts.

## Requirements

| Tool | Version |
| --- | --- |
| Node | 22.13 or newer (`nvm use` reads `.nvmrc`) |
| JDK | 17 |
| Xcode | 26 with an iOS simulator (iOS) |
| CocoaPods | via Bundler (`bundle install`) |
| Android SDK | platform 36, build-tools 36.0.0, NDK 27.1.12297006 (Android) |

## Getting started

```sh
nvm use                      # Node 22
npm ci
cd ios && bundle install && bundle exec pod install && cd ..
```

Xcode build phases do not read `.nvmrc`. Create `ios/.xcode.env.local` (git-ignored)
so they use the same Node:

```sh
echo "export NODE_BINARY=$(command -v node)" > ios/.xcode.env.local
```

Run it:

```sh
npm start                    # Metro on 8081 (the iOS app looks there)
npm run ios                  # in another terminal
npm run android              # needs a running emulator, and: adb reverse tcp:8081 tcp:8081
```

Emulators with little free storage can install an ARM64-only build:
`npx react-native run-android --active-arch-only`.

### Release builds (no Metro needed)

```sh
# iOS simulator
cd ios && xcodebuild -workspace BedtimeStories.xcworkspace -scheme BedtimeStories \
  -configuration Release -sdk iphonesimulator -derivedDataPath build/release \
  -destination "generic/platform=iOS Simulator" build && cd ..
xcrun simctl install booted ios/build/release/Build/Products/Release-iphonesimulator/BedtimeStories.app
xcrun simctl launch booted com.bedtimestories

# Android (signed with the debug keystore, fine for a demo)
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a && cd ..
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run typecheck` | `tsc --noEmit` with strict options and `noUncheckedIndexedAccess` |
| `npm run lint` | ESLint (React Native config) |
| `npm test` | Jest and React Native Testing Library |
| `npm run format` | Prettier over `src` |

## Architecture

```
src/
  app/        store, typed hooks, bootstrap, navigation, error boundary
  features/
    stories/    entity adapter + async thunk, filters, Library screen
    reader/     Reader screen, scroll math, progress bar, controls
    favorites/  favorites slice, Favorites screen
    progress/   reading progress slice and selectors
    settings/   reader settings and developer toggles, Settings screen
  services/   story repository, key-value storage, persistence
  shared/     theme tokens and provider, shared view components
  data/       generated story data (see below)
  types/      domain types
```

**State.** Redux Toolkit with five slices:

| Slice | Holds | Persisted |
| --- | --- | --- |
| `stories` | entities, load status, error, filter | no (bundled source of truth) |
| `favorites` | story ids in the order added | yes |
| `progress` | scroll fraction per story, completed flag | yes |
| `readerSettings` | text size step, theme | yes |
| `dev` | "simulate load failure" switch | no |

- **Async and errors.** `fetchStories` is a `createAsyncThunk` over a `StoryRepository`
  interface. Failures reject with a typed `AppError`. The thunk's `condition` skips a
  duplicate request while one is running and skips reloading data that is already loaded.
- **Typed everything.** `useAppDispatch`, `useAppSelector` and `useAppStore` come from
  `.withTypes()`. Navigation has explicit param lists.
- **Persistence.** No persistence library. Saved state is loaded and validated *before*
  the store is created, so defaults can never overwrite it. A listener middleware
  collapses bursts of changes into one debounced write, and a write also happens when the
  app leaves the foreground. Stored data is versioned (`bedtime-stories:v1`), parsed with
  type guards, and clamped. Corrupt or unknown data falls back to defaults, and a failed
  write never crashes the app.
- **Reading progress** is stored as a *fraction* of the scrollable length, not pixels, so
  a saved position still lands in about the same place after the text size changes.
  Position is restored once the layout is known, and a story is never overwritten with 0
  just because it was closed early. If you change the text size while reading, the same
  passage is kept at the top of the screen.
- **Theme.** `system`, `light`, `sepia`, `dark`. `system` follows the device and treats a
  missing color scheme as light.

### The "network" is simulated

`BundledStoryRepository` serves the bundled stories after a short delay, and the
Settings screen has a developer switch that makes the next load fail. That exercises the
loading, error and retry paths without a flaky network on the demo path. Swapping in a
real HTTP repository only means implementing `StoryRepository`.

## Stories and licensing

The text comes from Project Gutenberg and is in the public domain in the United States:

- *Grimms' Fairy Tales* (translations by Edgar Taylor and Marian Edwardes)
- *Andersen's Fairy Tales* (translator not credited in the source edition)
- *Three Hundred Aesop's Fables* (translation by George Fyler Townsend)

The Project Gutenberg header, footer and trademark text are removed. Each story keeps
its source collection and link in its metadata. To regenerate the data files:

```sh
node scripts/extract-stories.mjs /tmp/gutenberg-cache
```

The app icon is drawn by `python3 scripts/make-icons.py` (needs Pillow).

## Testing

`npm test` covers reducers and selectors, the thunk (loading, failure, duplicate
requests), persistence (corrupt data, debounce, failed writes, round trip), scroll math,
and the screens through React Native Testing Library (loading, error and retry, empty
states, favorites, reader controls, progress save and restore, settings, the error
boundary, and restoring saved state at startup). Storage and the repository are
injected, so tests use an in-memory store and instant data.

## Trade-offs and what is next

- Animation libraries (Reanimated, Gesture Handler) are intentionally not used.
- Portrait only on both platforms. Landscape would need safe-area handling on the sides.
- Changing the text size while reading keeps the same passage in view. While text
  re-lays out, the Android scroll view reports a stale content height and can clamp a
  scroll to its old limit, so the reader ignores scroll events until the layout settles,
  then checks the real offset and retries (see `ReaderScreen.tsx`).
- Very large system text sizes are capped on headers and buttons so fixed-height bars do
  not clip. Changing the system text size while the app is open can leave some text
  stale until the app restarts (a React Native text-measurement behavior).
- A force-kill within half a second of a change can lose that change. Backgrounding the
  app writes immediately.
- Next: a real remote repository with an abort timeout, text-to-speech, per-story
  bookmarks, and end-to-end tests with Detox or Maestro.
