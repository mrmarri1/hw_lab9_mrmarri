# EmojiHunterRN

Lab 09 implementation using Expo, TypeScript, expo-camera, TensorFlow.js and MobileNet.

## Run

```sh
npm install
npm test -- --runInBand
npm run typecheck
npx expo start
```

Open the app on a physical phone using Expo Go and grant camera permission. Internet is needed to download MobileNet the first time the app starts. The model is reused across rounds during that app session.

Find the laptop, phone, pen, book and backpack in order. Each round gives you 10 seconds once both the camera and model are ready. A match above 20% confidence shows FOUND and NEXT. A timeout shows NOT FOUND and NEXT. After the fifth round, tap NEXT to see GAME OVER and tap to restart.

The countdown and image capture pause while the app is in the background. Camera permission and model/classification errors have recovery controls.

## Structure

- `models/Emoji.ts` defines statuses, targets and exact classifier alias matching.
- `viewModels/gameReducer.ts` contains the pure game state transitions.
- `viewModels/useGameViewModel.ts` owns the timer and game actions.
- `views/CustomCamera.tsx` captures frames, resizes and decodes JPEGs, runs MobileNet and releases tensors and temporary files.
- `views/GameView.tsx` renders the camera, result, next and restart screens.
- `__tests__/` contains the nine required reducer tests and label-matching regression checks.

## Physical phone verification

Check camera permission, initial model loading, all five object detections, timeout, next, game over, restart and background/resume on a phone. Classification accuracy depends on framing, lighting and MobileNet labels. Desktop checks cannot verify the device camera.
