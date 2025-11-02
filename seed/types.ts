export interface User {
  id: string;
  username: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export interface Thread {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Reply {
  id: string;
  author_id: string;
  thread_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}
