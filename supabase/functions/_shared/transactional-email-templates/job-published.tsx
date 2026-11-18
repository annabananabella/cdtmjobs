import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { firstName?: string; jobTitle?: string; companyName?: string }

const JobPublishedEmail = ({ firstName, jobTitle, companyName }: Props) => {
  const role = jobTitle ? `${jobTitle}${companyName ? ` at ${companyName}` : ''}` : 'your job post'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>your job post is live on cdtmjobs</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={center}>
            <div style={logoWrap}><span style={{ color: '#0a0c0f' }}>cdtm</span><span style={{ color: '#0BD99B' }}>jobs.</span></div>
            <Heading style={h1}>it's live.</Heading>
            <Text style={sub}>{firstName ? `hi ${firstName.toLowerCase()},` : 'hi,'}</Text>
            <Text style={sub}>thanks for sending it over.</Text>
            <Text style={sub}><strong style={{ color: '#0a0c0f' }}>{role}</strong> is now on the board.</Text>
            <Section style={{ marginTop: '24px' }}>
              <Button href="https://cdtmjobs.com" style={cta}>see the board.</Button>
            </Section>
          </Section>
          <Hr style={divider} />
          <Text style={footer}>spotted a mistake? just reply to this email.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: JobPublishedEmail,
  subject: (d: Record<string, unknown>) => d?.jobTitle ? `your job post is live: ${d.jobTitle}` : 'your job post is live on cdtmjobs',
  displayName: 'Job post published',
  previewData: { firstName: 'Jane', jobTitle: 'Commercial Operator', companyName: 'Samplecorp' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }
const container = { padding: '48px 28px', maxWidth: '520px', margin: '0 auto' }
const center = { textAlign: 'center' as const }
const logoWrap = { marginBottom: '28px', fontFamily: "'JetBrains Mono', monospace", fontSize: '18px', fontWeight: 800, letterSpacing: '0.1em' }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#0a0c0f', margin: '0 0 12px' }
const sub = { fontSize: '14px', color: '#6b7280', lineHeight: '1.7', margin: '0', textAlign: 'center' as const }
const cta = { backgroundColor: '#0BD99B', color: '#0a0c0f', fontSize: '13px', fontWeight: 600, padding: '10px 22px', borderRadius: '8px', textDecoration: 'none', display: 'inline-block' as const }
const divider = { borderColor: '#f3f4f6', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#9ca3af', lineHeight: '1.6', margin: '0', textAlign: 'center' as const }
