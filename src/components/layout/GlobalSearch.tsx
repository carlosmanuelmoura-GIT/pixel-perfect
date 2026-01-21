import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, FileText, Gavel, CheckCircle, Command, Users, ScrollText } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useGlobalSearch, SearchResult } from '@/hooks/useGlobalSearch';

const iconMap = {
  calendar: Calendar,
  'file-text': FileText,
  gavel: Gavel,
  'check-circle': CheckCircle,
  users: Users,
  scroll: ScrollText,
};

const typeLabels: Record<string, string> = {
  meeting: 'Reuniões',
  agenda_point: 'Pontos de Agenda',
  decision: 'Decisões',
  action: 'Ações',
  grupo_trabalho: 'Grupos de Trabalho',
  protocol: 'Protocolos',
};

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { results } = useGlobalSearch(query);

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  const handleSelect = useCallback((result: SearchResult) => {
    onOpenChange(false);
    navigate(result.url);
  }, [navigate, onOpenChange]);

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Pesquisar reuniões, pontos de agenda, decisões, ações..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {query.length < 2 
            ? 'Digite pelo menos 2 caracteres para pesquisar...'
            : 'Nenhum resultado encontrado.'
          }
        </CommandEmpty>
        
        {Object.entries(groupedResults).map(([type, items]) => {
          const label = typeLabels[type] || type;
          
          return (
            <CommandGroup key={type} heading={label}>
              {items.map((result) => {
                const Icon = iconMap[result.icon];
                
                return (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    value={`${result.title} ${result.subtitle}`}
                    onSelect={() => handleSelect(result)}
                    className="cursor-pointer"
                  >
                    <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium truncate">{result.title}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {result.subtitle}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}

interface SearchTriggerProps {
  onClick: () => void;
}

export function SearchTrigger({ onClick }: SearchTriggerProps) {
  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onClick();
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onClick]);

  return (
    <button
      onClick={onClick}
      className="relative hidden md:flex items-center gap-2 w-64 h-10 px-3 rounded-md border border-input bg-background/50 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      <Search className="w-4 h-4" />
      <span>Pesquisar...</span>
      <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
        <Command className="h-3 w-3" />K
      </kbd>
    </button>
  );
}
