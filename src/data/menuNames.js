// Translate generic Czech names; Italian dish names and product brands stay intact.
export const menuNames = {
  'Čaj': { en: 'Tea', it: 'Tè' },
  'Čerstvý mátový nebo zázvorový čaj': { en: 'Fresh mint or ginger tea', it: 'Tè alla menta fresca o allo zenzero' },
  'Svařené víno': { en: 'Mulled wine', it: 'Vin brulé' },
  'Perlivá voda 0,33 l': { en: 'Sparkling water 0.33 l', it: 'Acqua frizzante 0,33 l' },
  'Neperlivá voda 0,33 l': { en: 'Still water 0.33 l', it: 'Acqua naturale 0,33 l' },
  'Karafa vody 1 l': { en: 'Carafe of water 1 l', it: 'Caraffa d’acqua 1 l' },
  'Limonáda 0,33 l': { en: 'Lemonade 0.33 l', it: 'Limonata 0,33 l' },
  'Krušovice světlé/tmavé 0,33 l': { en: 'Krušovice pale/dark beer 0.33 l', it: 'Krušovice birra chiara/scura 0,33 l' },
  'Krušovice světlé/tmavé 0,5 l': { en: 'Krušovice pale/dark beer 0.5 l', it: 'Krušovice birra chiara/scura 0,5 l' },
  'Nealkoholické pivo': { en: 'Non-alcoholic beer', it: 'Birra analcolica' },
  'Hruškovice Williams': { en: 'Williams pear brandy', it: 'Distillato di pere Williams' },
  'Slivovice': { en: 'Slivovice plum brandy', it: 'Slivovice, distillato di prugne' }
};

export const localizeMenuName = (name, language) => menuNames[name]?.[language] || name;
