import { useState } from "react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import FloatingParticles from "@/components/FloatingParticles";
import LanguageToggle from "@/components/LanguageToggle";

const content = {
  en: {
    title: "Privacy Policy",
    subtitle: "How we handle your data",
    overview: "Overview",
    overviewText1: "CDTM Jobs only collects data that is strictly necessary for the functioning of the website.",
    overviewText2: "We do not collect any additional personal data beyond what is required to provide our services.",
    dataCollect: "Data We Collect",
    dataSub: "Newsletter subscribers",
    dataSubDesc: "Email address, solely to send job listing emails.",
    dataJob: "Job submissions",
    dataJobDesc: "Company name, email, and listing details, solely to display on the platform.",
    dataNote: "We do not collect analytics, tracking, or any other data beyond the above.",
    dataUse: "How We Use Your Data",
    dataUse1: "Display job listings on the platform.",
    dataUse2: "Send bi-weekly newsletter emails to subscribers.",
    dataUse3: "Identify CDTM alumni for exclusive listings via email verification.",
    storage: "Data Storage",
    storageText: "Your data is stored securely on servers within the European Union. We do not sell, trade, or share your personal data with third parties, except as required by law.",
    rights: "Your Rights",
    rightsText: "Under GDPR, you have the right to access, correct, or delete your personal data at any time.",
    rightsContact: "Contact us at",
    cookies: "Cookies",
    cookiesText: "This platform uses only essential cookies required for functionality. No tracking or advertising cookies.",
    back: "← Back to home",
  },
  de: {
    title: "Datenschutzerklärung",
    subtitle: "Wie wir mit Ihren Daten umgehen",
    overview: "Überblick",
    overviewText1: "CDTM Jobs erhebt nur Daten, die für den Betrieb der Website zwingend erforderlich sind.",
    overviewText2: "Wir erheben keine zusätzlichen personenbezogenen Daten über das hinaus, was zur Erbringung unserer Dienste notwendig ist.",
    dataCollect: "Erhobene Daten",
    dataSub: "Newsletter-Abonnenten",
    dataSubDesc: "E-Mail-Adresse, ausschließlich zum Versand von Stellenanzeigen.",
    dataJob: "Stellenanzeigen",
    dataJobDesc: "Firmenname, E-Mail und Anzeigendetails, ausschließlich zur Anzeige auf der Plattform.",
    dataNote: "Wir erheben keine Analyse-, Tracking- oder sonstigen Daten über das Genannte hinaus.",
    dataUse: "Verwendung Ihrer Daten",
    dataUse1: "Anzeige von Stellenangeboten auf der Plattform.",
    dataUse2: "Versand zweiwöchentlicher Newsletter-E-Mails an Abonnenten.",
    dataUse3: "Identifikation von CDTM-Alumni für exklusive Angebote per E-Mail-Verifizierung.",
    storage: "Datenspeicherung",
    storageText: "Ihre Daten werden sicher auf Servern innerhalb der Europäischen Union gespeichert. Wir verkaufen, handeln oder teilen Ihre personenbezogenen Daten nicht mit Dritten, außer wenn gesetzlich vorgeschrieben.",
    rights: "Ihre Rechte",
    rightsText: "Gemäß DSGVO haben Sie jederzeit das Recht, Ihre personenbezogenen Daten einzusehen, zu korrigieren oder zu löschen.",
    rightsContact: "Kontaktieren Sie uns unter",
    cookies: "Cookies",
    cookiesText: "Diese Plattform verwendet ausschließlich essenzielle Cookies, die für die Funktionalität erforderlich sind. Keine Tracking- oder Werbe-Cookies.",
    back: "← Zurück zur Startseite",
  },
};

export default function Privacy() {
  const [lang, setLang] = useState<"en" | "de">("en");
  const t = content[lang];

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <FloatingParticles />
      <Header />

      <main className="container max-w-2xl mx-auto px-6 py-16 relative z-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl text-gradient">{t.title}</h1>
            <p className="text-xs text-muted-foreground mt-2 font-display tracking-wider">{t.subtitle}</p>
          </div>
          <LanguageToggle lang={lang} onToggle={setLang} />
        </div>

          <div className="space-y-8 text-sm text-foreground/80 leading-relaxed">
            <section>
              <h2 className="font-display font-semibold text-foreground text-xs tracking-widest uppercase mb-3">{t.overview}</h2>
              <p>{t.overviewText1}</p>
              <p className="mt-2">{t.overviewText2}</p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-foreground text-xs tracking-widest uppercase mb-3">{t.dataCollect}</h2>
              <ul className="space-y-2">
                <li><strong className="text-foreground">{t.dataSub}</strong>: {t.dataSubDesc}</li>
                <li><strong className="text-foreground">{t.dataJob}</strong>: {t.dataJobDesc}</li>
              </ul>
              <p className="mt-3 text-muted-foreground text-xs">{t.dataNote}</p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-foreground text-xs tracking-widest uppercase mb-3">{t.dataUse}</h2>
              <ul className="space-y-2">
                <li>{t.dataUse1}</li>
                <li>{t.dataUse2}</li>
                <li>{t.dataUse3}</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-semibold text-foreground text-xs tracking-widest uppercase mb-3">{t.storage}</h2>
              <p>{t.storageText}</p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-foreground text-xs tracking-widest uppercase mb-3">{t.rights}</h2>
              <p>{t.rightsText}</p>
              <p className="mt-2">
                {t.rightsContact} <a href="mailto:hello@cdtmjobs.com" className="text-primary hover:underline font-display text-xs tracking-wider">hello@cdtmjobs.com</a>
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-foreground text-xs tracking-widest uppercase mb-3">{t.cookies}</h2>
              <p>{t.cookiesText}</p>
            </section>

            <div className="pt-4">
              <Link to="/" className="font-display text-xs text-primary hover:underline tracking-wider">{t.back}</Link>
            </div>
          </div>
      </main>
      <div className="flex-1" />
      <Footer />
    </div>
  );
}
