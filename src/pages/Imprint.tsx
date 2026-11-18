import { useState } from "react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import FloatingParticles from "@/components/FloatingParticles";
import LanguageToggle from "@/components/LanguageToggle";

const content = {
  en: {
    title: "Legal Notice",
    subtitle: "Information according to § 5 TMG",
    contact: "Contact",
    address: (
      <>
        Annabelle Bockwoldt<br />
        c/o Rosenthaler Straße 44<br />
        10178 Berlin, Germany
      </>
    ),
    contentResponsibility: "Content Responsibility",
    contentResponsibilityText: "Responsible for content according to § 55 Abs. 2 RStV: same as above.",
    liabilityContent: "Liability for Content",
    liabilityContentText: "As a service provider, we are responsible for our own content on these pages according to § 7 Abs.1 TMG. According to §§ 8–10 TMG, we are not obligated to monitor transmitted or stored third-party information.",
    liabilityLinks: "Liability for Links",
    liabilityLinksText: "Our website contains links to external websites over whose content we have no influence. The respective provider is always responsible for the content of linked pages.",
    copyright: "Copyright",
    copyrightText: "Content created by the site operators is subject to German copyright law. Reproduction or commercialization beyond copyright law requires written consent.",
    back: "← Back to home",
  },
  de: {
    title: "Impressum",
    subtitle: "Angaben gemäß § 5 TMG",
    contact: "Kontakt",
    address: (
      <>
        Annabelle Bockwoldt<br />
        c/o Rosenthaler Straße 44<br />
        10178 Berlin, Deutschland
      </>
    ),
    contentResponsibility: "Inhaltlich Verantwortlich",
    contentResponsibilityText: "Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV: wie oben angegeben.",
    liabilityContent: "Haftung für Inhalte",
    liabilityContentText: "Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.",
    liabilityLinks: "Haftung für Links",
    liabilityLinksText: "Unsere Website enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter verantwortlich.",
    copyright: "Urheberrecht",
    copyrightText: "Die durch die Seitenbetreiber erstellten Inhalte unterliegen dem deutschen Urheberrecht. Die Vervielfältigung oder Verwertung außerhalb des Urheberrechts bedarf der schriftlichen Zustimmung.",
    back: "← Zurück zur Startseite",
  },
};

export default function Imprint() {
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
              <h2 className="font-display font-semibold text-foreground text-xs tracking-widest uppercase mb-3">{t.contact}</h2>
              <p>{t.address}</p>
              <p className="mt-3">
                <a href="mailto:hello@cdtmjobs.com" className="text-primary hover:underline font-display text-xs tracking-wider">hello@cdtmjobs.com</a>
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-foreground text-xs tracking-widest uppercase mb-3">{t.contentResponsibility}</h2>
              <p>{t.contentResponsibilityText}</p>
            </section>


            <section>
              <h2 className="font-display font-semibold text-foreground text-xs tracking-widest uppercase mb-3">{t.liabilityContent}</h2>
              <p>{t.liabilityContentText}</p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-foreground text-xs tracking-widest uppercase mb-3">{t.liabilityLinks}</h2>
              <p>{t.liabilityLinksText}</p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-foreground text-xs tracking-widest uppercase mb-3">{t.copyright}</h2>
              <p>{t.copyrightText}</p>
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
