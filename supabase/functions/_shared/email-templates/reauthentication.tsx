/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps { token: string }

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code for cdtmjobs</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>cdtm<span style={{ color: '#0fbf6f' }}>jobs.</span></Text>
        <Heading style={h1}>verification code.</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>This code will expire shortly. If you didn't request this, you can safely ignore this email.</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', -apple-system, sans-serif" }
const container = { padding: '40px 32px', maxWidth: '480px', margin: '0 auto' }
const logo = { fontFamily: "'JetBrains Mono', monospace", fontSize: '18px', fontWeight: '800' as const, letterSpacing: '0.1em', color: '#0a0c0f', marginBottom: '32px' }
const h1 = { fontFamily: "'JetBrains Mono', monospace", fontSize: '20px', fontWeight: '700' as const, color: '#0a0c0f', letterSpacing: '0.03em', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 28px' }
const codeStyle = { fontFamily: "'JetBrains Mono', monospace", fontSize: '28px', fontWeight: '800' as const, color: '#0fbf6f', letterSpacing: '0.15em', margin: '0 0 32px' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '36px 0 0', lineHeight: '1.5' }
