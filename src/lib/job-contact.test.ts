import { describe, expect, it } from 'vitest';
import { explicitApplicationContact, verifiedJobContact } from '../../supabase/functions/_shared/job-contact';

describe('preferred job-page contact', () => {
  it('recognizes an unambiguous How to apply email without relying on AI', () => {
    expect(explicitApplicationContact('<h2>How to apply</h2><p>Email <a href="mailto:jane@demoworks.example">jane@demoworks.example</a></p></section>')).toBe('jane@demoworks.example');
  });
  it('accepts the preferred email explicitly on the job page', () => {
    expect(verifiedJobContact('jane@demoworks.example', '<h2>How to apply</h2>Email <a href="mailto:jane@demoworks.example">jane@demoworks.example</a>')).toBe('jane@demoworks.example');
  });
  it('never fills an invented contact or an unselected footer email', () => {
    expect(verifiedJobContact('jobs@demoworks.example', 'Email jane@demoworks.example')).toBeNull();
    expect(verifiedJobContact(null, 'Privacy: privacy@demoworks.example')).toBeNull();
  });
});