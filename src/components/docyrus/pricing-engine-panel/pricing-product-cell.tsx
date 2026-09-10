'use client'

import { useMemo, useState } from 'react'

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
  const [search, setSearch] = useState('')
  const filteredProducts = useMemo(() => {
    if (!productCatalog) return []

    const query = search.trim().toLowerCase()

    if (!query) return productCatalog

    return productCatalog.filter((product) =>
      [product.name, product.category, product.id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    )
  }, [productCatalog, search])

  const handleRemoteProductSelect = () => {
    if (!onProductSelect) return
    onProductSelect(lineId, (product) => {
      setLineItemFromProduct(lineId, product)
    })
  }

  if (productCatalog) {
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
            className="h-8 w-full min-w-30 justify-between px-2 font-normal shadow-none"
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
        <PopoverContent
          className="w-80 overflow-hidden p-0"
          align="start"
          onWheelCapture={(event) => event.stopPropagation()}
          onWheel={(event) => event.stopPropagation()}
        >
          <Command shouldFilter={false}>
            <CommandInput
              value={search}
              onValueChange={setSearch}
              placeholder={tUi(locale, 'pepSearchProducts')}
            />
            <CommandList className="max-h-[280px] overflow-y-auto overscroll-contain">
              {filteredProducts.length === 0 ? (
                <CommandEmpty>{tUi(locale, 'pepNoResults')}</CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredProducts.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={product.id}
                      onSelect={() => {
                        setLineItemFromProduct(lineId, product)
                        setOpen(false)
                        setSearch('')
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-3.5 w-3.5',
                          productId === product.id
                            ? 'opacity-100'
                            : 'opacity-0',
                        )}
                      />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm">{product.name}</span>
                        {product.category && (
                          <span className="truncate text-xs text-muted-foreground">
                            {product.category}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
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
        className="h-8 min-w-30 border-0 bg-transparent px-1 shadow-none focus-visible:ring-1"
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
