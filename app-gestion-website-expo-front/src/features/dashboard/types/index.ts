export interface NewsItem {
  id: number;
  title: string;
  content: string;
  author: string;
  date: string;
  category: string;
  pinned: boolean;
}

export type NewsCategoryVariant = 'active' | 'pending' | 'inactive';

export const getCategoryVariant = (category: string): NewsCategoryVariant => {
  switch (category) {
    case 'Formation':
      return 'active';
    case 'Événement':
      return 'active';
    default:
      return 'pending';
  }
};
