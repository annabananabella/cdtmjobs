import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'cdtmjobs'
const SITE_URL = 'https://cdtmjobs.com/?view=board'

interface Job {
  job_title: string
  company_name: string
  job_url: string
  work_mode?: string
  location?: string
  salary?: string
  cdtm_only?: boolean
}

interface Props {
  isCdtm?: boolean
  jobs?: Job[]
}

const SubscriptionConfirmationEmail = ({ isCdtm = false, jobs = [] }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>you're in. welcome to {SITE_NAME}.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <div style={logoWrap}>
            <span style={logoBlack}>cdtm</span>
            <span style={logoGreen}>jobs.</span>
          </div>
          <Heading style={h1}>you're subscribed.</Heading>
          <Text style={subtitleText}>
            {isCdtm
              ? "welcome to the community. you'll receive bi-weekly job listings, including community-exclusive ones."
              : "you'll receive public job listings bi-weekly."}
          </Text>
        </Section>

        <Hr style={divider} />

        {jobs.length > 0 ? (
          <Section style={contentSection}>
            <Text style={sectionLabel}>current listings</Text>
            {jobs.map((job, i) => (
              <Section key={i} style={jobCard}>
                <a href={job.job_url} style={jobTitleStyle}>{job.job_title}</a>
                <Text style={jobCompany}>{job.company_name}</Text>
                <div>
                  {[job.work_mode, job.location, job.salary, job.cdtm_only ? 'CDTM Exclusive' : null]
                    .filter(Boolean)
                    .map((badge, bi) => (
                      <span key={bi} style={badgeStyle}>{badge}</span>
                    ))}
                </div>
              </Section>
            ))}
          </Section>
        ) : (
          <Section style={contentSection}>
            <Text style={noListingsText}>
              no open listings right now. check back soon.
            </Text>
            <Text style={noListingsSubtext}>
              we'll notify you as soon as new jobs drop.
            </Text>
          </Section>
        )}

        <Section style={ctaSection}>
          <Button href={SITE_URL} style={ctaButton}>
            view all jobs.
          </Button>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SubscriptionConfirmationEmail,
  subject: "you're in. cdtmjobs",
  displayName: 'Subscription confirmation',
  previewData: {
    isCdtm: true,
    jobs: [],
  },
} satisfies TemplateEntry

// Styles - centered layout matching cdtmjobs brand
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
const jobCard = { marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid #f3f4f6', textAlign: 'left' as const }
const jobTitleStyle = { color: '#0BD99B', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }
const jobCompany = { color: '#6b7280', fontSize: '13px', margin: '4px 0 8px' }
const badgeStyle = { display: 'inline-block' as const, background: '#f3f4f6', color: '#6b7280', fontSize: '11px', padding: '3px 10px', borderRadius: '100px', marginRight: '6px', marginBottom: '4px' }
const ctaSection = { textAlign: 'center' as const, marginTop: '24px' }
const ctaButton = { backgroundColor: '#0BD99B', color: '#0a0c0f', fontSize: '13px', fontWeight: 600, padding: '12px 32px', borderRadius: '8px', textDecoration: 'none' }
const noListingsText = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 4px' }
const noListingsSubtext = { fontSize: '13px', color: '#9ca3af', lineHeight: '1.6', margin: '0 0 8px' }
