/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps { siteName: string; siteUrl: string; confirmationUrl: string }

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to cdtmjobs</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>cdtm<span style={{ color: '#0fbf6f' }}>jobs.</span></Text>
        <Heading style={h1}>you're invited.</Heading>
        <Text style={text}>You've been invited to join cdtmjobs. Click below to accept and create your account.</Text>
        <Button style={button} href={confirmationUrl}>accept invitation.</Button>
        <Text style={footer}>If you weren't expecting this invitation, you can safely ignore this email.</Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', -apple-system, sans-serif" }
const container = { padding: '40px 32px', maxWidth: '480px', margin: '0 auto' }
const logo = { fontFamily: "'JetBrains Mono', monospace", fontSize: '18px', fontWeight: '800' as const, letterSpacing: '0.1em', color: '#0a0c0f', marginBottom: '32px' }
const h1 = { fontFamily: "'JetBrains Mono', monospace", fontSize: '20px', fontWeight: '700' as const, color: '#0a0c0f', letterSpacing: '0.03em', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 28px' }
const button = { backgroundColor: '#0fbf6f', color: '#0a0c0f', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: '700' as const, borderRadius: '10px', padding: '14px 28px', textDecoration: 'none', letterSpacing: '0.05em' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '36px 0 0', lineHeight: '1.5' }
