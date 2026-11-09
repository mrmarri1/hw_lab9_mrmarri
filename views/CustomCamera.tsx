import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as mobilenet from '@tensorflow-models/mobilenet';
import jpeg from 'jpeg-js';
import { matchesEmoji } from '../models/Emoji';

// Cache the promise as well as the model so concurrent mounts share one load.
let modelPromise: Promise<mobilenet.MobileNet> | null = null;

function loadModel(): Promise<mobilenet.MobileNet> {
  if (!modelPromise) {
    modelPromise = (async () => {
      await tf.ready();
      return mobilenet.load();
    })().catch((error: unknown) => {
      modelPromise = null;
      throw error;
    });
  }
  return modelPromise;
}

type Props = {
  emojiNames: string[];
  onEmojiFound: () => void;
  onTensorLoaded: (loaded: boolean) => void;
  active: boolean;
};

export default function CustomCamera({
  emojiNames, onEmojiFound, onTensorLoaded, active,
}: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [model, setModel] = useState<mobilenet.MobileNet | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const cameraRef = useRef<CameraView | null>(null);
  const permissionRequested = useRef(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain && !permissionRequested.current) {
      permissionRequested.current = true;
      void requestPermission().catch(() => {
        setError('Camera permission could not be requested. Please try again.');
      });
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    let cancelled = false;
    loadModel().then((loaded) => {
      if (!cancelled) setModel(loaded);
    }).catch((reason: unknown) => {
      console.error('Failed to load MobileNet:', reason);
      if (!cancelled) setError('Could not load MobileNet. Check your connection and retry.');
    });
    return () => { cancelled = true; };
  }, [loadAttempt]);

  useEffect(() => {
    onTensorLoaded(Boolean(model && cameraReady && permission?.granted && active && !error));
  }, [model, cameraReady, permission?.granted, active, error, onTensorLoaded]);

  useEffect(() => {
    if (!model || !cameraReady || !permission?.granted || !active || error) return;
    let cancelled = false;
    let processing = false;
    let foundThisRound = false;

    async function classifyFrame() {
      if (processing || foundThisRound || !cameraRef.current) return;
      // Lock before capture so two photos can never be processed concurrently.
      processing = true;
      let photoUri: string | undefined;
      let resizedUri: string | undefined;
      let tensor: tf.Tensor3D | undefined;
      try {
        const photo = await cameraRef.current.takePictureAsync({
          shutterSound: false,
          quality: 0.5,
        });
        if (!photo) return;
        photoUri = photo.uri;
        if (cancelled) return;
        const resized = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 224, height: 224 } }],
          { format: ImageManipulator.SaveFormat.JPEG, base64: true },
        );
        resizedUri = resized.uri;
        if (cancelled || !resized.base64) return;
        const bytes = tf.util.encodeString(resized.base64, 'base64');
        const { width, height, data } = jpeg.decode(bytes, { useTArray: true });
        const rgb = new Uint8Array(width * height * 3);
        for (let pixel = 0, channel = 0; pixel < data.length; pixel += 4) {
          rgb[channel++] = data[pixel];
          rgb[channel++] = data[pixel + 1];
          rgb[channel++] = data[pixel + 2];
        }
        tensor = tf.tensor3d(rgb, [height, width, 3], 'int32');
        const predictions = await model!.classify(tensor);
        if (cancelled) return;
        if (__DEV__) console.log('Predictions:', predictions);
        if (predictions.some((prediction) => matchesEmoji(prediction, emojiNames))) {
          foundThisRound = true;
          onEmojiFound();
        }
      } catch (reason) {
        if (!cancelled) {
          console.error('Camera classification failed:', reason);
          setError('Camera classification failed. Tap Retry to continue.');
        }
      } finally {
        tensor?.dispose();
        for (const uri of new Set([photoUri, resizedUri])) {
          if (!uri) continue;
          try {
            new File(uri).delete();
          } catch (reason) {
            console.warn('Could not remove temporary camera image:', reason);
          }
        }
        processing = false;
      }
    }

    const interval = setInterval(() => { void classifyFrame(); }, 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [model, cameraReady, permission?.granted, active, error, emojiNames, onEmojiFound]);

  if (!permission) {
    return <View style={styles.centered}><ActivityIndicator color="#fff" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>We need camera access to play EmojiHunter.</Text>
        <Pressable style={styles.button} onPress={() => {
          if (permission.canAskAgain) {
            void requestPermission().catch(() => setError('Please enable camera access in Settings.'));
          } else {
            void Linking.openSettings().catch(() => setError('Open Settings and allow camera access.'));
          }
        }}>
          <Text style={styles.buttonText}>
            {permission.canAskAgain ? 'Allow camera' : 'Open Settings'}
          </Text>
        </Pressable>
        {error && <Text style={styles.message}>{error}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {active && (
        <CameraView
          key={loadAttempt}
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
          onMountError={() => {
            setCameraReady(false);
            setError('Could not start the camera. Tap Retry to continue.');
          }}
        />
      )}
      {(!model || !cameraReady || error) && (
        <View style={styles.overlay}>
          {error ? (
            <>
              <Text style={styles.message}>{error}</Text>
              <Pressable style={styles.button} onPress={() => {
                setError(null);
                setCameraReady(false);
                setLoadAttempt((attempt) => attempt + 1);
              }}>
                <Text style={styles.buttonText}>Retry</Text>
              </Pressable>
            </>
          ) : (
            <>
              <ActivityIndicator color="#fff" size="large" />
              <Text style={styles.message}>
                {!model ? 'Loading image classification model…' : 'Starting camera…'}
              </Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1, backgroundColor: '#000', justifyContent: 'center',
    alignItems: 'center', padding: 24, gap: 18,
  },
  message: { color: '#fff', fontSize: 18, textAlign: 'center' },
  overlay: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', padding: 24, gap: 18,
  },
  button: { backgroundColor: '#007AFF', padding: 16, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
