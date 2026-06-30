-- Message reactions: emoji responses to chat messages
CREATE TABLE message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL CHECK (emoji IN ('👍', '❤️', '😂', '🔥', '💪')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX idx_message_reactions_message_id ON message_reactions (message_id);
CREATE INDEX idx_message_reactions_user_id ON message_reactions (user_id);

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Conversation members can read reactions on messages in their conversations
CREATE POLICY "members can read reactions"
  ON message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE m.id = message_reactions.message_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- Members can add reactions to non-deleted text messages in their conversations
CREATE POLICY "members can add reactions"
  ON message_reactions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE m.id = message_reactions.message_id
        AND m.message_type = 'text'
        AND m.deleted_at IS NULL
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- Users can only remove their own reactions
CREATE POLICY "users can remove own reactions"
  ON message_reactions FOR DELETE
  USING (user_id = auth.uid());

-- Enable realtime for the reactions table
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
