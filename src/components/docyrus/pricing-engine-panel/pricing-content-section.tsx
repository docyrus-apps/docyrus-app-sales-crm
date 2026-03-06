'use client';

import { Separator } from '@/components/ui/separator';
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import { tUi } from '@/lib/ui-i18n';

import { usePricingEngine } from './contexts/pricing-context';

interface PricingContentSectionProps {
  showDescription?: boolean;
  showTerms?: boolean;
}

export function PricingContentSection({
  showDescription = true,
  showTerms = true
}: PricingContentSectionProps) {
  const {
    description, termsAndConditions, setDescription, setTermsAndConditions, readOnly, locale
  } = usePricingEngine();

  if (!showDescription && !showTerms) return null;

  if (showDescription && !showTerms) {
    return (
      <>
        <Separator />
        <div className="px-4 py-3">
          <label className="mb-2 block text-sm font-medium text-muted-foreground">
            {tUi(locale, 'pepDescription')}
          </label>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={tUi(locale, 'pepDescription')}
            className="min-h-[80px] resize-y"
            disabled={readOnly} />
        </div>
      </>
    );
  }

  if (!showDescription && showTerms) {
    return (
      <>
        <Separator />
        <div className="px-4 py-3">
          <label className="mb-2 block text-sm font-medium text-muted-foreground">
            {tUi(locale, 'pepTerms')}
          </label>
          <Textarea
            value={termsAndConditions}
            onChange={e => setTermsAndConditions(e.target.value)}
            placeholder={tUi(locale, 'pepTerms')}
            className="min-h-[80px] resize-y"
            disabled={readOnly} />
        </div>
      </>
    );
  }

  return (
    <>
      <Separator />
      <div className="px-4 py-3">
        <Tabs defaultValue="description">
          <TabsList>
            <TabsTrigger value="description">{tUi(locale, 'pepDescription')}</TabsTrigger>
            <TabsTrigger value="terms">{tUi(locale, 'pepTerms')}</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-3">
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={tUi(locale, 'pepDescription')}
              className="min-h-[80px] resize-y"
              disabled={readOnly} />
          </TabsContent>
          <TabsContent value="terms" className="mt-3">
            <Textarea
              value={termsAndConditions}
              onChange={e => setTermsAndConditions(e.target.value)}
              placeholder={tUi(locale, 'pepTerms')}
              className="min-h-[80px] resize-y"
              disabled={readOnly} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}