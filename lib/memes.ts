/** Мемы для payment-reminders (статика из public/memes/) */
export const MEMES = [
  { url: "/memes/meme-pay-share.png", label: "Pay your share" },
  { url: "/memes/meme-venmo-me.png", label: "Venmo me" },
  { url: "/memes/meme-bill-due.png", label: "The bill is due" },
  { url: "/memes/meme-group-chat.png", label: "The group chat finds out" },
] as const;

export function randomMeme(): { url: string; label: string } {
  return MEMES[Math.floor(Math.random() * MEMES.length)];
}
