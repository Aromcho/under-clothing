import type { SVGProps } from 'react';

const base = (p: SVGProps<SVGSVGElement>) => ({ width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, ...p });

export const IconBag = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>);
export const IconSearch = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>);
export const IconMenu = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M3.5 8h17M3.5 16h11" /></svg>);
export const IconClose = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="m5 5 14 14M19 5 5 19" /></svg>);
export const IconArrow = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M4 12h16m-6-6 6 6-6 6" /></svg>);
export const IconChevron = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>);
export const IconPlus = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>);
export const IconMinus = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M5 12h14" /></svg>);
export const IconTrash = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M4 7h16M9 7V4.5h6V7m-8.5 0 1 13h9l1-13" /></svg>);
export const IconCheck = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="m4.5 12.5 5 5 10-11" /></svg>);
export const IconInstagram = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" /></svg>);
export const IconWhatsapp = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M4 20l1.3-4.2A8 8 0 1 1 8.4 19L4 20Z" /><path d="M9 9.2c0 3 2.8 5.8 5.8 5.8l1.2-1.5-2-1-0.9 0.8c-0.9-0.4-1.8-1.3-2.2-2.2l0.8-0.9-1-2L9 9.2Z" /></svg>);
export const IconPin = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>);
export const IconTruck = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M2.5 6.5h11v10h-11zM13.5 10h4l3 3.5v3h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></svg>);
export const IconChat = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M4 5.5h16v10.5H10l-4.5 3.5V16H4V5.5Z" /></svg>);
export const IconClock = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>);
export const IconFilter = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M4 7h16M7 12h10M10 17h4" /></svg>);
export const IconZoom = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5M11 8.5v5M8.5 11h5" /></svg>);
export const IconTag = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><circle cx="12" cy="13" r="7.5" /><circle cx="12" cy="8.3" r="1" /><path d="M12 7.3V2.5" /></svg>);
/** Percha: ícono del rubro */
export const IconHanger = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M12 9.5V8.3a2.3 2.3 0 1 0-2.3-2.3" /><path d="M12 9.5 2.8 15.8c-0.9 0.6-0.5 2 0.6 2h17.2c1.1 0 1.5-1.4 0.6-2L12 9.5Z" /></svg>);

export function BenefitIcon({ name, ...p }: { name: string } & SVGProps<SVGSVGElement>) {
  const map: Record<string, (p: SVGProps<SVGSVGElement>) => React.JSX.Element> = { truck: IconTruck, pin: IconPin, hanger: IconHanger, chat: IconChat, tag: IconTag, clock: IconClock, check: IconCheck, bag: IconBag };
  const C = map[name] ?? IconTag;
  return <C {...p} />;
}
