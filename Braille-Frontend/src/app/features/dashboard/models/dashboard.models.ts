export interface StatCardDef {
  label: string;
  valor: number | null;
  icon: string;
  cor: 'primary' | 'info' | 'success' | 'warning' | string;
  rota: string;
  ariaLabel: string;
  queryParams?: Record<string, string>;
}

export interface ActionLinkDef {
  label: string;
  icon: string;
  rota: string;
  ariaLabel: string;
  queryParams?: Record<string, string>;
}

export interface DashboardUIState {
  cards: StatCardDef[];
  acoes: ActionLinkDef[];
}
