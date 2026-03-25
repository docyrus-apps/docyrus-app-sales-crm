'use client';

import {
  type ReactNode,
  useCallback,
  useEffect,
  useState
} from 'react';

import { SearchIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DocyrusIcon } from '@/components/docyrus/docyrus-icon';

import { useTeamChatContext } from './team-chat-context';
import { type EntitySearchResult, type LinkedEntity } from './types';

interface EntityMentionInputProps {
  onSelect: (entity: LinkedEntity) => void;
  children: ReactNode;
}

export function EntityMentionInput({ onSelect, children }: EntityMentionInputProps) {
  const { dataSources, onSearchEntity } = useTeamChatContext();
  const [open, setOpen] = useState(false);
  const [selectedDataSourceId, setSelectedDataSourceId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<EntitySearchResult>>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!selectedDataSourceId || !query.trim() || !onSearchEntity) {
      setResults([]);

      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const searchResults = await onSearchEntity(selectedDataSourceId, query);

      setResults(searchResults);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedDataSourceId, query, onSearchEntity]);

  const handleSelectEntity = useCallback((result: EntitySearchResult) => {
    if (!selectedDataSourceId || !dataSources) return;
    const ds = dataSources.find(d => d.id === selectedDataSourceId);

    if (!ds) return;

    onSelect({
      id: `${selectedDataSourceId}-${result.record_id}`,
      data_source_id: selectedDataSourceId,
      data_source_name: ds.name,
      record_id: result.record_id,
      display_value: result.display_value,
      icon: result.icon ?? ds.icon
    });
    setOpen(false);
    setSelectedDataSourceId(null);
    setQuery('');
    setResults([]);
  }, [selectedDataSourceId, dataSources, onSelect]);

  const handleBack = useCallback(() => {
    setSelectedDataSourceId(null);
    setQuery('');
    setResults([]);
  }, []);

  if (!dataSources || dataSources.length === 0 || !onSearchEntity) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        {!selectedDataSourceId ? (
          <div className="p-2">
            <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">
              Select data source
            </p>
            <ScrollArea className="max-h-48">
              {dataSources.map(ds => (
                <Button
                  key={ds.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => setSelectedDataSourceId(ds.id)}>
                  {ds.icon && (
                    <DocyrusIcon icon={ds.icon} className="size-4 shrink-0" />
                  )}
                  {ds.name}
                </Button>
              ))}
            </ScrollArea>
          </div>
        ) : (
          <div className="p-2">
            <div className="mb-2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1 text-xs"
                onClick={handleBack}>
                &larr;
              </Button>
              <span className="text-xs font-medium text-muted-foreground">
                {dataSources.find(d => d.id === selectedDataSourceId)?.name}
              </span>
            </div>
            <div className="relative mb-2">
              <SearchIcon className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search entity..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="h-8 pl-7 text-sm" />
            </div>
            <ScrollArea className="max-h-48">
              {isSearching ? (
                <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                  Searching...
                </p>
              ) : results.length === 0 && query.trim() ? (
                <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                  No results
                </p>
              ) : (
                results.map(result => (
                  <Button
                    key={result.record_id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-sm"
                    onClick={() => handleSelectEntity(result)}>
                    {result.icon && (
                      <DocyrusIcon icon={result.icon} className="size-3.5 shrink-0" />
                    )}
                    <span className="truncate">{result.display_value}</span>
                  </Button>
                ))
              )}
            </ScrollArea>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}