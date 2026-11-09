import { useCallback, useEffect, useReducer, useState } from 'react';
import { AppState } from 'react-native';
import { EmojiSearchStatus } from '../models/Emoji';
import { gameReducer, initialGameState } from './gameReducer';

export function useGameViewModel() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [tensorLoaded, setTensorLoaded] = useState(false);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      setAppActive(next === 'active');
      if (next !== 'active') setTensorLoaded(false);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!tensorLoaded || !appActive ||
        state.emojiStatus !== EmojiSearchStatus.Searching) return;
    const interval = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => clearInterval(interval);
  }, [tensorLoaded, appActive, state.emojiStatus, state.currentLevel]);

  const foundEmoji = useCallback(() => dispatch({ type: 'foundEmoji' }), []);
  const startNext = useCallback(() => {
    setTensorLoaded(false);
    dispatch({ type: 'nextEmoji' });
  }, []);
  const restart = useCallback(() => {
    setTensorLoaded(false);
    dispatch({ type: 'restart' });
  }, []);

  return {
    ...state, tensorLoaded, setTensorLoaded, appActive,
    foundEmoji, startNext, restart,
  };
}
