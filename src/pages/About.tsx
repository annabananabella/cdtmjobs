import { useState } from "react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import FloatingParticles from "@/components/FloatingParticles";
import LanguageToggle from "@/components/LanguageToggle";

const content = {
  en: {
    title: "About",
    subtitle: "What CDTM Jobs is and how it works",
    intro:
      "CDTM Jobs is a career board for the CDTM network. It lists open roles at startups and companies that CDTM alumni founded, lead or are affiliated with, from early stage teams to established companies.",
    howTitle: "How jobs get here",
    howBefore: "Hiring teams post a job directly through the form, or they send the listing to",
    or: "or",
    howAfter: ". We also pick up roles shared in Slack and on company careers pages.",
    checkTitle: "What we check",
    check1:
      "Listings that reach us by email, Slack or other channels are processed automatically: the job details are extracted, the formatting is tidied and missing information is added from the job page.",
    check2:
      "Before such a listing goes live, a person makes one final go or no-go decision. Companies posting through the form publish their listings directly.",
    check3: "A listing that no longer points to a live job page is taken down.",
    visibilityTitle: "Who can see what",
    visibility:
      "Public listings are open to everyone. Listings marked CDTM are only visible after signing in with a CDTM email address.",
    newsletterTitle: "Newsletter",
    newsletterBefore: "The newsletter arrives every two weeks with the newest roles. You can subscribe on the",
    newsletterLink: "newsletter page",
    newsletterAfter: "and unsubscribe from any email.",
    contactTitle: "Contact",
    contact: "Questions, corrections and new listings:",
    postJob: "post a job.",
    findRole: "find a role.",
    back: "← Back to home",
  },
  de: {
    title: "Über uns",
    subtitle: "Was CDTM Jobs ist und wie es funktioniert",
    intro:
      "CDTM Jobs ist eine Jobbörse für das CDTM-Netzwerk. Hier finden Sie offene Stellen bei Startups und Unternehmen, die von CDTM-Alumni gegründet oder geleitet werden oder mit CDTM verbunden sind, vom frühen Startup bis zum etablierten Unternehmen.",
    howTitle: "Wie Stellen hierher kommen",
    howBefore: "Unternehmen veröffentlichen Stellen direkt über das Formular oder senden die Anzeige an",
    or: "oder",
    howAfter: ". Außerdem greifen wir Stellen auf, die in Slack und auf Karriereseiten von Unternehmen geteilt werden.",
    checkTitle: "Was wir prüfen",
    check1:
      "Anzeigen, die uns per E-Mail, Slack oder über andere Kanäle erreichen, werden automatisch verarbeitet: Die Stellendetails werden ausgelesen, die Formatierung wird vereinheitlicht und fehlende Angaben werden von der Stellenseite ergänzt.",
    check2:
      "Bevor eine solche Anzeige online geht, trifft eine Person eine abschließende Entscheidung: veröffentlichen oder nicht. Unternehmen, die das Formular nutzen, veröffentlichen ihre Anzeigen direkt.",
    check3: "Eine Anzeige, deren Stellenseite nicht mehr erreichbar ist, wird entfernt.",
    visibilityTitle: "Wer was sehen kann",
    visibility:
      "Öffentliche Anzeigen sind für alle sichtbar. Als CDTM gekennzeichnete Anzeigen sind nur nach der Anmeldung mit einer CDTM-E-Mail-Adresse sichtbar.",
    newsletterTitle: "Newsletter",
    newsletterBefore: "Der Newsletter erscheint alle zwei Wochen mit den neuesten Stellen. Sie können ihn auf der",
    newsletterLink: "Newsletter-Seite",
    newsletterAfter: "abonnieren und sich in jeder E-Mail wieder abmelden.",
    contactTitle: "Kontakt",
    contact: "Fragen, Korrekturen und neue Anzeigen:",
    postJob: "stelle posten.",
    findRole: "stelle finden.",
    back: "← Zurück zur Startseite",
  },
};

const sectionTitle = "font-display font-semibold text-foreground text-xs tracking-widest uppercase mb-3";
const inlineLink = "text-primary hover:underline font-display text-xs tracking-wider";

export default function About() {
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
          <p className="text-foreground/90">{t.intro}</p>

          <section>
            <h2 className={sectionTitle}>{t.howTitle}</h2>
            <p>
              {t.howBefore}{" "}
              <a href="mailto:hello@cdtmjobs.com" className={inlineLink}>hello@cdtmjobs.com</a>{" "}
              {t.or}{" "}
              <a href="mailto:job@cdtmjobs.com" className={inlineLink}>job@cdtmjobs.com</a>
              {t.howAfter}
            </p>
          </section>

          <section>
            <h2 className={sectionTitle}>{t.checkTitle}</h2>
            <p>{t.check1}</p>
            <p className="mt-2">{t.check2}</p>
            <p className="mt-2">{t.check3}</p>
          </section>

          <section>
            <h2 className={sectionTitle}>{t.visibilityTitle}</h2>
            <p>{t.visibility}</p>
          </section>

          <section>
            <h2 className={sectionTitle}>{t.newsletterTitle}</h2>
            <p>
              {t.newsletterBefore}{" "}
              <Link to="/newsletter" className={inlineLink}>{t.newsletterLink}</Link>{" "}
              {t.newsletterAfter}
            </p>
          </section>

          <section>
            <h2 className={sectionTitle}>{t.contactTitle}</h2>
            <p>
              {t.contact}{" "}
              <a href="mailto:hello@cdtmjobs.com" className={inlineLink}>hello@cdtmjobs.com</a>
            </p>
          </section>

          <div className="flex items-center gap-3 pt-2">
            <Link
              to="/post-job"
              className="inline-flex items-center justify-center w-36 px-5 py-2.5 rounded-lg border border-primary bg-transparent text-foreground font-display text-xs tracking-wider font-semibold hover:bg-primary hover:text-primary-foreground active:bg-primary/80 transition-colors"
            >
              {t.postJob}
            </Link>
            <Link
              to="/?view=board"
              className="inline-flex items-center justify-center w-36 px-5 py-2.5 rounded-lg border border-secondary bg-transparent text-foreground font-display text-xs tracking-wider font-semibold hover:bg-secondary hover:text-secondary-foreground active:bg-secondary/80 transition-colors"
            >
              {t.findRole}
            </Link>
          </div>

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
