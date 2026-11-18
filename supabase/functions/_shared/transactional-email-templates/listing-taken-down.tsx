import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'cdtmjobs'

interface Job {
  job_title: string
  posted_ago: string
  reactivate_url: string
}

interface Props {
  firstName?: string
  jobs?: Job[]
}

const ListingTakenDownEmail = ({ firstName, jobs = [] }: Props) => {
  const greeting = firstName ? `hi ${firstName.toLowerCase()},` : 'hi,'
  const many = jobs.length > 1
  return (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>we took down {many ? 'your postings' : 'your posting'} on {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <div style={logoWrap}>
            <span style={logoBlack}>cdtm</span>
            <span style={logoGreen}>jobs.</span>
          </div>
          <Heading style={h1}>we took {many ? 'them' : 'it'} down.</Heading>
          <Text style={subtitleText}>{greeting}</Text>
          <Text style={subtitleText}>
            {many ? 'these listings are' : 'this listing is'} more than 6 weeks old,
          </Text>
          <Text style={subtitleText}>
            so we removed {many ? 'them' : 'it'} from the board to keep things fresh.
          </Text>
          <Text style={subtitleText}>
            still hiring? bring {many ? 'them' : 'it'} back in one click.
          </Text>
        </Section>

        <Hr style={divider} />

        <Section style={contentSection}>
          <Text style={sectionLabel}>your listings</Text>
          {jobs.map((job, i) => (
            <Section key={i} style={jobCard}>
              <Text style={jobTitleStyle}>{job.job_title}</Text>
              <Text style={jobMeta}>posted {job.posted_ago}</Text>
              <Button href={job.reactivate_url} style={ctaButton}>
                keep this posting active.
              </Button>
            </Section>
          ))}
        </Section>

        <Hr style={divider} />

        <Text style={footerText}>
          no action needed if {many ? 'these roles are' : 'this role is'} filled. questions? just reply to this email.
        </Text>
      </Container>
    </Body>
  </Html>
  )
}

export const template = {
  component: ListingTakenDownEmail,
  subject: 'we took down your cdtmjobs listing. still hiring?',
  displayName: 'Listing taken down',
  previewData: {
    firstName: 'Jane',
    jobs: [
      { job_title: 'Associate Account Manager - DACH (d/f/m)', posted_ago: '14 weeks ago', reactivate_url: 'https://cdtmjobs.com/reactivate-job?token=preview' },
      { job_title: 'Business Development Representative (d/f/m)', posted_ago: '14 weeks ago', reactivate_url: 'https://cdtmjobs.com/reactivate-job?token=preview2' },
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
const subtitleText = { fontSize: '14px', color: '#6b7280', lineHeight: '1.7', margin: '0', textAlign: 'center' as const }
const divider = { borderColor: '#f3f4f6', margin: '24px 0' }
const contentSection = { textAlign: 'center' as const }
const sectionLabel = { fontSize: '11px', fontWeight: 600, color: '#0BD99B', letterSpacing: '0.1em', textTransform: 'uppercase' as const, margin: '0 0 16px' }
const jobCard = { marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f3f4f6', textAlign: 'left' as const }
const jobTitleStyle = { color: '#0a0c0f', fontSize: '15px', fontWeight: 600, margin: '0' }
const jobMeta = { color: '#6b7280', fontSize: '13px', margin: '4px 0 12px' }
const ctaButton = { backgroundColor: '#0BD99B', color: '#0a0c0f', fontSize: '13px', fontWeight: 600, padding: '10px 22px', borderRadius: '8px', textDecoration: 'none', display: 'inline-block' as const }
const footerText = { fontSize: '12px', color: '#9ca3af', lineHeight: '1.6', margin: '0', textAlign: 'center' as const }
