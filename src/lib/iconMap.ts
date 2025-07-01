
import {
  Utensils, Car, Home, Lightbulb, Film, HeartPulse, BookOpen, ShoppingCart, Package, Briefcase, Gift, Landmark, DollarSign, Settings, Tag, List, type LucideIcon
} from 'lucide-react';

// A mapping from string names to the actual Lucide icon components
export const iconMap: { [key: string]: LucideIcon } = {
  Utensils,
  Car,
  Home,
  Lightbulb,
  Film,
  HeartPulse,
  BookOpen,
  ShoppingCart,
  Package,
  Briefcase,
  Gift,
  Landmark,
  DollarSign,
  Settings,
  Tag,
  List,
};

/**
 * Returns a Lucide icon component based on its string name.
 * @param name The string name of the icon.
 * @returns The LucideIcon component, or a default 'Package' icon if not found.
 */
export const getIcon = (name?: string): LucideIcon => {
  if (name && iconMap[name]) {
    return iconMap[name];
  }
  return Package; // Default icon for unknown or new categories
};
