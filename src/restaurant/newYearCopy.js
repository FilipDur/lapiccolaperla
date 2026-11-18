export const newYearCopy = {
  cs: {
    event: "Silvestr a Nový rok",
    label: "Novoroční menu",
    seoTitle: "Silvestr a novoroční menu v Praze 1",
    seoDescription: "Italský výběr na Silvestra a Nový rok z jídelního lístku La Piccola Perla. Burrata, pasta, tagliata, tiramisu a prosecco v pražském Starém Městě.",
    heading: ["Silvestr", "po italsku."],
    intro: "Na Silvestra i Nový rok si vyberte z italských klasik našeho stálého lístku v Perlové ulici.",
    menu: "Výběr ze stálého menu",
    fullMenu: "Celý jídelní lístek",
    call: "Zavolat do restaurace",
    booking: "Sváteční otevírací dobu a dostupnost stolů i jídel vám potvrdíme po telefonu.",
    imageNote: "Ilustrační fotografie",
  },
  en: {
    event: "New Year’s Eve & New Year’s Day",
    label: "New Year menu",
    seoTitle: "New Year’s Eve & New Year Menu in Prague",
    seoDescription: "Choose Italian classics from La Piccola Perla’s regular menu for New Year’s Eve and New Year’s Day in Prague Old Town, from burrata to tiramisu.",
    heading: ["New Year,", "Italian style."],
    intro: "For New Year’s Eve and New Year’s Day, discover Italian favourites from our regular menu on Perlová Street.",
    menu: "From our regular menu",
    fullMenu: "See the full menu",
    call: "Call the restaurant",
    booking: "Call us to check holiday hours and availability of tables and dishes.",
    imageNote: "Illustrative photograph",
  },
  it: {
    event: "San Silvestro e Capodanno",
    label: "Menù di Capodanno",
    seoTitle: "Menù di Capodanno nel centro di Praga",
    seoDescription: "A San Silvestro e Capodanno scopri i classici del menù alla carta di La Piccola Perla, dalla burrata al tiramisù, nel centro storico di Praga.",
    heading: ["Capodanno", "all’italiana."],
    intro: "Per San Silvestro e Capodanno, scoprite i classici del nostro menù alla carta in via Perlová.",
    menu: "Dal nostro menù alla carta",
    fullMenu: "Vedi il menù completo",
    call: "Chiama il ristorante",
    booking: "Chiamateci per verificare gli orari festivi e la disponibilità di tavoli e piatti.",
    imageNote: "Fotografia illustrativa",
  },
};

export function showNewYearPromotion(pragueDate) {
  return pragueDate >= "2026-11-18" && pragueDate <= "2027-01-01";
}
