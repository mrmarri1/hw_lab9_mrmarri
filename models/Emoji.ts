export enum EmojiSearchStatus {
  Searching = 'Searching',
  Found = 'Found',
  NotFound = 'NotFound',
  GameOver = 'GameOver',
}

export interface Emoji {
  emoji: string;
  emojiNames: string[];
}

export const emojiObjects: Emoji[] = [
  { emoji: '💻', emojiNames: ['laptop', 'laptop computer', 'notebook', 'notebook computer'] },
  { emoji: '📱', emojiNames: ['cellular telephone', 'cellular phone', 'cellphone', 'cell', 'mobile phone'] },
  { emoji: '🖊', emojiNames: ['ballpoint', 'ballpoint pen', 'ballpen', 'biro', 'fountain pen', 'quill pen'] },
  { emoji: '📕', emojiNames: ['book jacket', 'dust cover', 'dust jacket', 'dust wrapper', 'comic book'] },
  { emoji: '🎒', emojiNames: ['backpack', 'back pack', 'knapsack', 'packsack', 'rucksack', 'haversack'] },
];

/** MobileNet labels contain comma-separated synonyms. Match whole aliases. */
export function matchesEmoji(
  prediction: { className: string; probability: number },
  emojiNames: string[],
): boolean {
  return prediction.probability > 0.2 &&
    prediction.className.toLowerCase().split(',').some(
      (label) => emojiNames.includes(label.trim()),
    );
}
