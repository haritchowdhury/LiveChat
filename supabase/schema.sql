-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  status TEXT DEFAULT 'Hey there! I am using Periskope.',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations (chats) table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  is_group BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  avatar_url TEXT,
  last_message_id UUID
);

-- Create participants table for users in conversations
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_message_id UUID,
  UNIQUE(user_id, conversation_id)
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_by JSONB DEFAULT '[]',
  type TEXT DEFAULT 'TEXT', -- TEXT, IMAGE, VOICE, etc.
  asset_url TEXT,
  is_pinned BOOLEAN DEFAULT FALSE
);

-- Update conversations.last_message_id foreign key after messages table is created
ALTER TABLE conversations ADD CONSTRAINT fk_last_message
  FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_participants_user_id ON participants(user_id);
CREATE INDEX idx_participants_conversation_id ON participants(conversation_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at);