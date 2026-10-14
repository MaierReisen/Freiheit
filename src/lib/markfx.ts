/* Aufkleben der Briefmarken: jede Seltenheit etwas anders, nur einmal beim Aufkleben – danach ruht die Marke.
   Rare: von oben aufgelegt und angedrückt. Epic: schräg aus der Hand hingelegt, dann ein lila Glanz (wie bei den Bordkarten).
   Legendary: schwebt langsam mit goldenem Schein herab, dann ein Goldschimmer und ein paar Funken. Weltwunder (4): ebenso, mit Regenbogen-Schein. */
const NS = 'http://www.w3.org/2000/svg';
let n = 0;

/** Glanzstreifen einmal schräg über die Marke (im SVG, daher genau auf die Marke beschnitten) */
async function sheen(svg: SVGSVGElement, color: string, op: number, dur: number) {
	const id = 'sh' + ++n,
		g = document.createElementNS(NS, 'g'),
		{ width: w, height: h } = svg.viewBox.baseVal;
	g.innerHTML = `<defs><clipPath id="${id}c"><rect x="8" y="8" width="${w - 16}" height="${h - 16}"/></clipPath><linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="${color}" stop-opacity="0"/><stop offset=".5" stop-color="${color}" stop-opacity="${op}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><g clip-path="url(#${id}c)"><g transform="rotate(22 100 120)"><rect x="-170" y="-90" width="80" height="420" fill="url(#${id}g)"/></g></g>`;
	svg.appendChild(g);
	await g.querySelector('rect[fill]')!.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${w + 260}px)` }], { duration: dur, easing: 'cubic-bezier(.45,0,.3,1)' }).finished;
	g.remove();
}

/** ein paar kleine Goldfunken am Rand der Marke */
function sparks(el: Element) {
	const r = el.getBoundingClientRect();
	for (const [fx, fy, d] of [[0.08, 0.1, 0], [0.92, 0.22, 120], [0.95, 0.78, 260], [0.1, 0.86, 380], [0.5, 0.02, 200]]) {
		const s = document.createElement('div');
		s.className = 'pp-fx pp-spark';
		s.textContent = '✦';
		Object.assign(s.style, { left: r.left + r.width * fx + 'px', top: r.top + r.height * fy + 'px' });
		document.body.appendChild(s);
		s.animate(
			[
				{ transform: 'translate(-50%,-50%) scale(0) rotate(0)', opacity: 0 },
				{ transform: 'translate(-50%,-50%) scale(1.1) rotate(45deg)', opacity: 1, offset: 0.4 },
				{ transform: 'translate(-50%,-50%) scale(0) rotate(90deg)', opacity: 0 }
			],
			{ duration: 800, delay: d, easing: 'ease-out', fill: 'backwards' }
		).finished.then(() => s.remove());
	}
}

const BASE = 'drop-shadow(0 1px 1.5px rgba(13,43,58,.3))';

/** Marke aufkleben; land wird beim Andrücken aufgerufen (Seite federt, Vibration, Hinweis) */
export async function stickOn(el: SVGSVGElement, tier: number, land?: () => void) {
	if (tier >= 3) {
		// 4 = Weltwunder: Regenbogen-Schein statt Gold
		const a = tier > 3 ? '150,140,255' : '230,180,70',
			b = tier > 3 ? '170,160,255' : '240,190,70';
		await el.animate(
			[
				{ transform: 'translateY(-60px) scale(1.22) rotate(4deg)', opacity: 0, filter: `drop-shadow(0 0 0 rgba(${a},0)) ${BASE}` },
				{ transform: 'translateY(-52px) scale(1.2) rotate(3deg)', opacity: 1, filter: `drop-shadow(0 0 18px rgba(${b},1)) ${BASE}`, offset: 0.25 },
				{ transform: 'translateY(-6px) scale(1.04) rotate(.5deg)', filter: `drop-shadow(0 0 10px rgba(${a},.7)) ${BASE}`, offset: 0.72 },
				{ transform: 'translateY(2px) scale(.96)', filter: `drop-shadow(0 0 6px rgba(${a},.5)) ${BASE}`, offset: 0.86 },
				{ transform: 'none', filter: `drop-shadow(0 0 4px rgba(${a},.4)) ${BASE}` }
			],
			{ duration: 1500, easing: 'ease-in-out', fill: 'backwards' }
		).finished;
		land?.();
		sparks(el);
		el.animate(
			[
				{ filter: `drop-shadow(0 0 4px rgba(${a},.4)) ${BASE}` },
				{ filter: `drop-shadow(0 0 16px rgba(${b},.95)) ${BASE}`, offset: 0.35 },
				{ filter: `drop-shadow(0 0 0 rgba(${a},0)) ${BASE}` }
			],
			{ duration: 1500, easing: 'ease-out' }
		);
		await sheen(el, tier > 3 ? '#FFFFFF' : '#F0BE48', tier > 3 ? 0.9 : 0.6, 1100);
	} else if (tier === 2) {
		await el.animate(
			[
				{ transform: 'perspective(600px) translate(26px,-36px) rotateX(34deg) rotate(-8deg) scale(1.12)', opacity: 0 },
				{ transform: 'perspective(600px) translate(22px,-30px) rotateX(30deg) rotate(-7deg) scale(1.1)', opacity: 1, offset: 0.22 },
				{ transform: 'perspective(600px) translate(2px,-4px) rotateX(6deg) rotate(-1deg) scale(1.03)', offset: 0.7 },
				{ transform: 'perspective(600px) translateY(1px) scale(.97)', offset: 0.86 },
				{ transform: 'none' }
			],
			{ duration: 1200, easing: 'ease-in-out', fill: 'backwards' }
		).finished;
		land?.();
		await sheen(el, '#C4B0FF', 0.9, 900);
	} else {
		await el.animate(
			[
				{ transform: 'translateY(-48px) scale(1.15) rotate(-5deg)', opacity: 0 },
				{ transform: 'translateY(-48px) scale(1.15) rotate(-5deg)', opacity: 1, offset: 0.2 },
				{ transform: 'translateY(-6px) scale(1.04) rotate(-1deg)', offset: 0.7 },
				{ transform: 'translateY(2px) scale(.97)', offset: 0.85 },
				{ transform: 'none' }
			],
			{ duration: 1100, easing: 'ease-in-out', fill: 'backwards' }
		).finished;
		land?.();
	}
}

/** Glanzstreifen einmal über eine Bordkarte (HTML, die Karte schneidet ihn ab) */
async function cardSheen(card: HTMLElement, color: string, dur: number) {
	const s = document.createElement('i');
	s.className = 'fp-sheen';
	s.style.setProperty('--c', color);
	card.appendChild(s);
	await s.animate([{ transform: 'translateX(-120%) skewX(-18deg)' }, { transform: 'translateX(320%) skewX(-18deg)' }], { duration: dur, easing: 'cubic-bezier(.45,0,.3,1)' }).finished;
	s.remove();
}

/** Neue Bordkarte in den Flugpass: Common wird eingesteckt, Rare aufgelegt, Epic schräg hingelegt + Glanz,
    Legendary schwebt mit Goldschein herab + Funken und Goldglanz. land = Moment des Auflegens (Seite federt, Vibration). */
export async function cardOn(el: HTMLElement, tier: number, land?: () => void) {
	const card = el.querySelector<HTMLElement>('.fp-tk') ?? el;
	if (tier >= 3) {
		await el.animate(
			[
				{ transform: 'translateY(-50px) scale(1.12) rotate(3deg)', opacity: 0, filter: 'drop-shadow(0 0 0 rgba(230,180,70,0))' },
				{ transform: 'translateY(-44px) scale(1.1) rotate(2deg)', opacity: 1, filter: 'drop-shadow(0 0 18px rgba(240,190,70,1))', offset: 0.25 },
				{ transform: 'translateY(-5px) scale(1.03) rotate(.4deg)', filter: 'drop-shadow(0 0 10px rgba(230,180,70,.7))', offset: 0.72 },
				{ transform: 'translateY(2px) scale(.98)', filter: 'drop-shadow(0 0 6px rgba(230,180,70,.5))', offset: 0.86 },
				{ transform: 'none', filter: 'drop-shadow(0 0 0 rgba(230,180,70,0))' }
			],
			{ duration: 1500, easing: 'ease-in-out', fill: 'backwards' }
		).finished;
		land?.();
		sparks(card);
		await cardSheen(card, 'rgba(255,225,140,.6)', 1100);
	} else if (tier === 2) {
		await el.animate(
			[
				{ transform: 'perspective(700px) translate(24px,-34px) rotateX(30deg) rotate(-6deg) scale(1.08)', opacity: 0 },
				{ transform: 'perspective(700px) translate(20px,-28px) rotateX(26deg) rotate(-5deg) scale(1.06)', opacity: 1, offset: 0.22 },
				{ transform: 'perspective(700px) translate(2px,-4px) rotateX(5deg) rotate(-.6deg) scale(1.02)', offset: 0.7 },
				{ transform: 'perspective(700px) translateY(1px) scale(.985)', offset: 0.86 },
				{ transform: 'none' }
			],
			{ duration: 1200, easing: 'ease-in-out', fill: 'backwards' }
		).finished;
		land?.();
		await cardSheen(card, 'rgba(225,210,255,.8)', 900);
	} else if (tier === 1) {
		await el.animate(
			[
				{ transform: 'translateY(-40px) scale(1.08) rotate(-3deg)', opacity: 0 },
				{ transform: 'translateY(-40px) scale(1.08) rotate(-3deg)', opacity: 1, offset: 0.2 },
				{ transform: 'translateY(-5px) scale(1.02) rotate(-.6deg)', offset: 0.7 },
				{ transform: 'translateY(2px) scale(.985)', offset: 0.85 },
				{ transform: 'none' }
			],
			{ duration: 1000, easing: 'ease-in-out', fill: 'backwards' }
		).finished;
		land?.();
	} else {
		// eingesteckt: von rechts in die Mappe geschoben, kurz nachgefedert
		await el.animate(
			[
				{ transform: 'translateX(70px) rotate(3deg)', opacity: 0 },
				{ transform: 'translateX(-4px) rotate(-.4deg)', opacity: 1, offset: 0.7 },
				{ transform: 'none' }
			],
			{ duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }
		).finished;
		land?.();
	}
}
