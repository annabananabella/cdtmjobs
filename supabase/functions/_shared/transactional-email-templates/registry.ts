/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export type TemplateData = Record<string, unknown>

export interface TemplateEntry {
  // Each template has its own props; the registry only needs to render it.
  // deno-lint-ignore no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>
  subject: string | ((data: TemplateData) => string)
  to?: string
  displayName?: string
  previewData?: TemplateData
}

import { template as subscriptionConfirmation } from './subscription-confirmation.tsx'
import { template as listingRefreshCheck } from './listing-refresh-check.tsx'
import { template as listingTakenDown } from './listing-taken-down.tsx'
import { template as jobPublished } from './job-published.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'subscription-confirmation': subscriptionConfirmation,
  'listing-refresh-check': listingRefreshCheck,
  'listing-taken-down': listingTakenDown,
  'job-published': jobPublished,
}
