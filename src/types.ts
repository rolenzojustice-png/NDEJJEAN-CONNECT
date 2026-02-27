export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'parent' | 'teacher' | 'admin';
  avatar?: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  author_id: number;
  author_name: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  user_name: string;
  content: string;
  created_at: string;
}

export interface SchoolEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  time?: string;
  location: string;
  created_at: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
}

export interface Conversation {
  other_user_id: number;
  other_user_name: string;
  other_user_role: string;
  last_message: string;
  last_message_at: string;
}
