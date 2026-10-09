/** Ablauf, wenn mehrere Länder auf einmal hinzugefügt wurden: Globus-Tour und Länderzahl laufen nach demselben Plan.
    Alle Zeiten in ms ab dem Moment des Hinzufügens. Bis OVERVIEW Länder fliegt der Globus nacheinander zu jedem Land,
    darüber gibt es nur einen Übersichts-Flug, bei dem alle gemeinsam aufleuchten. */
export const OVERVIEW = 8;

export interface TourPlan {
	overview: boolean;
	/** Zeit pro Land (Tour) */
	step: number;
	/** Flugdauer zum nächsten Land */
	fly: number;
	/** Leuchtdauer */
	glow: number;
	/** Zeitpunkt, an dem Land i „angekommen“ ist (dann zählt die Länderzahl hoch) */
	arrive: number[];
	/** Ende der Tour; danach folgen die Feier-Karten */
	end: number;
}

export function tourPlan(m: number): TourPlan {
	if (m >= OVERVIEW) {
		const fly = 1500;
		// Zähler läuft gleichmäßig über die Flugzeit
		return { overview: true, step: 0, fly, glow: 2000, arrive: Array.from({ length: m }, (_, i) => Math.round(((i + 1) / m) * fly)), end: fly + 1100 };
	}
	// je mehr Länder, desto schneller
	const step = Math.round(Math.max(750, 1600 - (m - 2) * 140)),
		fly = Math.round(step * 0.72),
		glow = Math.round(step * 1.3);
	const arrive = Array.from({ length: m }, (_, i) => i * step + fly);
	return { overview: false, step, fly, glow, arrive, end: arrive[m - 1] + 900 };
}
