/**
 * Contenido relevado del Instagram @under.clothing7 (86 publicaciones + destacada "EN STOCK").
 * Los nombres, colores, talles y descripciones salen de cada publicación; nada está inventado.
 * Precio y stock no figuran en el Instagram: quedan vacíos para cargarlos desde el panel.
 */
export type Img = string | { f: string; crop: [number, number, number, number] };
export type SeedProduct = {
  post: number; name: string; cat: string; colors: string[]; imgs: Img[];
  desc?: string; sizes?: string[]; sizesNote?: string; cols?: string[]; isNew?: boolean; featured?: boolean;
};

export const COLOR_HEX: Record<string, string> = {
  Negro: '#1C1A1A', Blanco: '#FAF8F5', Crudo: '#EFE6D8', Beige: '#D9C4A9', Gris: '#9A9A9C', 'Gris oscuro': '#55565A', 'Gris topo': '#6B6763',
  'Azul oscuro': '#1F2A44', Azul: '#27406E', Bordó: '#6E1F2B', Marrón: '#5A3E2E', Chocolate: '#4A3024', Celeste: '#A9C6E0', Rosa: '#D98E93',
  Terracota: '#C9502E', Verde: '#1F3D36', 'Animal print': '#B88A4A', 'Jean claro': '#A9C0DA', 'Jean azul': '#5E7FA6', 'Jean negro': '#2B2B2E',
  'Jean gris': '#77746C', Estampado: '#8B7B66', 'Rayado bordó': '#7A2E3A', 'Rayado celeste': '#9DB9D6', 'Rayado negro': '#3A3837', 'Blanco y negro': '#D8D5D0',
};

export const CATEGORIES = [
  { slug: 'tops', name: 'Tops', cover: '08_1' },
  { slug: 'musculosas-remeras', name: 'Musculosas y remeras', cover: '57_1' },
  { slug: 'bodys', name: 'Bodys', cover: '15_3' },
  { slug: 'sweaters', name: 'Sweaters y tejidos', cover: '17_2' },
  { slug: 'buzos', name: 'Buzos', cover: '14_1' },
  { slug: 'abrigos', name: 'Camperas y abrigos', cover: '37_1' },
  { slug: 'pantalones', name: 'Jeans y pantalones', cover: '39_1' },
  { slug: 'shorts-polleras', name: 'Shorts y polleras', cover: '66_3' },
  { slug: 'vestidos', name: 'Vestidos y monos', cover: '59_1' },
  { slug: 'conjuntos', name: 'Conjuntos', cover: '10_1' },
];

export const COLLECTIONS = [
  { slug: 'primavera-verano', name: 'Primavera / Verano', tagline: 'Livianos, con brillo y con la caída perfecta', description: 'Los ingresos de primavera/verano: tops, polleras, shorts y vestidos para los días de sol.', cover: '04_1' },
  { slug: 'otono-invierno', name: 'Otoño / Invierno', tagline: 'Tan cómodo que no te lo vas a querer sacar', description: 'Sweaters, buzos con frisa, camperas y tapados súper abrigados.', cover: '25_3' },
  { slug: 'tejidos', name: 'Tejidos y crochet', tagline: 'Amamos estos tejidos', description: 'Hilo, lino y crochet: las texturas que más nos gustan.', cover: '82_3' },
];

const PV = ['primavera-verano'], OI = ['otono-invierno'], TJ = ['tejidos'];

export const PRODUCTS: SeedProduct[] = [
  // ——— 2026 / fines de 2025: nuevos ingresos
  { post: 2, name: 'Remera Lover Confidence', cat: 'musculosas-remeras', colors: ['Blanco'], imgs: [{ f: '02_1', crop: [0, 0, 670, 900] }], desc: 'Remeras con la mejor calidad y comodidad que podés encontrar.', sizesNote: 'Talles del S al L', cols: PV, isNew: true },
  { post: 5, name: 'Sweater con cuello tejido', cat: 'sweaters', colors: ['Negro', 'Azul oscuro', 'Beige'], imgs: ['05_1', '05_2', '05_4', '05_3'], desc: 'El detalle de las mangas con dobladillo lo hace único, y ni hablar de lo suavecito que es. Ni dudes de que va a ser tu favorito.', cols: OI, isNew: true, featured: true },
  { post: 7, name: 'Buzo chomba', cat: 'buzos', colors: ['Gris', 'Marrón'], imgs: ['07_1', '07_2'], cols: OI, isNew: true },
  { post: 7, name: 'Buzo corto', cat: 'buzos', colors: ['Negro'], imgs: ['07_3'], cols: OI, isNew: true },
  { post: 8, name: 'Top halter con hebilla', cat: 'tops', colors: ['Blanco', 'Negro'], imgs: ['08_1', '08_2'], cols: PV, isNew: true, featured: true },
  { post: 9, name: 'Top halter de encaje', cat: 'tops', colors: ['Negro'], imgs: ['09_1', '09_3', '09_2'], desc: 'Nuevos ingresos: son una bomba.', cols: PV, isNew: true },
  { post: 10, name: 'Conjunto de encaje', cat: 'conjuntos', colors: ['Blanco', 'Negro'], imgs: ['10_1', '10_2', '10_3'], desc: 'Este conjunto es muy bomba, y el calce que tiene: lo van a amar. Se vende por partes separadas o en conjunto.', cols: PV, isNew: true, featured: true },
  { post: 11, name: 'Shorts de jean', cat: 'shorts-polleras', colors: ['Jean claro', 'Jean negro', 'Jean azul'], imgs: ['11_1', '11_3', '11_5', '11_2', '11_4', '11_6'], desc: 'La temporada de los shorts está llegando. La moda se renueva y los shorts también.', sizesNote: 'Consultar talles disponibles', cols: PV, isNew: true },
  // ——— 2025
  { post: 12, name: 'Calza Oxford + campera', cat: 'conjuntos', colors: ['Gris', 'Negro'], imgs: ['12_2', '12_1', '12_3', '12_4'], desc: 'Ideal para estar cómoda y hacer ejercicio.' },
  { post: 13, name: 'Strapless Bari', cat: 'tops', colors: ['Negro'], imgs: ['13_1', '13_2'], cols: PV },
  { post: 14, name: 'Buzo Montana', cat: 'buzos', colors: ['Negro', 'Bordó', 'Azul oscuro'], imgs: ['14_1', '14_2', '14_3'], desc: 'Disponible en los 3 colores.', cols: OI, featured: true },
  { post: 15, name: 'Body Lucy', cat: 'bodys', colors: ['Negro'], imgs: ['15_3', '15_1'], desc: 'Combinalo con el jeans gris metalizado y un cinto.' },
  { post: 15, name: 'Jeans gris metalizado', cat: 'pantalones', colors: ['Jean gris'], imgs: ['15_2', '15_3'], desc: 'El calce de este jeans y lo canchero que es.' },
  { post: 16, name: 'Top Zara', cat: 'tops', colors: ['Bordó'], imgs: [{ f: '16_1', crop: [150, 262, 490, 760] }], desc: 'Súper cómodo y canchero.' },
  { post: 17, name: 'Sweater chomba rayas anchas', cat: 'sweaters', colors: ['Bordó', 'Negro', 'Azul oscuro', 'Marrón'], imgs: ['17_1', '17_2', '17_3', '17_4'], sizes: ['Único'], cols: OI, featured: true },
  { post: 19, name: 'Conjunto tejido', cat: 'conjuntos', colors: ['Negro', 'Gris'], imgs: ['20_1', '19_1', '20_3', '19_2', '20_2'], desc: 'El conjunto tejido más bomba. La tela que maneja y lo abrigado: tan cómodo que no te lo vas a querer sacar más.', cols: [...OI, ...TJ], featured: true },
  { post: 21, name: 'Campera peluche animal print', cat: 'abrigos', colors: ['Animal print'], imgs: ['21_1', '21_2'], cols: OI },
  { post: 22, name: 'Buzo oversize con frisa', cat: 'buzos', colors: ['Negro', 'Gris'], imgs: ['22_2', '22_3', '22_1', '22_4'], cols: OI },
  { post: 34, name: 'Buzo oversize New York', cat: 'buzos', colors: ['Blanco', 'Bordó', 'Negro'], imgs: ['34_1', '34_3', '23_2', '34_2', '23_1'], cols: OI },
  { post: 25, name: 'Cardigan con peluche desmontable', cat: 'sweaters', colors: ['Negro', 'Crudo'], imgs: ['25_3', '25_4', '25_2', '25_1'], desc: 'Con peluche desmontable: usalo como más te guste.', cols: OI, featured: true },
  { post: 26, name: 'Sweater tejido con botones', cat: 'sweaters', colors: ['Negro'], imgs: ['26_1', '26_2'], desc: 'Con jeans tiro bajo y el accesorio del cinto, que no falla.', cols: OI },
  { post: 27, name: 'Tapado Nybo', cat: 'abrigos', colors: ['Negro'], imgs: ['27_2', '27_3', '27_1'], desc: 'Mirá lo que es este total look de Under.', cols: OI },
  { post: 29, name: 'Buzo frisado Represent', cat: 'buzos', colors: ['Gris topo'], imgs: ['29_1', '29_2'], cols: OI },
  { post: 30, name: 'Sweater chomba rayas finas', cat: 'sweaters', colors: ['Beige', 'Gris'], imgs: ['30_2', '30_3', '30_1', '30_4'], cols: OI },
  { post: 31, name: 'Buzo flor hawaiana', cat: 'buzos', colors: ['Blanco'], imgs: ['31_1', '31_2'], desc: 'Este buzo con flor hawaiana: lo amamos.', cols: OI },
  { post: 32, name: 'Buzo con frisa Santa Mónica', cat: 'buzos', colors: ['Verde'], imgs: ['32_1', '32_2'], desc: 'Súper abrigado. Y el color: súper canchero y en tendencia.', cols: OI },
  { post: 33, name: 'Remera Angélica', cat: 'musculosas-remeras', colors: ['Rayado bordó', 'Rayado celeste'], imgs: ['33_1', '33_2'] },
  { post: 35, name: 'Jeans claro', cat: 'pantalones', colors: ['Jean claro'], imgs: ['35_1', '35_3'] },
  { post: 35, name: 'Sweater grueso', cat: 'sweaters', colors: ['Negro'], imgs: ['35_2', '35_3'], cols: OI },
  { post: 36, name: 'Jogging gris', cat: 'pantalones', colors: ['Gris'], imgs: ['36_1'], desc: '100% algodón.' },
  { post: 37, name: 'Gamulán oversize', cat: 'abrigos', colors: ['Negro'], imgs: ['37_1', '37_2'], desc: 'La amamos.', cols: OI },
  { post: 38, name: 'Bomber con corderito', cat: 'abrigos', colors: ['Negro'], imgs: ['38_1', '38_2'], cols: OI },
  { post: 39, name: 'Jeans tiro bajo', cat: 'pantalones', colors: ['Jean azul'], imgs: ['39_1', '39_2'], sizesNote: 'Consultar talles disponibles' },
  { post: 40, name: 'Jeans azul', cat: 'pantalones', colors: ['Jean azul'], imgs: ['40_1', '40_2'], sizesNote: 'Consultar talles disponibles' },
  { post: 41, name: 'Jeans estampado', cat: 'pantalones', colors: ['Estampado'], imgs: ['41_1', '41_2'] },
  { post: 41, name: 'Musculosa con frunce', cat: 'musculosas-remeras', colors: ['Negro'], imgs: ['41_3', '41_2'] },
  { post: 42, name: 'Musculosa con cuello ancho', cat: 'musculosas-remeras', colors: ['Negro', 'Chocolate', 'Gris'], imgs: ['42_2', '42_3', '42_1'], desc: 'Disponible en negro, chocolate y gris.' },
  { post: 43, name: 'Pantalón Key', cat: 'pantalones', colors: ['Negro'], imgs: ['43_1', '43_2'] },
  { post: 44, name: 'Camisa Cross', cat: 'musculosas-remeras', colors: ['Azul oscuro', 'Negro'], imgs: ['44_1', '44_2'], desc: 'Disponible también en negro.' },
  { post: 44, name: 'Jeans gastado negro', cat: 'pantalones', colors: ['Jean negro'], imgs: ['44_3'], sizesNote: 'Consultar talles disponibles' },
  { post: 46, name: 'Sweater Kaya', cat: 'sweaters', colors: ['Negro'], imgs: ['46_2', '46_3', '46_1'] },
  { post: 47, name: 'Sweater de hilo', cat: 'sweaters', colors: ['Blanco', 'Negro'], imgs: ['47_2', '47_1', '47_3', '47_4'], desc: 'Disponible en blanco y negro.', cols: TJ },
  { post: 48, name: 'Body Aura', cat: 'bodys', colors: ['Negro'], imgs: ['48_1', '48_2', '48_3'], cols: PV },
  { post: 49, name: 'Pantalón Kay', cat: 'pantalones', colors: ['Beige'], imgs: ['49_1', '49_2'], cols: TJ },
  { post: 50, name: 'Pantalón tejido', cat: 'pantalones', colors: ['Crudo', 'Rayado negro'], imgs: ['50_1', '51_1', '50_2', '51_2', '50_3', '51_3'], cols: [...PV, ...TJ] },
  { post: 52, name: 'Musculosa Alma', cat: 'musculosas-remeras', colors: ['Gris topo', 'Gris oscuro'], imgs: ['52_1', '52_2'] },
  { post: 53, name: 'Musculosa Lola', cat: 'musculosas-remeras', colors: ['Gris'], imgs: ['53_1', '53_3', '53_2'] },
  // ——— verano 2024/25
  { post: 54, name: 'Body Moon', cat: 'bodys', colors: ['Negro'], imgs: ['54_1', '54_2'], cols: PV },
  { post: 55, name: 'Top Agus', cat: 'tops', colors: ['Bordó', 'Chocolate', 'Blanco', 'Negro'], imgs: ['55_1', '55_2', '55_3'], desc: 'Disponible también en color negro.', cols: PV, featured: true },
  { post: 56, name: 'Mono Lali', cat: 'vestidos', colors: ['Negro'], imgs: ['56_1', '56_2'], sizes: ['S', 'M'], cols: PV },
  { post: 57, name: 'Musculosa Jaz', cat: 'musculosas-remeras', colors: ['Blanco'], imgs: ['57_1', '57_2'], cols: PV },
  { post: 58, name: 'Vestido Debra', cat: 'vestidos', colors: ['Negro'], imgs: ['58_1'], desc: 'Lo amamos.', cols: PV },
  { post: 59, name: 'Vestido Dior', cat: 'vestidos', colors: ['Negro', 'Blanco', 'Bordó'], imgs: ['59_1', '59_2'], desc: 'Disponible en color negro, blanco y bordó.', cols: PV, featured: true },
  { post: 60, name: 'Vestido French', cat: 'vestidos', colors: ['Negro'], imgs: ['60_1', '60_2', '73_2', '73_3', '73_1'], cols: PV },
  { post: 61, name: 'Top Shine', cat: 'tops', colors: ['Blanco'], imgs: ['61_2', '61_1', '61_3'], desc: 'Combinalo con la pollera Emi.', cols: PV },
  { post: 62, name: 'Musculosa Hawái', cat: 'musculosas-remeras', colors: ['Negro'], imgs: ['62_1', '62_3', '62_2'], cols: PV },
  { post: 63, name: 'Top Caly', cat: 'tops', colors: ['Terracota'], imgs: ['63_1', '63_2', '63_3'], cols: PV },
  { post: 64, name: 'Top Cora', cat: 'tops', colors: ['Negro'], imgs: ['64_1', '64_2'], cols: PV },
  { post: 65, name: 'Short tiro bajo', cat: 'shorts-polleras', colors: ['Jean negro'], imgs: ['65_1', '65_2'], desc: 'Corto de adelante y más largo de atrás.', sizesNote: 'Consultar talles', cols: PV },
  { post: 66, name: 'Pollera Emi', cat: 'shorts-polleras', colors: ['Negro', 'Blanco'], imgs: ['66_3', '66_2', '66_1'], desc: 'Disponible en negra y blanca.', cols: PV, featured: true },
  { post: 67, name: 'Pollera Conni', cat: 'shorts-polleras', colors: ['Negro'], imgs: ['67_1'], desc: 'Con el top microfibra.', cols: PV },
  { post: 69, name: 'Pollera con encaje', cat: 'shorts-polleras', colors: ['Negro'], imgs: ['69_1', '69_2'], cols: PV },
  { post: 71, name: 'Top Amy', cat: 'tops', colors: ['Azul oscuro'], imgs: ['71_1', '71_2', '71_3'], cols: PV },
  { post: 72, name: 'Top California', cat: 'tops', colors: ['Blanco'], imgs: ['72_1'], desc: 'Estos tops no te pueden faltar.', cols: PV },
  { post: 72, name: 'Top Cielo', cat: 'tops', colors: ['Celeste'], imgs: ['72_3', '72_2'], desc: 'Estos tops no te pueden faltar.', cols: PV },
  { post: 74, name: 'Top Ceda', cat: 'tops', colors: ['Gris', 'Rosa'], imgs: ['74_2', '74_5', '74_1', '74_4', '74_3'], cols: PV },
  { post: 75, name: 'Vestido de hilo', cat: 'vestidos', colors: ['Crudo'], imgs: ['75_2', '75_1', '75_3', '75_4'], cols: [...PV, ...TJ], featured: true },
  { post: 76, name: 'Sweater de hilo crudo', cat: 'sweaters', colors: ['Crudo'], imgs: ['76_1', '76_2', '76_3', '76_4'], cols: [...PV, ...TJ] },
  { post: 77, name: 'Short crochet', cat: 'shorts-polleras', colors: ['Crudo'], imgs: ['77_1', '77_2', '77_3'], cols: [...PV, ...TJ] },
  { post: 78, name: 'Top Vibra', cat: 'tops', colors: ['Azul'], imgs: ['78_1', '78_2'], cols: PV },
  { post: 79, name: 'Musculosa Maldivas + Short Kiech', cat: 'conjuntos', colors: ['Crudo'], imgs: ['79_1', '79_2'], cols: [...PV, ...TJ] },
  { post: 80, name: 'Top Sol', cat: 'tops', colors: ['Blanco y negro'], imgs: ['80_1', '80_3', '80_2'], cols: [...PV, ...TJ] },
  { post: 81, name: 'Pollera Amy', cat: 'shorts-polleras', colors: ['Negro'], imgs: ['81_1', '81_2'], desc: 'Con el top un hombro.', cols: PV },
  { post: 82, name: 'Top Hilo', cat: 'tops', colors: ['Blanco'], imgs: ['82_3', '82_1', '82_2'], cols: [...PV, ...TJ] },
  { post: 83, name: 'Top B&L', cat: 'tops', colors: ['Beige'], imgs: ['83_2', '83_1', '83_3'], cols: [...PV, ...TJ] },
  { post: 84, name: 'Camisa de lino', cat: 'musculosas-remeras', colors: ['Blanco'], imgs: ['84_3', '84_1', '84_2'], cols: [...PV, ...TJ] },
  { post: 85, name: 'Sweater de lino', cat: 'sweaters', colors: ['Celeste', 'Negro'], imgs: ['85_2', '85_1', '85_3', '85_4'], cols: [...PV, ...TJ] },
  { post: 86, name: 'Top Mery', cat: 'tops', colors: ['Blanco'], imgs: ['86_1', '86_3', '86_2'], cols: PV },
];

/** Historias de la destacada "EN STOCK" sin textos encima ni collages. */
export const STORIES = [2, 3, 4, 6, 9, 13, 14, 15, 16, 17, 18, 19, 21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 35, 39, 40, 43, 44, 45, 46, 48];

export const BENEFITS = [
  { icon: 'truck', title: 'Envíos a todo el país', text: 'Hacemos envíos a toda la Argentina.' },
  { icon: 'pin', title: 'Gratis en Villa Gesell', text: 'Dentro de Villa Gesell el envío es gratis.' },
  { icon: 'hanger', title: 'Showroom', text: 'Probate todo en Paseo 104 entre 3 y 4.' },
  { icon: 'chat', title: 'Atención por mensaje', text: 'Precios, talles y envíos: escribinos y te respondemos.' },
];

export const SETTINGS = {
  business: {
    name: 'Under Clothing',
    displayName: 'UndeR Clothing',
    tagline: 'Tu próximo “me lo merezco” está acá',
    description: 'Tienda de ropa de mujer en Villa Gesell. Nuevos ingresos todas las temporadas y envíos a todo el país.',
    address: 'Paseo 104 entre Av. 3 y 4',
    city: 'Villa Gesell',
    province: 'Buenos Aires',
    country: 'AR',
    mapsQuery: 'Paseo 104 entre Avenida 3 y Avenida 4, Villa Gesell, Buenos Aires',
    instagram: 'under.clothing7',
    whatsapp: '', // no figura en el Instagram: cargarlo desde el panel
    email: '',
  },
  hours: {
    timezone: 'America/Argentina/Buenos_Aires',
    // 0 = domingo … 6 = sábado
    days: [
      { day: 1, ranges: [['11:00', '13:00'], ['17:30', '20:00']] },
      { day: 2, ranges: [['11:00', '13:00'], ['17:30', '20:00']] },
      { day: 3, ranges: [['11:00', '13:00'], ['17:30', '20:00']] },
      { day: 4, ranges: [['11:00', '13:00'], ['17:30', '20:00']] },
      { day: 5, ranges: [['11:00', '13:00'], ['17:30', '20:00']] },
      { day: 6, ranges: [['11:00', '13:00'], ['17:30', '20:00']] },
      { day: 0, ranges: [] },
    ],
    note: '',
  },
  shipping: {
    intro: 'Hacemos envíos a todo el país.',
    items: [
      { title: 'A toda la Argentina', text: 'Enviamos tu pedido a cualquier punto del país. El costo y el tiempo de entrega te los pasamos por mensaje al confirmar el pedido.' },
      { title: 'Villa Gesell', text: 'Dentro de Villa Gesell el envío es gratis.' },
      { title: 'Retiro en el local', text: 'Podés retirar tu pedido en el showroom: Paseo 104 entre 3 y 4, de lunes a sábado de 11:00 a 13:00 y de 17:30 a 20:00.' },
    ],
  },
  returns: { intro: '', items: [] as { title: string; text: string }[] },
  payments: { intro: '', methods: [] as { title: string; text: string }[] },
  seo: {
    title: 'Under Clothing — Ropa de mujer en Villa Gesell',
    description: 'Tops, vestidos, sweaters, buzos, jeans y más. Showroom en Paseo 104 entre 3 y 4, Villa Gesell. Envíos a todo el país.',
  },
};
