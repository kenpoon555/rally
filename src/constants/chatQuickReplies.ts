export type ChatQuickReply = {
  id: string;
  label: string;
  text: string;
};

/** One-tap logistics messages for game / Rally threads. */
export const CHAT_QUICK_REPLIES: ChatQuickReply[] = [
  { id: 'on_my_way', label: 'On my way', text: 'On my way!' },
  { id: 'late', label: '5 min late', text: 'Running 5 min late.' },
  { id: 'cant_make', label: "Can't make it", text: "Can't make it — sorry!" },
  { id: 'see_you', label: 'See you there', text: 'See you at the court.' },
];
