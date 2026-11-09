import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmojiSearchStatus, emojiObjects } from '../models/Emoji';
import { useGameViewModel } from '../viewModels/useGameViewModel';
import CustomCamera from './CustomCamera';

export default function GameView() {
  const vm = useGameViewModel();
  const currentEmoji = emojiObjects[vm.currentLevel];

  return (
    <View style={styles.container}>
      {vm.emojiStatus === EmojiSearchStatus.GameOver ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Game over. Tap to restart"
          style={[styles.fullscreenButton, styles.gameOver]}
          onPress={vm.restart}
        >
          <Text style={styles.gameOverText}>{'GAME OVER\nTap to restart'}</Text>
        </Pressable>
      ) : vm.showNext ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next emoji"
          style={[styles.fullscreenButton, styles.next]}
          onPress={vm.startNext}
        >
          <Text style={styles.nextText}>NEXT</Text>
        </Pressable>
      ) : (
        vm.appActive && <CustomCamera
          key={vm.currentLevel}
          emojiNames={currentEmoji.emojiNames}
          onEmojiFound={vm.foundEmoji}
          onTensorLoaded={vm.setTensorLoaded}
          active={vm.appActive}
        />
      )}

      {vm.emojiStatus !== EmojiSearchStatus.GameOver && (
        <View style={styles.info} pointerEvents="none">
          {vm.emojiStatus === EmojiSearchStatus.Searching && (
            <Text style={styles.timer}>Time Remaining: {vm.timeRemaining}</Text>
          )}
          <Text style={styles.emojiText}>
            {emojiResultText(vm.emojiStatus, currentEmoji.emoji)}
          </Text>
        </View>
      )}
    </View>
  );
}

function emojiResultText(status: EmojiSearchStatus, emoji: string): string {
  switch (status) {
    case EmojiSearchStatus.Found: return `${emoji} FOUND!`;
    case EmojiSearchStatus.NotFound: return `${emoji} NOT FOUND`;
    default: return emoji;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  fullscreenButton: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  next: { backgroundColor: '#34C759' },
  gameOver: { backgroundColor: '#FF3B30' },
  nextText: { color: '#fff', fontSize: 60, fontWeight: 'bold' },
  gameOverText: { color: '#fff', fontSize: 40, fontWeight: 'bold', textAlign: 'center' },
  info: {
    position: 'absolute', bottom: 50, left: 0, right: 0, alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 12,
  },
  timer: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  emojiText: { color: '#fff', fontSize: 40, fontWeight: 'bold', marginTop: 4 },
});
