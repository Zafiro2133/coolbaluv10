import { Button } from "@/components/ui/button";
import { useCategories } from '@/hooks/useProducts';

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryFilter = ({ activeCategory, onCategoryChange }: CategoryFilterProps) => {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 px-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-20 bg-muted animate-pulse rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-6">
      <Button
        variant={activeCategory === 'all' ? "coolbalu" : "secondary"}
        size="sm"
        onClick={() => onCategoryChange('all')}
        className="flex-shrink-0 rounded-full px-4"
      >
        Todos
      </Button>
      {categories?.map((category) => (
        <Button
          key={category.id}
          variant={activeCategory === category.id ? "coolbalu" : "secondary"}
          size="sm"
          onClick={() => onCategoryChange(category.id)}
          className="flex-shrink-0 rounded-full px-4"
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
};