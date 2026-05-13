export const SURVEY_ANALYTICS_DATA = {
  weekly: [
    { label: 'Seg', surveys: 2,  approved: 2,  deformations: 0, rehabilitating: 0, errors: 0 },
    { label: 'Ter', surveys: 0,  approved: 0,  deformations: 0, rehabilitating: 0, errors: 0 },
    { label: 'Qua', surveys: 3,  approved: 2,  deformations: 1, rehabilitating: 0, errors: 0 },
    { label: 'Qui', surveys: 1,  approved: 1,  deformations: 0, rehabilitating: 0, errors: 0 },
    { label: 'Sex', surveys: 4,  approved: 2,  deformations: 2, rehabilitating: 0, errors: 0 },
    { label: 'Sáb', surveys: 0,  approved: 0,  deformations: 0, rehabilitating: 0, errors: 0 },
    { label: 'Dom', surveys: 1,  approved: 1,  deformations: 0, rehabilitating: 0, errors: 0 },
  ],
  monthly: [
    { label: 'Sem 1', surveys: 8,  approved: 6, deformations: 1, rehabilitating: 1, errors: 0 },
    { label: 'Sem 2', surveys: 5,  approved: 3, deformations: 2, rehabilitating: 0, errors: 0 },
    { label: 'Sem 3', surveys: 12, approved: 8, deformations: 3, rehabilitating: 1, errors: 0 },
    { label: 'Sem 4', surveys: 6,  approved: 5, deformations: 1, rehabilitating: 0, errors: 0 },
  ],
  annual: [
    { label: 'Jan', surveys: 18, approved: 14, deformations: 3, rehabilitating: 1, errors: 0 },
    { label: 'Fev', surveys: 24, approved: 18, deformations: 5, rehabilitating: 1, errors: 0 },
    { label: 'Mar', surveys: 16, approved: 13, deformations: 2, rehabilitating: 1, errors: 0 },
    { label: 'Abr', surveys: 22, approved: 17, deformations: 4, rehabilitating: 1, errors: 0 },
    { label: 'Mai', surveys: 30, approved: 23, deformations: 6, rehabilitating: 1, errors: 0 },
    { label: 'Jun', surveys: 28, approved: 22, deformations: 5, rehabilitating: 1, errors: 0 },
    { label: 'Jul', surveys: 19, approved: 15, deformations: 3, rehabilitating: 1, errors: 0 },
    { label: 'Ago', surveys: 25, approved: 20, deformations: 4, rehabilitating: 1, errors: 0 },
    { label: 'Set', surveys: 21, approved: 16, deformations: 4, rehabilitating: 1, errors: 0 },
    { label: 'Out', surveys: 33, approved: 25, deformations: 7, rehabilitating: 1, errors: 0 },
    { label: 'Nov', surveys: 29, approved: 23, deformations: 5, rehabilitating: 1, errors: 0 },
    { label: 'Dez', surveys: 15, approved: 12, deformations: 2, rehabilitating: 1, errors: 0 },
  ],
}

function makeMonthWeeks(total, deformations, rehabilitating) {
  const deformRatio = total > 0 ? deformations / total : 0
  const rehabRatio  = total > 0 ? rehabilitating  / total : 0
  return [0.27, 0.21, 0.33, 0.19].map((r, i) => {
    const surveys = Math.max(1, Math.round(total * r))
    const def     = Math.max(0, Math.round(surveys * deformRatio))
    const rehab   = Math.max(0, Math.round(surveys * rehabRatio))
    return { label: `Sem ${i + 1}`, surveys, approved: Math.max(0, surveys - def - rehab), deformations: def, rehabilitating: rehab, errors: 0 }
  })
}

export const MONTHLY_ANALYTICS = SURVEY_ANALYTICS_DATA.annual.map((m) =>
  makeMonthWeeks(m.surveys, m.deformations, m.rehabilitating))

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
  projectLength: 296,
  measurementImage: 'https://www.figma.com/api/mcp/asset/5cbbd6b0-a32a-4a7e-bf6c-484990fcf249',
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
