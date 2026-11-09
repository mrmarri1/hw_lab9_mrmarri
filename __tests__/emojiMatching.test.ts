import { emojiObjects, matchesEmoji } from '../models/Emoji';

describe('MobileNet label matching', () => {
  test('matches whole synonyms regardless of label casing and spaces', () => {
    expect(matchesEmoji({ className: 'Ballpoint, Ballpoint Pen', probability: 0.8 },
      emojiObjects[2].emojiNames)).toBe(true);
  });

  test('does not confuse a penguin with a pen', () => {
    expect(matchesEmoji({ className: 'king penguin', probability: 0.9 },
      emojiObjects[2].emojiNames)).toBe(false);
  });

  test('does not confuse a notebook computer with a book', () => {
    expect(matchesEmoji({ className: 'notebook, notebook computer', probability: 0.9 },
      emojiObjects[3].emojiNames)).toBe(false);
  });

  test('requires confidence strictly above 0.2', () => {
    expect(matchesEmoji({ className: 'laptop', probability: 0.2 },
      emojiObjects[0].emojiNames)).toBe(false);
    expect(matchesEmoji({ className: 'laptop', probability: 0.21 },
      emojiObjects[0].emojiNames)).toBe(true);
  });
});
