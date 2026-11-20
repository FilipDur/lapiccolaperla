import { useState } from "react";
import { ArrowRight, CalendarDays, Check, ChevronDown, CircleAlert, Phone, UsersRound } from "lucide-react";
import { newYearCopy, newYearDate } from "./newYearCopy.js";
import { routeHref } from "./routes.js";

const copy = {
  cs: {
    heading: ["Stůl", "na Silvestra."],
    visit: "Vaše návštěva", contact: "Kontaktní údaje",
    phone: "Telefon", date: "Datum",
    noteHint: "Například alergie nebo přání k posezení",
    errors: { guests: "Zadejte počet hostů od 1 do 99.", time: "Zadejte čas ve formátu hodiny a minuty.", name: "Doplňte své jméno.", phone: "Doplňte číslice telefonního čísla.", email: "Zadejte e-mail ve tvaru jmeno@domena.cz." },
    intro: "Napište nám, v kolika byste chtěli přijít. Ohledně dostupnosti se vám ozveme e-mailem.",
    name: "Jméno a příjmení", email: "E-mail", guests: "Počet hostů", time: "Preferovaný čas",
    note: "Poznámka", optional: "nepovinné", send: "Odeslat poptávku", pending: "Odesíláme…",
    privacy: "Ochrana soukromí", purpose: "Údaje použijeme k vyřízení poptávky.",
    sent: "Poptávka odeslána. S potvrzením dostupnosti se vám ozveme e-mailem.",
    preview: "Testovací poptávka prošla. V tomto náhledu se e-maily neodesílají.",
    openEmail: "Připravit e-mail", draft: "V e-mailové aplikaci zprávu zkontrolujte a odešlete restauraci.",
    invalid: "Zkontrolujte prosím vyplněné údaje.",
    rate_limited: "Odeslali jste více poptávek v krátké době. Zkuste to prosím za chvíli.",
    closed: "Poptávky na tento termín jsou uzavřené.",
    error: "Poptávku se nepodařilo odeslat. Zkuste to znovu nebo nám zavolejte.",
  },
  en: {
    heading: ["A table for", "New Year’s Eve."],
    visit: "Your visit", contact: "Contact details",
    phone: "Phone number", date: "Date",
    noteHint: "For example, allergies or seating preferences",
    errors: { guests: "Enter a guest count between 1 and 99.", time: "Enter the time in hours and minutes.", name: "Enter your name.", phone: "Include the digits of your phone number.", email: "Enter an email address such as name@example.com." },
    intro: "Tell us how many guests will be joining you. We’ll email you about table availability.",
    name: "Full name", email: "Email", guests: "Number of guests", time: "Preferred time",
    note: "Note", optional: "optional", send: "Send enquiry", pending: "Sending…",
    privacy: "Privacy policy", purpose: "We use your details to respond to your enquiry.",
    sent: "Enquiry sent. We’ll email you to confirm availability.",
    preview: "The test enquiry went through. This preview does not send email.",
    openEmail: "Prepare email", draft: "Review and send the message to the restaurant in your email app.",
    invalid: "Please check your details.",
    rate_limited: "You sent several enquiries in a short time. Please try again in a few minutes.",
    closed: "Enquiries for this date are closed.",
    error: "We couldn’t send your enquiry. Please try again or call us.",
  },
  it: {
    heading: ["Un tavolo", "per Capodanno."],
    visit: "La vostra visita", contact: "Recapiti",
    phone: "Telefono", date: "Data",
    noteHint: "Ad esempio, allergie o preferenze per il tavolo",
    errors: { guests: "Indicate un numero di ospiti da 1 a 99.", time: "Indicate l’ora e i minuti.", name: "Inserite il vostro nome.", phone: "Inserite le cifre del numero di telefono.", email: "Inserite un indirizzo e-mail come nome@esempio.it." },
    intro: "Diteci quante persone verranno. Vi risponderemo via e-mail per confermare la disponibilità.",
    name: "Nome e cognome", email: "E-mail", guests: "Numero di ospiti", time: "Orario preferito",
    note: "Nota", optional: "facoltativo", send: "Invia la richiesta", pending: "Invio in corso…",
    privacy: "Informativa sulla privacy", purpose: "Usiamo i vostri dati per rispondere alla richiesta.",
    sent: "Richiesta inviata. Vi scriveremo per confermare la disponibilità.",
    preview: "La richiesta di prova è riuscita. Questa anteprima non invia e-mail.",
    openEmail: "Prepara l’e-mail", draft: "Controllate il messaggio e inviatelo al ristorante dalla vostra app di posta.",
    invalid: "Controllate i dati inseriti.",
    rate_limited: "Avete inviato più richieste in poco tempo. Riprova tra qualche minuto.",
    closed: "Le richieste per questa data sono chiuse.",
    error: "Non siamo riusciti a inviare la richiesta. Riprova o chiamaci.",
  },
  de: {
    heading: ["Ihr Tisch", "an Silvester."],
    visit: "Ihr Besuch", contact: "Kontaktdaten",
    phone: "Telefonnummer", date: "Datum",
    noteHint: "Zum Beispiel Allergien oder Sitzplatzwünsche",
    errors: { guests: "Geben Sie eine Gästezahl zwischen 1 und 99 ein.", time: "Geben Sie die Uhrzeit in Stunden und Minuten an.", name: "Geben Sie Ihren Namen ein.", phone: "Geben Sie die Ziffern Ihrer Telefonnummer ein.", email: "Geben Sie eine E-Mail-Adresse wie name@beispiel.de ein." },
    intro: "Für wie viele Gäste dürfen wir planen? Wir melden uns per E-Mail und teilen Ihnen mit, ob ein Tisch frei ist.",
    name: "Vor- und Nachname", email: "E-Mail-Adresse", guests: "Anzahl der Gäste", time: "Gewünschte Uhrzeit",
    note: "Anmerkungen", optional: "optional", send: "Anfrage senden", pending: "Wird gesendet …",
    privacy: "Datenschutz", purpose: "Wir verwenden Ihre Angaben, um Ihre Anfrage zu beantworten.",
    sent: "Ihre Anfrage ist eingegangen. Wir melden uns per E-Mail bei Ihnen.",
    preview: "Die Testanfrage war erfolgreich. In dieser Vorschau werden keine E-Mails versendet.",
    openEmail: "E-Mail vorbereiten", draft: "Prüfen Sie die Nachricht in Ihrem E-Mail-Programm und senden Sie sie an das Restaurant.",
    invalid: "Bitte überprüfen Sie Ihre Angaben.",
    rate_limited: "Sie haben mehrere Anfragen kurz hintereinander gesendet. Bitte versuchen Sie es in einigen Minuten erneut.",
    closed: "Für diesen Termin nehmen wir keine Anfragen mehr an.",
    error: "Ihre Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder rufen Sie uns an.",
  },
};

const endpoint = "/api/silvestr-reservation";
const reservationEmail = "la.piccola.perla@email.cz";
const guestCounts = Array.from({ length: 99 }, (_, index) => index + 1);
const eventDay = new Date(newYearDate + "T12:00:00Z");

export default function NewYearReservation({ language }) {
  const text = copy[language];
  const eventCopy = newYearCopy[language];
  const [status, setStatus] = useState("idle");
  const numericDate = eventDay.toLocaleDateString(language === "en" ? "en-GB" : language, {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC",
  });
  const [invalidFields, setInvalidFields] = useState([]);
  const sent = status === "sent";
  const pending = status === "pending";
  const [useEmailDraft, setUseEmailDraft] = useState(Boolean(import.meta.env.SILVESTR_EMAIL_DRAFT));
  const message = status === "idle" || pending ? null : text[status] || text.error;

  function fieldProps(name) {
    const invalid = invalidFields.includes(name);
    return { id: `nye-${name}`, name, "aria-invalid": invalid || undefined, "aria-describedby": invalid ? `nye-${name}-error` : undefined };
  }

  function fieldError(name) {
    return invalidFields.includes(name) && <span className="r-new-year-field-error" id={`nye-${name}-error`}>{text.errors[name]}</span>;
  }

  function clearFeedback(name, valid) {
    if (valid && invalidFields.includes(name)) setInvalidFields(fields => fields.filter(field => field !== name));
    if (!pending && !sent && status !== "idle") setStatus("idle");
  }

  async function submit(event) {
    event.preventDefault();
    if (pending || sent) return;
    const form = event.currentTarget;
    const invalid = Array.from(form.elements).filter(field => field.willValidate && !field.validity.valid).map(field => field.name);
    setInvalidFields(invalid);
    if (invalid.length) {
      setStatus("idle");
      requestAnimationFrame(() => form.elements.namedItem(invalid[0]).focus());
      return;
    }
    const details = Object.fromEntries(new FormData(form));
    if (useEmailDraft) {
      const body = [
        eventCopy.date,
        ...["name", "email", "phone", "guests", "time", "note"]
          .filter(key => details[key])
          .map(key => `${text[key]}: ${details[key]}`),
      ].join("\r\n");
      window.location.href = `mailto:${reservationEmail}?subject=${encodeURIComponent(eventCopy.event + " · " + newYearDate)}&body=${encodeURIComponent(body)}`;
      return;
    }
    setStatus("pending");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(details),
      });
      const data = await response.json();
      if (response.ok && (data.status === "sent" || data.status === "preview")) {
        setStatus(data.status);
        if (data.status === "sent") form.reset();
        return;
      }
      if (data.error === "unavailable") {
        setUseEmailDraft(true);
        setStatus("idle");
      } else {
        setStatus(["invalid", "rate_limited", "closed"].includes(data.error) ? data.error : "error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="r-new-year-reservation" id="silvestrovska-rezervace" aria-labelledby="silvestr-reservation-title">
      <div className="r-new-year-reservation-intro">
        <header>
          <p className="r-new-year-reservation-date"><CalendarDays size={16} aria-hidden="true" /><time dateTime={newYearDate}>{eventCopy.date}</time></p>
          <h2 id="silvestr-reservation-title">{text.heading[0]} <em>{text.heading[1]}</em></h2>
          <p className="r-new-year-reservation-description">{text.intro}</p>
        </header>
        <div className="r-new-year-reservation-policy">
          <h3>{eventCopy.depositLabel}</h3>
          <p>{eventCopy.depositTerms}</p>
          <a href="tel:+420224282537" className="r-new-year-reservation-phone">
            <Phone size={16} aria-hidden="true" /> +420 224 282 537
          </a>
        </div>
      </div>
      <form className="r-new-year-form" aria-labelledby="silvestr-reservation-title" action={endpoint} method="post" noValidate onSubmit={submit}
        onInput={event => clearFeedback(event.target.name, event.target.validity.valid)}>
        <fieldset disabled={pending || sent} className="r-new-year-form-fields">
          <legend>{text.contact}</legend>
          <div className="r-new-year-field-pair">
            <div className="r-new-year-field">
              <label htmlFor="nye-name">{text.name}</label>
              <input {...fieldProps("name")} autoComplete="name" required maxLength={100} pattern={String.raw`.*\S.*`} />
              {fieldError("name")}
            </div>
            <div className="r-new-year-field">
              <label htmlFor="nye-phone">{text.phone} <small>({text.optional})</small></label>
              <input {...fieldProps("phone")} type="tel" autoComplete="tel" maxLength={40} pattern=".*[0-9].*" />
              {fieldError("phone")}
            </div>
          </div>
          <div className="r-new-year-field r-new-year-full-field">
            <label htmlFor="nye-email">{text.email}</label>
            <input {...fieldProps("email")} type="email" autoComplete="email" required maxLength={254} pattern={String.raw`[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+`} />
            {fieldError("email")}
          </div>
        </fieldset>
        <fieldset disabled={pending || sent} className="r-new-year-form-fields">
          <legend>{text.visit}</legend>
          <div className="r-new-year-visit-fields">
            <div className="r-new-year-field">
              <label htmlFor="nye-guests">{text.guests}</label>
              <div className="r-new-year-select">
                <UsersRound size={15} aria-hidden="true" />
                <select {...fieldProps("guests")} defaultValue="2" required>
                  {guestCounts.map(count => <option key={count} value={count}>{count}</option>)}
                </select>
                <ChevronDown size={14} aria-hidden="true" />
              </div>
              {fieldError("guests")}
            </div>
            <div className="r-new-year-field">
              <label htmlFor="nye-date">{text.date}</label>
              <div className="r-new-year-fixed-date">
                <CalendarDays size={15} aria-hidden="true" />
                <input id="nye-date" value={numericDate} readOnly />
              </div>
            </div>
            <div className="r-new-year-field">
              <label htmlFor="nye-time">{text.time} <small>({text.optional})</small></label>
              <input {...fieldProps("time")} type="time" />
              {fieldError("time")}
            </div>
          </div>
          <div className="r-new-year-field r-new-year-full-field">
            <label htmlFor="nye-note">{text.note} <small>({text.optional})</small></label>
            <textarea id="nye-note" name="note" maxLength={500} rows={2} placeholder={text.noteHint} />
          </div>
          <input type="text" name="companyWebsite" autoComplete="off" tabIndex={-1} hidden />
        </fieldset>
        <p className="r-new-year-form-privacy">{text.purpose} <a href={routeHref("privacy", language)}>{text.privacy}</a></p>
        {useEmailDraft && <p className="r-new-year-form-privacy">{text.draft} <a href={`mailto:${reservationEmail}`}>{reservationEmail}</a></p>}
        <button type="submit" className="r-button r-new-year-submit" disabled={pending || sent}>
          {pending ? text.pending : useEmailDraft ? text.openEmail : text.send}<ArrowRight size={18} aria-hidden="true" />
        </button>
        <div className="r-new-year-form-message" role="status">
          {message && <p data-success={sent || status === "preview"}>{sent || status === "preview" ? <Check size={17} aria-hidden="true" /> : <CircleAlert size={17} aria-hidden="true" />}{message}</p>}
        </div>
      </form>
    </section>
  );
}
