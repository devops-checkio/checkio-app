export interface TreeItem {
  publicId: string;
  code?: string;
  name: string;
  items?: TreeItem[];
  subRelationId?: string | null;
}
