// Data a partir da qual os gráficos e indicadores do Dashboard
// contabilizam levantamentos. Surveys anteriores a esta data
// permanecem no banco e no histórico dos projetos, mas não
// alimentam métricas, gráficos nem a tabela de recentes.
//
// Para alterar, basta mudar a data abaixo (formato ISO 8601).
export const METRICS_START_DATE = '2020-01-01T00:00:00.000Z'
