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

export interface QTreeRoot {
  id: string;
  user_id: string;
  folder_id: string | null;
  question: string;
  answer: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface QTreeNode {
  id: string;
  user_id: string;
  qtree_root_id: string;
  parent_root_id: string | null;
  parent_node_id: string | null;
  question: string;
  answer: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface QTreeNodeTree extends QTreeNode {
  children: QTreeNodeTree[];
}
