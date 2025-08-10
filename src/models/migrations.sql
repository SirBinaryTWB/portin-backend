-- Enable uuid-ossp if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) UNIQUE NOT NULL,
  password_hash varchar(255) NOT NULL,
  username varchar(50) UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name varchar(100),
  bio text,
  avatar_url text,
  locale varchar(10) DEFAULT 'en',
  theme varchar(10) DEFAULT 'light',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code varchar(12) UNIQUE NOT NULL,
  name varchar(100),
  leader_id uuid REFERENCES users(id),
  password_hash text,
  max_players int NOT NULL DEFAULT 8,
  created_at timestamptz DEFAULT now(),
  state jsonb DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS room_members (
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role varchar(20) DEFAULT 'player',
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  type varchar(20) DEFAULT 'text',
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  game_type varchar(50),
  state jsonb,
  updated_at timestamptz DEFAULT now()
);
