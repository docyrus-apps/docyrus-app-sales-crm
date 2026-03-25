'use client';

import {
  useCallback, useEffect, useMemo, useState
} from 'react';

import { AlertTriangle, Loader2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

import {
  type ChildAction,
  type DataSourceRelation,
  type RecordDeleteConfirmDialogProps
} from './types';

export function RecordDeleteConfirmDialog({
  open,
  onOpenChange,
  recordCount,
  relations,
  isLoadingRelations,
  onConfirm,
  isPending
}: RecordDeleteConfirmDialogProps) {
  const childRelations = useMemo(
    () => relations ?? [],
    [relations]
  );

  const [childActions, setChildActions] = useState<
    Record<string, ChildAction>
  >({});

  useEffect(() => {
    if (!open) return;
    const initial: Record<string, ChildAction> = {};

    for (const rel of childRelations) {
      initial[rel.dataSourceId] = 'keep';
    }
    setChildActions(initial);
  }, [open, childRelations]);

  const allAction = useMemo<ChildAction | undefined>(() => {
    if (childRelations.length === 0) return undefined;
    const values = Object.values(childActions);

    if (values.length === 0) return 'keep';
    const first = values[0];

    return values.every(v => v === first) ? first : undefined;
  }, [childActions, childRelations]);

  const onAllActionChange = useCallback((value: string) => {
    const action = value as ChildAction;

    setChildActions((prev) => {
      const next = { ...prev };

      for (const key of Object.keys(next)) {
        next[key] = action;
      }

      return next;
    });
  }, []);

  const onRelationActionChange = useCallback(
    (dataSourceId: string, value: string) => {
      setChildActions(prev => ({
        ...prev,
        [dataSourceId]: value as ChildAction
      }));
    },
    []
  );

  const onConfirmClick = useCallback(() => {
    onConfirm(childActions);
  }, [onConfirm, childActions]);

  const count = recordCount;
  const hasChildRelations = childRelations.length > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        data-grid-popover
        className={cn(
          'w-[min(90vw,960px)]',
          'data-[size=default]:max-w-none sm:data-[size=default]:max-w-none',
          hasChildRelations ? 'sm:max-w-5xl' : 'sm:max-w-xl'
        )}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            Confirm Deletion
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{' '}
            {count === 1 ? 'this item' : `these ${count} items`}? This action
            cannot be undone. Please confirm your choice.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isLoadingRelations ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : hasChildRelations ? (
          <ChildRelationsForm
            childRelations={childRelations}
            childActions={childActions}
            allAction={allAction}
            onAllActionChange={onAllActionChange}
            onRelationActionChange={onRelationActionChange} />
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isPending || isLoadingRelations}
            onClick={onConfirmClick}>
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ChildRelationsForm({
  childRelations,
  childActions,
  allAction,
  onAllActionChange,
  onRelationActionChange
}: {
  childRelations: Array<DataSourceRelation>;
  childActions: Record<string, ChildAction>;
  allAction: ChildAction | undefined;
  onAllActionChange: (value: string) => void;
  onRelationActionChange: (dataSourceId: string, value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Please choose desired action for related records.
      </p>

      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <span className="text-muted-foreground">&#x2637;</span>
          For All Tables
        </p>
        <RadioGroup
          value={allAction ?? ''}
          onValueChange={onAllActionChange}
          className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="keep" id="all-keep" />
            <Label htmlFor="all-keep" className="text-sm">
              Remove Relation And Keep
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="delete" id="all-delete" />
            <Label htmlFor="all-delete" className="text-sm">
              Delete Related Records
            </Label>
          </div>
        </RadioGroup>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-45">Related Docybase</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {childRelations.map(rel => (
            <ChildRelationRow
              key={rel.dataSourceId}
              relation={rel}
              action={childActions[rel.dataSourceId] ?? 'keep'}
              onActionChange={onRelationActionChange} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ChildRelationRow({
  relation,
  action,
  onActionChange
}: {
  relation: DataSourceRelation;
  action: ChildAction;
  onActionChange: (dataSourceId: string, value: string) => void;
}) {
  const keepId = `${relation.dataSourceId}-keep`;
  const deleteId = `${relation.dataSourceId}-delete`;

  const onChange = useCallback(
    (value: string) => {
      onActionChange(relation.dataSourceId, value);
    },
    [onActionChange, relation.dataSourceId]
  );

  return (
    <TableRow>
      <TableCell className="font-medium">
        {relation.dataSourceName}
        <span className="text-destructive">*</span>
      </TableCell>
      <TableCell>
        <RadioGroup
          value={action}
          onValueChange={onChange}
          className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="keep" id={keepId} />
            <Label htmlFor={keepId} className="text-sm">
              Remove Relation And Keep
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="delete" id={deleteId} />
            <Label htmlFor={deleteId} className="text-sm">
              Delete Related Records
            </Label>
          </div>
        </RadioGroup>
      </TableCell>
    </TableRow>
  );
}