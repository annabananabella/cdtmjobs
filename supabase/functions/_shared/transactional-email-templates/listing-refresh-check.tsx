import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'cdtmjobs'
const MANAGE_URL = 'https://cdtmjobs.com/post-job'

interface Job {
  job_title: string
  posted_ago: string
}

interface Props {
  firstName?: string
  jobs?: Job[]
}

const ListingRefreshCheckEmail = ({ firstName, jobs = [] }: Props) => {
  const greeting = firstName ? `hi ${firstName},` : 'hi,'
  return (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>are your {SITE_NAME} listings still open?</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <div style={logoWrap}>
            <span style={logoBlack}>cdtm</span>
            <span style={logoGreen}>jobs.</span>
          </div>
          <Heading style={h1}>quick check-in.</Heading>
          <Text style={subtitleText}>
            {greeting} {jobs.length === 1 ? 'your posting below is' : 'your postings below are'} more than 6 weeks old. are {jobs.length === 1 ? 'they' : 'these roles'} still open?
          </Text>
        </Section>

        <Hr style={divider} />

        <Section style={contentSection}>
          <Text style={sectionLabel}>your listings</Text>
          {jobs.map((job, i) => (
            <Section key={i} style={jobCard}>
              <Text style={jobTitleStyle}>{job.job_title}</Text>
              <Text style={jobCompany}>posted {job.posted_ago}</Text>
            </Section>
          ))}
        </Section>

        <Section style={ctaSection}>
          <Button href={MANAGE_URL} style={ctaButton}>
            update or take down.
          </Button>
          <Text style={helperText}>
            enter this email at <Link href={MANAGE_URL} style={linkStyle}>{MANAGE_URL.replace('https://', '')}</Link> to sign in with a magic link and manage your listings.
          </Text>
        </Section>

        <Hr style={divider} />

        <Text style={footerText}>
          no action needed if everything is still accurate. we just want to keep the board fresh. reply to this email if you have questions.
        </Text>
      </Container>
    </Body>
  </Html>
  )
}

export const template = {
  component: ListingRefreshCheckEmail,
  subject: 'are your cdtmjobs listings still open?',
  displayName: 'Listing refresh check',
  previewData: {
    firstName: 'Jane',
    jobs: [
      { job_title: 'Associate Account Manager - DACH (d/f/m)', posted_ago: '14 weeks ago' },
      { job_title: 'Business Development Representative (d/f/m) - Medium Business', posted_ago: '14 weeks ago' },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }
const container = { padding: '48px 28px', maxWidth: '520px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, marginBottom: '0' }
const logoWrap = { marginBottom: '28px', fontFamily: "'JetBrains Mono', monospace", fontSize: '18px', fontWeight: 800, letterSpacing: '0.1em' }
const logoBlack = { color: '#0a0c0f' }
const logoGreen = { color: '#0BD99B' }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#0a0c0f', margin: '0 0 12px', letterSpacing: '-0.01em' }
const subtitleText = { fontSize: '14px', color: '#6b7280', lineHeight: '1.7', margin: '0' }
const divider = { borderColor: '#f3f4f6', margin: '24px 0' }
const contentSection = { textAlign: 'center' as const }
const sectionLabel = { fontSize: '11px', fontWeight: 600, color: '#0BD99B', letterSpacing: '0.1em', textTransform: 'uppercase' as const, margin: '0 0 16px' }
const jobCard = { marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid #f3f4f6', textAlign: 'left' as const }
const jobTitleStyle = { color: '#0a0c0f', fontSize: '15px', fontWeight: 600, margin: '0' }
const jobCompany = { color: '#6b7280', fontSize: '13px', margin: '4px 0 0' }
const ctaSection = { textAlign: 'center' as const, marginTop: '24px' }
const ctaButton = { backgroundColor: '#0BD99B', color: '#0a0c0f', fontSize: '13px', fontWeight: 600, padding: '12px 32px', borderRadius: '8px', textDecoration: 'none' }
const helperText = { fontSize: '12px', color: '#6b7280', lineHeight: '1.6', margin: '16px 0 0' }
const linkStyle = { color: '#0BD99B', textDecoration: 'none' }
const footerText = { fontSize: '12px', color: '#9ca3af', lineHeight: '1.6', margin: '0', textAlign: 'center' as const }
