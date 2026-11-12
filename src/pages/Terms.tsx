import { useState } from "react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import FloatingParticles from "@/components/FloatingParticles";
import LanguageToggle from "@/components/LanguageToggle";

const content = {
  en: {
    title: "Terms of Use",
    subtitle: "Last updated November 2026",
    acceptance: "Acceptance",
    acceptanceText: "By accessing and using CDTM Jobs, you agree to these terms. If you do not agree, please do not use the platform.",
    purpose: "Purpose",
    purposeText: "CDTM Jobs is an informational platform only. We aggregate and display job listings from companies founded or led by CDTM alumni. We do not act as a recruiter, employer, or intermediary.",
    purposeNote: "The platform is provided as-is and free of charge.",
    listings: "Job Listings",
    listings1: "Job listings may be submitted manually or sourced through channels such as Slack, WhatsApp, email, and company careers pages. We may process this information automatically and supplement it with our own research before publication.",
    listings2: "Automatically created listings are marked as automated and retain this label after review, corrections, or additional research. They may contain mistakes. We do not endorse listings or guarantee their accuracy, completeness, or legitimacy. Please consult the original job posting and confirm details directly with the hiring company.",
    listings3: 'Listings marked "CDTM Only" are visible exclusively to verified community members.',
    listings4: "We reserve the right to remove listings at our discretion. We also remove listings whose original job-page link is no longer available if we cannot find a replacement direct link.",
    conduct: "User Conduct",
    conductText: "You agree not to submit false, misleading, or spam listings. Abuse may result in removal and blocking.",
    disclaimer: "Disclaimer & Liability",
    disclaimerText1: 'CDTM Jobs is provided "as is" without warranties of any kind. We make no guarantees regarding accuracy, reliability, availability, or functioning of the platform.',
    disclaimerText2: "We shall not be held liable for any damages arising from your use of the platform, including reliance on listing information, application outcomes, or decisions based on displayed content.",
    disclaimerNote: "Users rely on all information at their own risk.",
    changes: "Changes",
    changesText: "We may update these terms at any time. Continued use constitutes acceptance of updated terms.",
    back: "← Back to home",
  },
  de: {
    title: "Nutzungsbedingungen",
    subtitle: "Zuletzt aktualisiert: November 2026",
    acceptance: "Zustimmung",
    acceptanceText: "Durch den Zugang zu und die Nutzung von CDTM Jobs stimmen Sie diesen Bedingungen zu. Wenn Sie nicht einverstanden sind, nutzen Sie die Plattform bitte nicht.",
    purpose: "Zweck",
    purposeText: "CDTM Jobs ist eine rein informative Plattform. Wir aggregieren und zeigen Stellenanzeigen von Unternehmen an, die von CDTM-Alumni gegründet oder geleitet werden. Wir agieren nicht als Personalvermittler, Arbeitgeber oder Vermittler.",
    purposeNote: "Die Plattform wird unentgeltlich und ohne Gewähr bereitgestellt.",
    listings: "Stellenanzeigen",
    listings1: "Stellenanzeigen können manuell eingereicht oder über Kanäle wie Slack, WhatsApp, E-Mail und Karriereseiten von Unternehmen übernommen werden. Wir können diese Informationen automatisch verarbeiten und vor der Veröffentlichung durch eigene Recherchen ergänzen.",
    listings2: "Automatisch erstellte Anzeigen werden als automatisiert gekennzeichnet und behalten diese Kennzeichnung auch nach Prüfung, Korrekturen oder ergänzenden Recherchen. Sie können Fehler enthalten. Wir sprechen keine Empfehlungen für Anzeigen aus und garantieren weder Richtigkeit, Vollständigkeit noch Legitimität. Bitte prüfen Sie die ursprüngliche Stellenanzeige und bestätigen Sie Einzelheiten direkt mit dem einstellenden Unternehmen.",
    listings3: 'Als „CDTM Only" gekennzeichnete Anzeigen sind ausschließlich für verifizierte Community-Mitglieder sichtbar.',
    listings4: "Wir behalten uns das Recht vor, Anzeigen nach eigenem Ermessen zu entfernen. Wir entfernen außerdem Anzeigen, deren ursprüngliche Stellenanzeige nicht mehr erreichbar ist, oder kein neuer direkter Link zu finden ist.",
    conduct: "Nutzerverhalten",
    conductText: "Sie verpflichten sich, keine falschen, irreführenden oder Spam-Anzeigen einzureichen. Missbrauch kann zur Entfernung und Sperrung führen.",
    disclaimer: "Haftungsausschluss",
    disclaimerText1: 'CDTM Jobs wird „wie besehen" ohne jegliche Gewährleistung bereitgestellt. Wir übernehmen keine Garantie für Richtigkeit, Zuverlässigkeit, Verfügbarkeit oder Funktionsfähigkeit der Plattform.',
    disclaimerText2: "Wir haften nicht für Schäden, die aus der Nutzung der Plattform entstehen, einschließlich des Vertrauens auf Anzeigeninformationen, Bewerbungsergebnisse oder Entscheidungen auf Basis angezeigter Inhalte.",
    disclaimerNote: "Nutzer vertrauen auf alle Informationen auf eigenes Risiko.",
    changes: "Änderungen",
    changesText: "Wir können diese Bedingungen jederzeit aktualisieren. Die fortgesetzte Nutzung gilt als Zustimmung zu den aktualisierten Bedingungen.",
    back: "← Zurück zur Startseite",
  },
};

export default function Terms() {
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
              <h2 className="font-display font-semibold text-foreground text-xs tracking-widest uppercase mb-3">{t.acceptance}</h2>
              <p>{t.acceptanceText}</p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-foreground text-xs tracking-widest uppercase mb-3">{t.purpose}</h2>
              <p>{t.purposeText}</p>
              <p className="mt-2">{t.purposeNote}</p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-foreground text-xs tracking-widest uppercase mb-3">{t.listings}</h2>
              <ul className="space-y-2">
                <li>{t.listings1}</li>
                <li>{t.listings2}</li>
                <li>{t.listings3}</li>
                <li>{t.listings4}</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-semibold text-foreground text-xs tracking-widest uppercase mb-3">{t.conduct}</h2>
              <p>{t.conductText}</p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-foreground text-xs tracking-widest uppercase mb-3">{t.disclaimer}</h2>
              <p>{t.disclaimerText1}</p>
              <p className="mt-2">{t.disclaimerText2}</p>
              <p className="mt-2 text-muted-foreground text-xs font-display tracking-wider">{t.disclaimerNote}</p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-foreground text-xs tracking-widest uppercase mb-3">{t.changes}</h2>
              <p>{t.changesText}</p>
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
