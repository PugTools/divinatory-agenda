import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StatusOption {
  value: string;
  label: string;
}

interface SearchFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  statusValue?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: StatusOption[];
  statusPlaceholder?: string;
}

export const SearchFilter = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  statusValue,
  onStatusChange,
  statusOptions,
  statusPlaceholder = 'Filtrar por status'
}: SearchFilterProps) => {
  const hasFilters = searchValue || (statusValue && statusValue !== 'all');

  const clearFilters = () => {
    onSearchChange('');
    if (onStatusChange) {
      onStatusChange('all');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
        />
      </div>
      
      {statusOptions && onStatusChange && (
        <Select value={statusValue || 'all'} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={statusPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpar filtros">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
