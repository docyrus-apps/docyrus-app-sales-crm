'use client'

import { useId, useState } from 'react'

import { Check, ChevronsUpDown, Package } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import { tUi } from '@/lib/ui-i18n'

import { usePricingEngine } from './contexts/pricing-context'

interface PricingProductCellProps {
  lineId: string
  name: string
  productId: string | null
}

export function PricingProductCell({
  lineId,
  name,
  productId,
}: PricingProductCellProps) {
  const {
    updateLineItem,
    setLineItemFromProduct,
    onProductSelect,
    productCatalog,
    readOnly,
    locale,
  } = usePricingEngine()

  const [open, setOpen] = useState(false)
  const listboxId = useId()

  const handleRemoteProductSelect = () => {
    if (!onProductSelect) return
    onProductSelect(lineId, (product) => {
      setLineItemFromProduct(lineId, product)
    })
  }

  if (productCatalog && productCatalog.length > 0) {
    const selectedProduct = productId
      ? productCatalog.find((p) => p.id === productId)
      : undefined

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={readOnly}>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-haspopup="listbox"
            className="h-8 w-full min-w-[120px] justify-between px-2 font-normal shadow-none"
          >
            <span
              className={cn(
                'truncate',
                !selectedProduct && 'text-muted-foreground',
              )}
            >
              {selectedProduct?.name ??
                (name || tUi(locale, 'pepSelectProduct'))}
            </span>
            <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent id={listboxId} className="w-[240px] p-0" align="start">
          <Command>
            <CommandInput placeholder={tUi(locale, 'pepSearchProducts')} />
            <CommandList>
              <CommandEmpty>{tUi(locale, 'pepNoResults')}</CommandEmpty>
              <CommandGroup>
                {productCatalog.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.name}
                    onSelect={() => {
                      setLineItemFromProduct(lineId, product)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-3.5 w-3.5',
                        productId === product.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm">{product.name}</span>
                      {product.category && (
                        <span className="text-xs text-muted-foreground">
                          {product.category}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        value={name}
        onChange={(e) => updateLineItem(lineId, { name: e.target.value })}
        placeholder={tUi(locale, 'pepProduct')}
        className="h-8 min-w-[120px] border-0 bg-transparent px-1 shadow-none focus-visible:ring-1"
        disabled={readOnly}
      />
      {onProductSelect && !readOnly && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={handleRemoteProductSelect}
          title={tUi(locale, 'pepSelectProduct')}
        >
          <Package className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
