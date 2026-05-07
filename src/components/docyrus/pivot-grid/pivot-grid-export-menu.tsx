'use client'

import { useState } from 'react'

import { DownloadIcon, FileSpreadsheetIcon, FileTextIcon } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

import { type PivotGridController } from './types'

interface PivotGridExportMenuProps<TData> {
  controller: PivotGridController<TData>
}

export function PivotGridExportMenu<TData>({
  controller,
}: PivotGridExportMenuProps<TData>) {
  const [isExporting, setIsExporting] = useState(false)

  async function runExport(task: () => Promise<void>) {
    setIsExporting(true)

    try {
      await task()
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          <DownloadIcon className="size-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={() => void runExport(controller.exportCsv)}>
          <FileTextIcon className="size-4" />
          Export CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => void runExport(controller.exportExcel)}
        >
          <FileSpreadsheetIcon className="size-4" />
          Export Excel
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void runExport(controller.exportPdf)}>
          <FileTextIcon className="size-4" />
          Export PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
