import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import {
  StockStackParamList,
  SalesStackParamList,
  CashStackParamList,
  DebtsStackParamList,
  DashboardStackParamList,
} from './types';
import { colors } from '../theme/theme';

import StockListScreen from '../screens/stock/StockListScreen';
import ProductFormScreen from '../screens/stock/ProductFormScreen';
import StockHistoryScreen from '../screens/stock/StockHistoryScreen';

import QuickSaleScreen from '../screens/sales/QuickSaleScreen';
import SalesHistoryScreen from '../screens/sales/SalesHistoryScreen';
import EditSaleScreen from '../screens/sales/EditSaleScreen';

import CashHomeScreen from '../screens/cash/CashHomeScreen';
import AddAdvanceScreen from '../screens/cash/AddAdvanceScreen';
import ClosureScreen from '../screens/cash/ClosureScreen';
import ClosureHistoryScreen from '../screens/cash/ClosureHistoryScreen';
import MonthlyBalanceScreen from '../screens/cash/MonthlyBalanceScreen';

import DebtsListScreen from '../screens/debts/DebtsListScreen';
import DebtFormScreen from '../screens/debts/DebtFormScreen';
import DebtDetailScreen from '../screens/debts/DebtDetailScreen';
import DebtsHistoryScreen from '../screens/debts/DebtsHistoryScreen';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import StatisticsScreen from '../screens/dashboard/StatisticsScreen';

const Tab = createBottomTabNavigator();
const StockStack = createNativeStackNavigator<StockStackParamList>();
const SalesStack = createNativeStackNavigator<SalesStackParamList>();
const CashStack = createNativeStackNavigator<CashStackParamList>();
const DebtsStack = createNativeStackNavigator<DebtsStackParamList>();
const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontWeight: '700' as const },
};

function SalesNavigator() {
  return (
    <SalesStack.Navigator screenOptions={screenOptions}>
      <SalesStack.Screen name="QuickSale" component={QuickSaleScreen} options={{ title: 'Vente rapide' }} />
      <SalesStack.Screen name="SalesHistory" component={SalesHistoryScreen} options={{ title: 'Historique des ventes' }} />
      <SalesStack.Screen name="EditSale" component={EditSaleScreen} options={{ title: 'Modifier la vente' }} />
    </SalesStack.Navigator>
  );
}

function StockNavigator() {
  return (
    <StockStack.Navigator screenOptions={screenOptions}>
      <StockStack.Screen name="StockList" component={StockListScreen} options={{ title: 'Stock' }} />
      <StockStack.Screen name="ProductForm" component={ProductFormScreen} options={{ title: 'Produit' }} />
      <StockStack.Screen name="StockHistory" component={StockHistoryScreen} options={{ title: 'Historique du stock' }} />
    </StockStack.Navigator>
  );
}

function CashNavigator() {
  return (
    <CashStack.Navigator screenOptions={screenOptions}>
      <CashStack.Screen name="CashHome" component={CashHomeScreen} options={{ title: 'Caisse' }} />
      <CashStack.Screen name="AddAdvance" component={AddAdvanceScreen} options={{ title: 'Nouvelle avance' }} />
      <CashStack.Screen name="Closure" component={ClosureScreen} options={{ title: 'Clôture du jour' }} />
      <CashStack.Screen name="ClosureHistory" component={ClosureHistoryScreen} options={{ title: 'Historique des clôtures' }} />
      <CashStack.Screen name="MonthlyBalance" component={MonthlyBalanceScreen} options={{ title: 'Bilan mensuel' }} />
    </CashStack.Navigator>
  );
}

function DebtsNavigator() {
  return (
    <DebtsStack.Navigator screenOptions={screenOptions}>
      <DebtsStack.Screen name="DebtsList" component={DebtsListScreen} options={{ title: 'Dettes clients' }} />
      <DebtsStack.Screen name="DebtForm" component={DebtFormScreen} options={{ title: 'Nouvelle dette' }} />
      <DebtsStack.Screen name="DebtDetail" component={DebtDetailScreen} options={{ title: 'Détail dette' }} />
      <DebtsStack.Screen name="DebtsHistory" component={DebtsHistoryScreen} options={{ title: 'Dettes soldées' }} />
    </DebtsStack.Navigator>
  );
}

function DashboardNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={screenOptions}>
      <DashboardStack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Tableau de bord' }} />
      <DashboardStack.Screen name="Statistics" component={StatisticsScreen} options={{ title: 'Statistiques' }} />
    </DashboardStack.Navigator>
  );
}

function TabIcon({ symbol }: { symbol: string }) {
  return <Text style={{ fontSize: 20 }}>{symbol}</Text>;
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
        }}
      >
        <Tab.Screen
          name="Vente"
          component={SalesNavigator}
          options={{ tabBarIcon: () => <TabIcon symbol="🛒" /> }}
        />
        <Tab.Screen
          name="Stock"
          component={StockNavigator}
          options={{ tabBarIcon: () => <TabIcon symbol="📦" /> }}
        />
        <Tab.Screen
          name="Caisse"
          component={CashNavigator}
          options={{ tabBarIcon: () => <TabIcon symbol="💰" /> }}
        />
        <Tab.Screen
          name="Dettes"
          component={DebtsNavigator}
          options={{ tabBarIcon: () => <TabIcon symbol="📒" /> }}
        />
        <Tab.Screen
          name="Résumé"
          component={DashboardNavigator}
          options={{
            tabBarIcon: () => <TabIcon symbol="📊" />,
            tabBarLabel: 'Résumé',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
