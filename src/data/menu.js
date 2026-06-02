export const menuCategories = [
  {
    id: "soups",
    label: "Polévky",
    accent: "Lehké začátky",
    items: [
      { name: "Brodo di pollo", description: "Kuřecí vývar", price: "139 Kč" },
      { name: "Crema di pomodoro", description: "Rajčatový krém", price: "139 Kč" },
      { name: "Minestrone di verdure", description: "Tradiční zeleninová polévka", price: "139 Kč" },
      { name: "Zuppa di fagioli", description: "Benátská fazolová polévka", price: "169 Kč" },
      { name: "Crema di Asparagi", description: "Chřestový krém", price: "179 Kč" },
      { name: "Zuppa di pesce", description: "Rybí polévka", price: "299 Kč" }
    ]
  },
  {
    id: "salads",
    label: "Saláty",
    accent: "Svěží talíře",
    items: [
      { name: "Insalata mista di stagione", description: "Míchaný sezonní salát", price: "249 Kč" },
      { name: "Insalata Caprese", description: "Mozzarella, rajčata a bazalka", price: "279 Kč" },
      { name: "Insalata Nizza", description: "Sezonní salát, tuňák, vejce a olivy", price: "319 Kč" },
      { name: "Insalata con pollo", description: "Salát s kuřecím prsem", price: "319 Kč" },
      { name: "Insalata di spinaci e salmone", description: "Špenátový salát s grilovaným lososem", price: "349 Kč" },
      { name: "Peperoni marinati con feta", description: "Marinované papriky se sýrem feta", price: "319 Kč" },
      { name: "Rucola pomodoro e parmigiano", description: "Rukola s cherry rajčaty a parmazánem", price: "319 Kč" },
      { name: "Insalata con gamberi grigliati", description: "Sezonní salát s grilovanými krevetami", price: "399 Kč" }
    ]
  },
  {
    id: "starters",
    label: "Předkrmy",
    accent: "K vínu i na sdílení",
    items: [
      { name: "Bruschetta al pomodoro", description: "Domácí chléb, rajčata, bazalka a česnek", price: "199 Kč" },
      { name: "Bruschetta con prosciutto e funghi", description: "Toasty s parmskou šunkou a houbami", price: "249 Kč" },
      { name: "Carpaccio di tonno", description: "Tuňákové carpaccio", price: "359 Kč" },
      { name: "Carpaccio di manzo", description: "Hovězí svíčková, rukola a pesto", price: "359 Kč" },
      { name: "Prosciutto crudo con melone", description: "Parmská šunka s melounem", price: "329 Kč" },
      { name: "Vitello tonnato", description: "Telecí plátky s tuňákovou omáčkou", price: "359 Kč" },
      { name: "Burrata con rucola e pomodorini", description: "Burrata s rukolou a rajčaty", price: "339 Kč" },
      { name: "Tagliere di affettati misti", description: "Výběr italských uzenin", price: "299 Kč" },
      { name: "Tagliere di formaggi misti", description: "Výběr italských sýrů", price: "299 Kč" },
      { name: "Antipasto misto La Grande Perla", description: "Velký výběr italských předkrmů", price: "499 Kč" }
    ]
  },
  {
    id: "pasta",
    label: "Pasta & rizota",
    accent: "Ručně laděná klasika",
    items: [
      { name: "Spaghetti aglio olio peperoncino", description: "Česnek, olivový olej a chilli", price: "279 Kč" },
      { name: "Spaghetti alla carbonara", description: "Parmazán, vejce a italská slanina", price: "329 Kč" },
      { name: "Spaghetti al pesto genovese", description: "Bazalkové pesto", price: "329 Kč" },
      { name: "Spaghetti alle vongole", description: "S mušlemi vongole", price: "429 Kč" },
      { name: "Spaghetti all'Amatriciana", description: "Slanina, paprika, cibule a rajčata", price: "359 Kč" },
      { name: "Spaghetti ai frutti di mare", description: "Mořské plody", price: "439 Kč" },
      { name: "Tagliatelle La Piccola Perla", description: "Vepřová panenka, slanina a bazalkové pesto", price: "399 Kč" },
      { name: "Tagliatelle alla bolognese", description: "Masová omáčka", price: "359 Kč" },
      { name: "Tagliatelle prosciutto e funghi", description: "Parmská šunka, hřiby a smetana", price: "379 Kč" },
      { name: "Tagliatelle alla emiliana", description: "Houby, hrášek, šunka, smetana a rajčata", price: "329 Kč" },
      { name: "Tagliatelle agli scampi", description: "Krevety, česnek a olivový olej", price: "419 Kč" },
      { name: "Pennette all'Arrabbiata", description: "Česnek, rajčatová omáčka a chilli", price: "299 Kč" },
      { name: "Pennette con salmone", description: "Čerstvý losos a rajčata", price: "379 Kč" },
      { name: "Pennette pollo spinaci e panna", description: "Kuře, špenát a smetana", price: "359 Kč" },
      { name: "Lasagne al forno", description: "Domácí italské lasagne", price: "359 Kč" },
      { name: "Gnocchi ai quattro formaggi", description: "Gnocchi se čtyřmi sýry", price: "319 Kč" },
      { name: "Risotto porcini e burro tartufato", description: "Hřiby a lanýžové máslo", price: "379 Kč" },
      { name: "Risotto gamberi e zucchine", description: "Krevety a cuketa", price: "419 Kč" },
      { name: "Risotto ai frutti di mare", description: "Mořské plody", price: "439 Kč" }
    ]
  },
  {
    id: "pizza",
    label: "Pizza",
    accent: "Z pece na stůl",
    items: [
      { name: "Margherita", description: "Rajčatová omáčka, mozzarella a čerstvá bazalka", price: "279 Kč" },
      { name: "Napoli", description: "Rajčatová omáčka, česnek, mozzarella a ančovičky", price: "299 Kč" },
      { name: "Funghi", description: "Rajčatová omáčka, mozzarella a žampiony", price: "299 Kč" },
      { name: "Hawaii", description: "Rajčatová omáčka, mozzarella, ananas a šunka", price: "319 Kč" },
      { name: "Vesuvio", description: "Rajčatová omáčka, mozzarella, šunka, salám a houby", price: "329 Kč" },
      { name: "Capricciosa", description: "Rajčatová omáčka, mozzarella, šunka, houby a olivy", price: "359 Kč" },
      { name: "Quattro stagioni", description: "Rajčatová omáčka, mozzarella, houby, šunka a olivy", price: "359 Kč" },
      { name: "Tirolese", description: "Rajčatová omáčka, mozzarella a tyrolská slanina", price: "359 Kč" },
      { name: "Tonno e cipolla", description: "Rajčatová omáčka, mozzarella, tuňák a cibule", price: "359 Kč" },
      { name: "Vegetariana", description: "Papriky, cibule, cuketa, lilek a mozzarella", price: "329 Kč" },
      { name: "Salame piccante", description: "Pikantní salám, mozzarella a chilli papričky", price: "359 Kč" },
      { name: "Quattro formaggi", description: "Smetana a čtyři druhy sýra", price: "329 Kč" },
      { name: "Prosciutto di Parma e rucola", description: "Parmská šunka, mozzarella a rukola", price: "379 Kč" },
      { name: "Rucola", description: "Rajčatová omáčka, mozzarella, rukola a parmazán", price: "329 Kč" },
      { name: "Calzone", description: "Rajčatová omáčka, mozzarella, šunka, cibule a paprika", price: "359 Kč" },
      { name: "Frutti di mare", description: "Rajčatová omáčka, mozzarella a mořské plody", price: "439 Kč" },
      { name: "Carpaccio", description: "Hovězí svíčková, rukola a parmazán", price: "399 Kč" },
      { name: "Bufalina", description: "Buvolí mozzarella, cherry rajčata a bazalka", price: "359 Kč" },
      { name: "La Piccola Perla", description: "Mozzarella, gorgonzola, salám, parmská šunka a paprika", price: "399 Kč" }
    ]
  },
  {
    id: "meat",
    label: "Maso",
    accent: "Italská hlavní jídla",
    items: [
      { name: "Tagliata di maiale con rucola", description: "Vepřová panenka s rukolou a gorgonzolovou omáčkou", price: "479 Kč" },
      { name: "Petto di pollo limone, rosmarino", description: "Kuřecí prso s citronem a rozmarýnem", price: "399 Kč" },
      { name: "Vitello alla Milanese", description: "Telecí řízek na milánský způsob", price: "479 Kč" },
      { name: "Saltimbocca alla romana", description: "Telecí s parmskou šunkou a šalvějí", price: "499 Kč" },
      { name: "Scallopina di vitello alla valdostana", description: "Zapékané telecí plátky s mozzarellou", price: "499 Kč" },
      { name: "Tagliata di manzo", description: "Grilovaný hovězí roštěnec", price: "589 Kč" },
      { name: "Filetto di manzo alla griglia", description: "Grilovaná hovězí svíčková", price: "639 Kč" },
      { name: "Grigliata mista di carne", description: "Mix grilovaných mas La Piccola Perla", price: "599 Kč" },
      { name: "Scottadito di agnello", description: "Grilované jehněčí kotletky", price: "759 Kč" },
      { name: "Il piatto della nonna", description: "Denní specialita podle nabídky", price: "dle nabídky" }
    ]
  },
  {
    id: "seafood",
    label: "Ryby",
    accent: "Moře po italsku",
    items: [
      { name: "Cozze al vino bianco", description: "Slávky na bílém víně", price: "399 Kč" },
      { name: "Calmaretti alla griglia", description: "Grilované baby kalamáry s česnekem", price: "549 Kč" },
      { name: "Polpo alla griglia", description: "Grilovaná chobotnice", price: "639 Kč" },
      { name: "Salmone al prosecco", description: "Losos s prosecco omáčkou", price: "549 Kč" },
      { name: "Gamberi e calamari alla griglia", description: "Grilované krevety a kalamáry", price: "649 Kč" },
      { name: "Gamberi alla provinciale", description: "Krevety, rajčatová omáčka, česnek a paprika", price: "599 Kč" },
      { name: "Orata o branzino", description: "Pečená pražma nebo mořský vlk", price: "599 Kč" },
      { name: "Pesce misto", description: "Mix grilovaných ryb a mořských plodů", price: "659 Kč" }
    ]
  },
  {
    id: "sides",
    label: "Přílohy",
    accent: "K dobrému talíři",
    items: [
      { name: "Patate fritte", description: "Hranolky", price: "99 Kč" },
      { name: "Patate al forno", description: "Pečené brambory", price: "119 Kč" },
      { name: "Spinaci all'aglio", description: "Špenát s česnekem", price: "149 Kč" },
      { name: "Fagiolini verdi", description: "Zelené fazolky", price: "139 Kč" },
      { name: "Verdure alla griglia", description: "Grilovaná zelenina", price: "169 Kč" },
      { name: "Focaccia", description: "Chléb focaccia", price: "99 Kč" }
    ]
  },
  {
    id: "desserts",
    label: "Dezerty",
    accent: "Sladké finále",
    items: [
      { name: "Tiramisu", description: "Klasické italské tiramisu", price: "139 Kč" },
      { name: "Panna cotta", description: "Jemná panna cotta", price: "139 Kč" },
      { name: "Soufflé al cioccolato", description: "Čokoládové soufflé", price: "179 Kč" },
      { name: "Gelato misto", description: "Výběr zmrzlin", price: "139 Kč" },
      { name: "Lamponi caldi", description: "Teplé maliny se zmrzlinou", price: "159 Kč" },
      { name: "Frutti di bosco al mascarpone", description: "Teplé lesní ovoce s mascarpone", price: "159 Kč" },
      { name: "Sorbetto al limone", description: "Citronový sorbet", price: "149 Kč" }
    ]
  },
  {
    id: "drinks",
    label: "Nápoje",
    accent: "Káva, nealko, pivo",
    items: [
      { name: "Espresso", description: "", price: "69 Kč" },
      { name: "Espresso Doppio", description: "", price: "109 Kč" },
      { name: "Cappuccino", description: "", price: "79 Kč" },
      { name: "Latte macchiato", description: "", price: "79 Kč" },
      { name: "Irish coffee", description: "", price: "159 Kč" },
      { name: "Caffé decaffeinato", description: "Bezkofeinová káva", price: "69 Kč" },
      { name: "Cioccolata calda", description: "Horká čokoláda", price: "89 Kč" },
      { name: "Čaj", description: "", price: "69 Kč" },
      { name: "Čerstvý mátový nebo zázvorový čaj", description: "", price: "89 Kč" },
      { name: "Svařené víno", description: "", price: "99 Kč" },
      { name: "Pepsi 0,25 l", description: "", price: "69 Kč" },
      { name: "Juice 0,25 l", description: "", price: "69 Kč" },
      { name: "Fresh juice 0,2 l", description: "", price: "99 Kč" },
      { name: "Ice Tea 0,33 l", description: "", price: "69 Kč" },
      { name: "Perlivá voda 0,33 l", description: "", price: "59 Kč" },
      { name: "Neperlivá voda 0,33 l", description: "", price: "59 Kč" },
      { name: "San Pellegrino 0,75 l", description: "", price: "129 Kč" },
      { name: "Mattoni 0,75 l", description: "", price: "109 Kč" },
      { name: "Karafa vody 1 l", description: "", price: "69 Kč" },
      { name: "Limonáda 0,33 l", description: "", price: "79 Kč" },
      { name: "Crodino 0,1 l", description: "", price: "129 Kč" },
      { name: "Krušovice světlé/tmavé 0,33 l", description: "Pivo", price: "59 Kč" },
      { name: "Krušovice světlé/tmavé 0,5 l", description: "Pivo", price: "75 Kč" },
      { name: "Nealkoholické pivo", description: "", price: "75 Kč" },
      { name: "Cider Strongbow 0,33 l", description: "", price: "75 Kč" }
    ]
  },
  {
    id: "wine",
    label: "Vína",
    accent: "Sklenky i lahve",
    items: [
      { name: "Prosecco DOC 0,15 l", description: "Šumivé, Veneto", price: "139 Kč" },
      { name: "Pinot Grigio DOCG 0,15 l", description: "Bílé, Veneto", price: "139 Kč" },
      { name: "Chardonnay DOC 0,15 l", description: "Bílé", price: "139 Kč" },
      { name: "Soave Classico 0,15 l", description: "Bílé", price: "159 Kč" },
      { name: "Gavi DOCG 0,15 l", description: "Bílé", price: "179 Kč" },
      { name: "Chianti 0,15 l", description: "Červené, Toscana", price: "139 Kč" },
      { name: "Barbera d'Asti Superiore 0,15 l", description: "Červené, Piemonte", price: "189 Kč" },
      { name: "Montepulciano d'Abruzzo 0,15 l", description: "Červené, Abruzzo", price: "139 Kč" },
      { name: "Primitivo Salento 0,15 l", description: "Červené, Puglia", price: "149 Kč" },
      { name: "Pinot Grigio Serenna", description: "Bílé, Veneto, láhev", price: "699 Kč" },
      { name: "Lugana Delibori", description: "Bílé, Veneto, láhev", price: "799 Kč" },
      { name: "Villa Antinori Bianco", description: "Bílé, Toscana, láhev", price: "849 Kč" },
      { name: "Gavi Marco Bonfante", description: "Bílé, Piemonte, láhev", price: "899 Kč" },
      { name: "Gewürztraminer Kellerei Terlan", description: "Bílé, Trentino, láhev", price: "1 099 Kč" },
      { name: "Prosecco D.O.C.", description: "Šumivé, láhev", price: "699 Kč" },
      { name: "Prosecco Valdobbiadene D.O.C.G.", description: "Šumivé, láhev", price: "849 Kč" },
      { name: "Pol Roger Brut Réserve", description: "Champagne", price: "2 590 Kč" },
      { name: "Valpolicella Classico Delibori", description: "Červené, Veneto, láhev", price: "799 Kč" },
      { name: "Amarone Della Valpolicella", description: "Červené, Veneto, láhev", price: "1 690 Kč" },
      { name: "Primitivo Manduria Cantolio", description: "Červené, Puglia, láhev", price: "849 Kč" },
      { name: "Chianti Classico Gallo Nero", description: "Červené, Toscana, láhev", price: "749 Kč" },
      { name: "Brunello di Montalcino DOCG", description: "Červené, Toscana, láhev", price: "1 999 Kč" },
      { name: "Tignanello Toscana", description: "Červené, Toscana, láhev", price: "7 690 Kč" },
      { name: "Sassicaia", description: "Červené, Toscana, láhev", price: "8 990 Kč" },
      { name: "Barolo", description: "Červené, Piemonte, láhev", price: "1 899 Kč" }
    ]
  },
  {
    id: "spirits",
    label: "Destiláty",
    accent: "Digestiv po večeři",
    items: [
      { name: "Hruškovice Williams", description: "Hruškový destilát", price: "119 Kč" },
      { name: "Slivovice", description: "Švestkový destilát", price: "119 Kč" },
      { name: "Grappa la Bianca", description: "", price: "119 Kč" },
      { name: "Grappa Sarpa Oro 4YO", description: "Barrique aged", price: "195 Kč" },
      { name: "Grappa Cleopatra Amarone Poli", description: "", price: "249 Kč" },
      { name: "Amaro Ramazzotti", description: "Likér", price: "119 Kč" },
      { name: "Amaro Montenegro", description: "Likér", price: "119 Kč" },
      { name: "Disaronno", description: "Likér", price: "139 Kč" },
      { name: "Limoncello", description: "Likér", price: "119 Kč" },
      { name: "Campari", description: "Likér", price: "119 Kč" },
      { name: "Aperol Spritz", description: "", price: "179 Kč" },
      { name: "Bombay Sapphire", description: "Gin", price: "149 Kč" },
      { name: "Hendrick's Gin", description: "Gin", price: "189 Kč" },
      { name: "Jameson Original", description: "Whiskey", price: "119 Kč" },
      { name: "Glenfiddich 12 Y.O.", description: "Single malt", price: "199 Kč" },
      { name: "Jack Daniel's", description: "Bourbon", price: "189 Kč" },
      { name: "Grey Goose", description: "Vodka", price: "219 Kč" },
      { name: "Diplomático Reserva Exclusiva", description: "Rum", price: "219 Kč" },
      { name: "Ron Zacapa 23 Y.O.", description: "Rum", price: "289 Kč" },
      { name: "Rémy Martin V.S.O.P", description: "Cognac", price: "259 Kč" },
      { name: "Herradura Reposado", description: "Tequila", price: "299 Kč" }
    ]
  }
];

export const featuredPicks = [
  "Burrata con rucola e pomodorini",
  "Tagliatelle La Piccola Perla",
  "Pizza La Piccola Perla",
  "Polpo alla griglia",
  "Tiramisu"
];
