export const WEEKLY_CHART_DATA = [
  { month: 'Jan', openRate: 300, ctr: 240, bounce: 300 },
  { month: 'Feb', openRate: 380, ctr: 280, bounce: 290 },
  { month: 'Mar', openRate: 240, ctr: 200, bounce: 290 },
  { month: 'Apr', openRate: 300, ctr: 260, bounce: 300 },
  { month: 'May', openRate: 250, ctr: 200, bounce: 280 },
  { month: 'Jun', openRate: 350, ctr: 280, bounce: 290 },
  { month: 'Jul', openRate: 300, ctr: 250, bounce: 290 },
  { month: 'Aug', openRate: 320, ctr: 250, bounce: 290 },
  { month: 'Sep', openRate: 300, ctr: 250, bounce: 290 },
  { month: 'Oct', openRate: 320, ctr: 270, bounce: 300 },
  { month: 'Nov', openRate: 380, ctr: 280, bounce: 290 },
  { month: 'Dec', openRate: 280, ctr: 240, bounce: 290 },
]

export const CHART_MAX = 1000
export const CHART_TICKS = [0, 200, 400, 600, 800, 1000]

export const CHART_SERIES = [
  { id: 'openRate', label: 'Open rate', color: 'bg-brand-300', dot: 'bg-brand-300' },
  { id: 'ctr', label: 'CTR', color: 'bg-brand-500', dot: 'bg-brand-500' },
  { id: 'bounce', label: 'Bounce rate', color: 'bg-brand-700', dot: 'bg-brand-700' },
]

export const REHABILITATED_PROJECTS = [
  { id: 1, code: '20FGSPSPT1-REAB', date: '10/03/2026' },
  { id: 2, code: '21VIANA2TR', date: '16/12/2025' },
  { id: 3, code: '22SER2LES', date: '17/02/2026' },
  { id: 4, code: '22SER2LES', date: '17/02/2026' },
]

export const PROJECT_DETAIL = {
  code: '23FGS2TR',
  status: { variant: 'success', label: 'Aprovado' },
  file: '23FGS2TR_LTC_20251120_20260116.laz',
  lastSurvey: '16/01/2026',
  surveys: 6,
  metragem: '296',
  notes:
    'O escaneamento capturou bem a maior parte da estrutura, com boa qualidade geral. Em alguns pontos específicos, aparecem pequenas irregularidades e áreas que podem indicar desgaste ou deformação. Também há regiões com menor definição, principalmente nas extremidades.',
  projectUrl:
    'https://voidmapper.pointshareplus.com/psp/view/v/dst6ac7f5a6-1e05-4905-825f-feea975f4fa6',
  mainImage: 'https://www.figma.com/api/mcp/asset/6c078b29-9550-4712-90a4-6fd91edb2251',
  thumbnails: [
    'https://www.figma.com/api/mcp/asset/5cbbd6b0-a32a-4a7e-bf6c-484990fcf249',
    'https://www.figma.com/api/mcp/asset/f1a9ccb0-74c7-4486-9e4a-af4f318b2ec7',
    'https://www.figma.com/api/mcp/asset/387cb34a-5dc2-4df7-9d14-cc851e34f535',
  ],
  mapImage: 'https://www.figma.com/api/mcp/asset/7d13b1fb-e14b-4b4a-a2e3-da6571685648',
}

export const PROJECTS = [
  {
    id: 1,
    code: '23SERRP-teste',
    date: '23/12/2025',
    surveys: 6,
    statuses: [
      { variant: 'success', label: 'Aprovado' },
      { variant: 'danger', label: 'Deformação' },
    ],
  },
  {
    id: 2,
    code: '14-CGABALRP',
    date: '02/10/2025',
    surveys: 2,
    statuses: [{ variant: 'success', label: 'Aprovado' }],
  },
  {
    id: 3,
    code: '22-FGS1LE',
    date: '16/01/2026',
    surveys: 10,
    statuses: [
      { variant: 'success', label: 'Aprovado' },
      { variant: 'danger', label: 'Deformação' },
    ],
  },
  {
    id: 4,
    code: '161BAL-2LE',
    date: '30/07/2025',
    surveys: 4,
    statuses: [{ variant: 'success', label: 'Aprovado' }],
  },
  {
    id: 5,
    code: '23FGSBEV',
    date: '16/01/2026',
    surveys: 4,
    statuses: [
      { variant: 'success', label: 'Aprovado' },
      { variant: 'danger', label: 'Deformação' },
    ],
  },
  {
    id: 6,
    code: '6SER1TRPT1',
    date: '25/10/2025',
    surveys: 3,
    statuses: [{ variant: 'success', label: 'Aprovado' }],
  },
  {
    id: 7,
    code: '21-VIANA1TR',
    date: '02/01/2026',
    surveys: 14,
    statuses: [
      { variant: 'success', label: 'Aprovado' },
      { variant: 'warning', label: 'Reabilitando' },
    ],
  },
  {
    id: 8,
    code: '221-FGS2LE',
    date: '01/02/2026',
    surveys: 12,
    statuses: [{ variant: 'success', label: 'Aprovado' }],
  },
  {
    id: 9,
    code: 'N15-N16BAL RP',
    date: '23/12/2025',
    surveys: 1,
    statuses: [{ variant: 'success', label: 'Aprovado' }],
  },
  {
    id: 10,
    code: '231-FGSRP',
    date: '16/01/2026',
    surveys: 6,
    statuses: [{ variant: 'success', label: 'Aprovado' }],
  },
  {
    id: 11,
    code: '17FGS-CLARIFICADOR',
    date: '23/12/2025',
    surveys: 1,
    statuses: [{ variant: 'success', label: 'Aprovado' }],
  },
  {
    id: 12,
    code: '18SERRPA',
    date: '17/02/2026',
    surveys: 5,
    statuses: [
      { variant: 'success', label: 'Aprovado' },
      { variant: 'info', label: 'Erro' },
    ],
  },
]

export const MONITORING_ROWS = [
  { area: '22_FGS',    project: 'N221FGS2',           frequencyDays: 7,  lastSurvey: '26/02/2026', surveys: 10, daysUntilNext: 33 },
  { area: '22 FGS',   project: 'N22FGS 1º',           frequencyDays: 7,  lastSurvey: '02/01/2026', surveys: 8,  daysUntilNext: 33 },
  { area: '21 VIA',   project: 'N21 VIA 2º TR',        frequencyDays: 7,  lastSurvey: '02/01/2026', surveys: 4,  daysUntilNext: 33 },
  { area: '21 VIA',   project: 'N21 VIA 1º TR',        frequencyDays: 7,  lastSurvey: '02/01/2026', surveys: 13, daysUntilNext: 33 },
  { area: '22 SER',   project: '22SER 2º SN LE',       frequencyDays: 7,  lastSurvey: '17/02/2026', surveys: 6,  daysUntilNext: 33 },
  { area: '12 BAL',   project: '12 BAL INTERSEÇÃO',    frequencyDays: 15, lastSurvey: '16/12/2025', surveys: 4,  daysUntilNext: 33 },
  { area: '23 SER',   project: '23 SER RAMPA',         frequencyDays: 7,  lastSurvey: '02/01/2026', surveys: 6,  daysUntilNext: 33 },
  { area: '23 FGS',   project: 'N23 FGS 2º SN',        frequencyDays: 7,  lastSurvey: '23/12/2025', surveys: 5,  daysUntilNext: 33 },
  { area: '23 FGS',   project: '23 FGS RAMPA',         frequencyDays: 7,  lastSurvey: '23/12/2025', surveys: 5,  daysUntilNext: 33 },
  { area: '15/16 BAL',project: 'N 15/16 BAL RP',       frequencyDays: 15, lastSurvey: '17/02/2026', surveys: 5,  daysUntilNext: 33 },
]

const SCAN_IMG = 'https://www.figma.com/api/mcp/asset/54ffa636-789d-4fed-beea-29d73b471a48'

export const REPORT_DATA = {
  weekStats: [
    { label: 'Novos Levantamentos', value: 3 },
    { label: 'Deformação', value: 1 },
    { label: 'Reabilitação', value: 0 },
    { label: 'Erros', value: 0 },
  ],
  newSurveys: [
    { src: SCAN_IMG, filename: '18lig_20260403_clean.laz' },
    { src: SCAN_IMG, filename: '18lig_20260403_clean.laz' },
    { src: SCAN_IMG, filename: '18lig_20260403_clean.laz' },
    { src: SCAN_IMG, filename: '18lig_20260403_clean.laz' },
    { src: SCAN_IMG, filename: '18lig_20260403_clean.laz' },
    { src: SCAN_IMG, filename: '18lig_20260403_clean.laz' },
  ],
  newProjects: [
    { src: SCAN_IMG, filename: '18lig_20260403_clean.laz' },
  ],
  deformation: {
    code: '17FGS CLARIFICADOR',
    file: '17FGSRP_LTC_20251016_20260320.laz',
    lastSurvey: '02/03/2026',
    surveys: 5,
    notes:
      'O escaneamento capturou bem a maior parte da estrutura, com boa qualidade geral. Em alguns pontos específicos, aparecem pequenas irregularidades e áreas que podem indicar desgaste ou deformação. Também há regiões com menor definição, principalmente nas extremidades.',
    projectUrl:
      'https://voidmapper.pointshareplus.com/psp/view/v/dst6ac7f5a6-1e05-4905-825f-feea975f4fa6',
    mainImage: 'https://www.figma.com/api/mcp/asset/6d0bda86-261b-4b00-ba65-70c0a7241b5e',
    thumbnails: [
      'https://www.figma.com/api/mcp/asset/39359dc0-f2a0-4492-99b7-1bf512acc6ca',
      'https://www.figma.com/api/mcp/asset/cc571f73-bf7d-4d46-b9ac-7a4817c9fd9f',
      'https://www.figma.com/api/mcp/asset/6512a558-9fbc-4551-91ed-0d6fabdb0264',
    ],
  },
}

export const RECENT_SURVEYS = [
  {
    id: 1,
    local: '22SERRPCOMP',
    file: '22-SERPCOMP_STC_20260302_20260310.laz',
    status: { variant: 'success', label: 'Aprovado' },
    date: '10/03/2026',
    surveys: 4,
    metering: '120 M',
  },
  {
    id: 2,
    local: '21VIANA2TR',
    file: '21VIANA2TR_LTC_20251118_20251216.laz',
    status: { variant: 'danger', label: 'Deformação' },
    date: '16/12/2025',
    surveys: 4,
    metering: '220 M',
  },
  {
    id: 3,
    local: '22SER2LES',
    file: '22SER2LES_LTC_20251219_20260217.laz',
    status: { variant: 'success', label: 'Aprovado' },
    date: '17/02/2026',
    surveys: 5,
    metering: '90 M',
  },
  {
    id: 4,
    local: '21VIANA2TR-IMP',
    file: '21VIANA2TRIMP_LTC_20251126_20260102.laz',
    status: { variant: 'success', label: 'Aprovado' },
    date: '02/01/2026',
    surveys: 5,
    metering: '320 M',
  },
  {
    id: 5,
    local: '22SER-RR',
    file: '22SER-RR_LTC_20260105_20260112.laz',
    status: { variant: 'warning', label: 'Em análise' },
    date: '12/01/2026',
    surveys: 3,
    metering: '150 M',
  },
]
