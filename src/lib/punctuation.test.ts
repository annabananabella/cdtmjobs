import { expect, it } from 'vitest';
import { withoutEmDashes } from '../../supabase/functions/_shared/punctuation';
import { cleanJob } from '../../supabase/functions/_shared/job-extraction';

it('removes em dashes from incoming posting fields', () => {
  const job = cleanJob({ job_title: 'Engineer\u2014Platform', description: 'Own features \u2014 from design to delivery.', salary: '80k\u2014100k' });
  expect(job.job_title).toBe('Engineer - Platform');
  expect(job.description).toBe('Own features - from design to delivery.');
  expect(job.salary).toBe('80k - 100k');
});

it('removes encoded em dashes but preserves ordinary hyphens and en dashes', () => {
  expect(withoutEmDashes('Full-time &mdash; €60k–€80k &#8212; equity &#x2014; yes')).toBe('Full-time - €60k–€80k - equity - yes');
});