'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircleIcon, ChevronDownIcon, ChevronRightIcon } from '@stocky/icons';
import type { CompanyUserRole, Location, Product } from '@stocky/types';
import { useTranslation } from '@/lib/i18n';

export interface StockCountReviewWidgetProps {
  counts: any[];
  locations: Location[];
  products: Product[];
  userRole: CompanyUserRole;
  onReview: (sessionId: string, approve: boolean) => void;
}

export function StockCountReviewWidget({ counts, locations, products, userRole, onReview }: StockCountReviewWidgetProps) {
  const { t, locale } = useTranslation();
  const locationMap = useMemo(() => new Map(locations.map((location) => [location.id, location.name])), [locations]);
  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const submitted = counts.filter((count) => count.status === 'submitted');

  return (
    <section className="space-y-5 text-start">
      <div>
        <p className="text-xs font-medium text-stocky-primary uppercase tracking-[0.12em]">{t('stockCount.managerReviewEyebrow')}</p>
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-stocky-text-main mt-1">{t('stockCount.managerReviewTitle')}</h1>
        <p className="text-sm text-stocky-text-sub mt-1">{t('stockCount.managerReviewSubtitle')}</p>
      </div>
      <div className="rounded-2xl bg-white border border-stocky-border-subtle overflow-hidden">
        {submitted.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <CheckCircleIcon size="md" className="mx-auto text-emerald-600/60" />
            <h2 className="mt-3 text-base font-medium text-stocky-text-main">{t('stockCount.noCountsReview')}</h2>
            <p className="mt-1 text-sm text-stocky-text-sub">{t('stockCount.noCountsReviewDesc')}</p>
          </div>
        ) : (
          <div className="divide-y divide-stocky-border-subtle">
            {submitted.map((count) => {
              const lines = count.lines || [];
              const varianceLines = lines.filter((line: any) => Number(line.counted_quantity ?? 0) !== Number(line.expected_quantity ?? 0));
              const expanded = expandedId === count.id;
              const formattedDate = count.submitted_at
                ? new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(count.submitted_at))
                : t('common.justNow');

              return (
                <div key={count.id} className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 text-start">
                      <p className="text-sm font-medium text-stocky-text-main">
                        {t('stockCount.locationCountTitle', { location: locationMap.get(count.location_id) || t('common.location') })}
                      </p>
                      <p className="text-xs text-stocky-text-sub mt-1">
                        {t('stockCount.countSummary', {
                          time: formattedDate,
                          products: lines.length,
                          differences: varianceLines.length,
                          plural: varianceLines.length === 1 ? '' : 's',
                        })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {lines.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedId(expanded ? null : count.id)}
                          className="h-9 px-3 rounded-lg border border-stocky-border-subtle text-xs inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          {expanded ? <ChevronDownIcon size="xs" /> : <ChevronRightIcon size="xs" className="rtl:rotate-180" />}
                          {expanded ? t('stockCount.hideDetails') : t('stockCount.reviewDetails')}
                        </button>
                      )}
                      {userRole !== 'staff' && (
                        <>
                          <button
                            type="button"
                            onClick={() => onReview(count.id, false)}
                            className="h-9 px-3 rounded-lg border border-red-200 text-red-700 text-xs cursor-pointer"
                          >
                            {t('stockCount.reject')}
                          </button>
                          <button
                            type="button"
                            onClick={() => onReview(count.id, true)}
                            className="h-9 px-3 rounded-lg bg-stocky-primary text-white text-xs font-medium cursor-pointer"
                          >
                            {t('stockCount.approveDifferences')}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {expanded && (
                    <div className="mt-4 rounded-xl border border-stocky-border-subtle overflow-hidden text-start">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 px-3 py-2 bg-stocky-bg-global text-[10px] font-medium uppercase tracking-wide text-stocky-text-sub">
                        <span>{t('stockCount.colProduct')}</span>
                        <span>{t('stockCount.colExpected')}</span>
                        <span>{t('stockCount.colCounted')}</span>
                      </div>
                      {lines.map((line: any) => {
                        const product = productMap.get(line.product_id);
                        const variance = Number(line.counted_quantity ?? 0) - Number(line.expected_quantity ?? 0);
                        return (
                          <div key={line.id} className="px-3 py-3 border-t border-stocky-border-subtle">
                            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 text-xs">
                              <span className="font-medium text-stocky-text-main truncate">{product?.name || t('inventory.productName')}</span>
                              <span className="text-stocky-text-sub">{line.expected_quantity}</span>
                              <span className={variance === 0 ? 'text-stocky-text-sub' : variance > 0 ? 'text-emerald-700 font-medium' : 'text-red-700 font-medium'}>
                                {line.counted_quantity} {variance !== 0 ? `(${variance > 0 ? '+' : ''}${variance})` : ''}
                              </span>
                            </div>
                            {line.variance_reason && (
                              <p className="mt-1 text-[11px] text-stocky-text-sub">
                                {t('stockCount.reasonLabel', { reason: line.variance_reason })}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
