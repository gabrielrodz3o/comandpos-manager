// Grabación de notas de voz con expo-audio. Pide permiso de micrófono, graba y
// devuelve la URI del archivo (.m4a) para subirlo a /comandi/voice.
//
// ⚠️ expo-audio es módulo NATIVO: requiere dev build / EAS (no corre en Expo Go).
import { useCallback, useState } from 'react';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';

export function useVoiceRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setError('Permiso de micrófono denegado');
        return false;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
      return true;
    } catch (e: any) {
      setError(e?.message || 'No se pudo iniciar la grabación');
      return false;
    }
  }, [recorder]);

  const stop = useCallback(async (): Promise<string | null> => {
    try {
      await recorder.stop();
    } catch {
      /* ya detenido */
    }
    setRecording(false);
    return recorder.uri ?? null;
  }, [recorder]);

  const cancel = useCallback(async (): Promise<void> => {
    try {
      await recorder.stop();
    } catch {
      /* noop */
    }
    setRecording(false);
  }, [recorder]);

  return { recording, error, start, stop, cancel };
}
