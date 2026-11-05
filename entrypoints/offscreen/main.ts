import { createPlayer } from '@/lib/player';

const player = createPlayer();

browser.runtime.onMessage.addListener((msg) => {
  if (msg?.target !== 'offscreen') return;
  if (msg.type === 'play') player.play(msg.sound, msg.volume).catch(console.error);
  if (msg.type === 'stop') player.stop();
});
