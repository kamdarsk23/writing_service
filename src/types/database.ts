export interface Folder {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Work {
  id: string;
  user_id: string;
  folder_id: string | null;
  title: string;
  content: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FolderNode extends Folder {
  children: FolderNode[];
}
