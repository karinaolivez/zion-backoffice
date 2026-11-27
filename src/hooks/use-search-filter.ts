import { useMemo } from 'react';
import { NavigationSection, MenuItem, SubMenuItem } from './use-navigation-items';

export interface SearchResult {
  section: NavigationSection;
  matchedItems: MenuItem[];
  hasMatches: boolean;
}

export const useSearchFilter = (sections: NavigationSection[], searchTerm: string) => {
  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) {
      return sections.map(section => ({
        section,
        matchedItems: section.items,
        hasMatches: true
      }));
    }

    const term = searchTerm.toLowerCase().trim();
    
    const filtered: SearchResult[] = sections.map(section => {
      const matchedItems: MenuItem[] = [];

      section.items.forEach(item => {
        // Verifica se o item principal corresponde ao termo de busca
        const itemMatches = item.label.toLowerCase().includes(term) ||
                           item.path.toLowerCase().includes(term);

        // Verifica se algum submenu corresponde ao termo de busca
        const matchedSubItems: SubMenuItem[] = [];
        if (item.submenu) {
          item.submenu.forEach((subItem: SubMenuItem) => {
            if (subItem.label.toLowerCase().includes(term) ||
                subItem.path.toLowerCase().includes(term)) {
              matchedSubItems.push(subItem);
            }
          });
        }

        // Se o item principal ou algum submenu corresponde, inclui o item
        if (itemMatches || matchedSubItems.length > 0) {
          matchedItems.push({
            ...item,
            submenu: matchedSubItems.length > 0 ? matchedSubItems : item.submenu
          });
        }
      });

      return {
        section,
        matchedItems,
        hasMatches: matchedItems.length > 0
      };
    });

    return filtered.filter(result => result.hasMatches);
  }, [sections, searchTerm]);

  const hasResults = filteredSections.length > 0;
  const totalMatches = useMemo(() => {
    return filteredSections.reduce((total, result) => 
      total + result.matchedItems.length, 0
    );
  }, [filteredSections]);

  return {
    filteredSections,
    hasResults,
    totalMatches,
    isFiltering: !!searchTerm.trim()
  };
};