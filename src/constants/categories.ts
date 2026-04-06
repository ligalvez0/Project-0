import { Category } from '../models';

export const DEFAULT_CATEGORIES: Category[] = [
  // Personal categories
  { id: 'food', name: 'Food & Groceries', icon: 'food', color: '#4CAF50', type: 'personal', isCustom: false },
  { id: 'transport', name: 'Transportation', icon: 'car', color: '#2196F3', type: 'personal', isCustom: false },
  { id: 'entertainment', name: 'Entertainment', icon: 'movie', color: '#9C27B0', type: 'personal', isCustom: false },
  { id: 'health', name: 'Health & Fitness', icon: 'heart-pulse', color: '#F44336', type: 'personal', isCustom: false },
  { id: 'shopping', name: 'Shopping', icon: 'shopping', color: '#FF9800', type: 'personal', isCustom: false },
  { id: 'utilities', name: 'Utilities & Bills', icon: 'lightning-bolt', color: '#607D8B', type: 'personal', isCustom: false },
  // Business categories
  { id: 'software', name: 'Software & Tools', icon: 'laptop', color: '#3F51B5', type: 'business', isCustom: false },
  { id: 'office', name: 'Office Supplies', icon: 'printer', color: '#795548', type: 'business', isCustom: false },
  { id: 'travel', name: 'Business Travel', icon: 'airplane', color: '#00BCD4', type: 'business', isCustom: false },
  { id: 'marketing', name: 'Marketing & Ads', icon: 'bullhorn', color: '#E91E63', type: 'business', isCustom: false },
  { id: 'services', name: 'Professional Services', icon: 'briefcase', color: '#FF5722', type: 'business', isCustom: false },
  { id: 'equipment', name: 'Equipment', icon: 'tools', color: '#455A64', type: 'business', isCustom: false },
];
