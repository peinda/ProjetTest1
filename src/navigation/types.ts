export type StockStackParamList = {
  StockList: undefined;
  ProductForm: { productId?: number } | undefined;
  StockHistory: { productId?: number } | undefined;
};

export type SalesStackParamList = {
  QuickSale: undefined;
  SalesHistory: undefined;
};

export type CashStackParamList = {
  CashHome: undefined;
  AddAdvance: { advanceId?: number } | undefined;
  Closure: { date: string };
  ClosureHistory: undefined;
  MonthlyBalance: undefined;
};

export type DebtsStackParamList = {
  DebtsList: undefined;
  DebtForm: undefined;
  DebtDetail: { debtId: number };
  DebtsHistory: undefined;
};

export type DashboardStackParamList = {
  Dashboard: undefined;
};
