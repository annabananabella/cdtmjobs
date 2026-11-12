/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps { siteName: string; confirmationUrl: string }

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>your login link for cdtmjobs</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <div style={logoWrap}>
            <span style={logoBlack}>cdtm</span>
            <span style={logoGreen}>jobs.</span>
          </div>
          <Heading style={h1}>your login link.</Heading>
          <Text style={subtitleText}>
            click the button below to sign in. this link will expire shortly.
          </Text>
        </Section>

        <Hr style={divider} />

        <Section style={ctaSection}>
          <Button style={ctaButton} href={confirmationUrl}>sign in.</Button>
        </Section>

        <Hr style={divider} />

        <Text style={footerText}>
          if you didn't request this link, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }
const container = { padding: '48px 28px', maxWidth: '520px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, marginBottom: '0' }
const logoWrap = { marginBottom: '28px', fontFamily: "'JetBrains Mono', monospace", fontSize: '18px', fontWeight: 800, letterSpacing: '0.1em' }
const logoBlack = { color: '#0a0c0f' }
const logoGreen = { color: '#0BD99B' }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#0a0c0f', margin: '0 0 12px', letterSpacing: '-0.01em' }
const subtitleText = { fontSize: '14px', color: '#6b7280', lineHeight: '1.7', margin: '0' }
const divider = { borderColor: '#f3f4f6', margin: '24px 0' }
const ctaSection = { textAlign: 'center' as const }
const ctaButton = { backgroundColor: '#0BD99B', color: '#0a0c0f', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 700, padding: '14px 32px', borderRadius: '10px', textDecoration: 'none', letterSpacing: '0.05em' }
const footerText = { fontSize: '12px', color: '#9ca3af', lineHeight: '1.5', textAlign: 'center' as const, margin: '0' }
