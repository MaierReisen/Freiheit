/* Weltwunder: eigene Seite im Reisepass. Die neuen 7 Weltwunder (Wahl von 2007). Freigeschaltet wird ein Wunder,
   sobald sein Land bereist ist („?“-Platz); gesammelt wird es per „Hier war ich“ – das Land allein reicht nicht. */

export interface Wonder {
	id: string;
	name: string;
	/** Land (ISO-Code) */
	code: string;
	place: string;
}

export const WONDERS: Wonder[] = [
	{ id: 'chichen', name: 'Chichén Itzá', code: 'MX', place: 'Yucatán, Mexiko' },
	{ id: 'cristo', name: 'Cristo Redentor', code: 'BR', place: 'Rio de Janeiro, Brasilien' },
	{ id: 'machu', name: 'Machu Picchu', code: 'PE', place: 'Anden, Peru' },
	{ id: 'kolosseum', name: 'Kolosseum', code: 'IT', place: 'Rom, Italien' },
	{ id: 'petra', name: 'Petra', code: 'JO', place: 'Wadi Musa, Jordanien' },
	{ id: 'mauer', name: 'Chinesische Mauer', code: 'CN', place: 'Nordchina' },
	{ id: 'taj', name: 'Taj Mahal', code: 'IN', place: 'Agra, Indien' }
];

export const isWonder = (id: unknown): id is string => typeof id === 'string' && WONDERS.some((w) => w.id === id);
