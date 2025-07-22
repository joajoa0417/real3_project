import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { UserStock, User } from '../services/IndexedDBService';

interface UserPortfolioProps {
  userStocks: UserStock[];
  currentUser?: User | null;
  hideUserInfo?: boolean;
  onStockPress?: (stock: UserStock) => void;
}

export default function UserPortfolio({ userStocks, currentUser, hideUserInfo = false, onStockPress }: UserPortfolioProps) {
  const formatNumber = (num: number) => {
    return num.toLocaleString('ko-KR');
  };

  const getProfitLossColor = (profitLoss: number) => {
    return profitLoss >= 0 ? '#FF6B6B' : '#4ECDC4';
  };

  const getProfitRateColor = (profitRate: string) => {
    const rate = parseFloat(profitRate.replace('%', ''));
    return rate >= 0 ? '#FF6B6B' : '#4ECDC4';
  };

  const totalValue = userStocks.reduce((sum, stock) => sum + stock.totalValue, 0);
  const totalProfitLoss = userStocks.reduce((sum, stock) => sum + stock.profitLoss, 0);
  const totalProfitRate = totalValue > 0 ? ((totalProfitLoss / (totalValue - totalProfitLoss)) * 100).toFixed(2) : '0.00';
  
  // 예수금 정보 (첫 번째 주식의 예수금 사용, 모든 주식이 같은 예수금을 가짐)
  const deposit = userStocks.length > 0 ? userStocks[0].deposit : 0;
  const totalAssets = totalValue + deposit;

  return (
    <View style={styles.container}>
      {/* 사용자 정보 */}
      {currentUser && !hideUserInfo && (
        <View style={styles.userInfo}>
          <Text style={styles.userInfoTitle}>{currentUser.name}님의 포트폴리오</Text>
          <Text style={styles.userInfoSubtitle}>계좌번호: {currentUser.id}</Text>
        </View>
      )}

      {/* 계좌 요약 */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>계좌 요약</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>총 자산:</Text>
          <Text style={[styles.summaryValue, styles.totalAssets]}>{formatNumber(totalAssets)}원</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>예수금:</Text>
          <Text style={styles.summaryValue}>{formatNumber(deposit)}원</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>총 평가금액:</Text>
          <Text style={styles.summaryValue}>{formatNumber(totalValue)}원</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>총 평가손익:</Text>
          <Text style={[styles.summaryValue, { color: getProfitLossColor(totalProfitLoss) }]}>
            {totalProfitLoss >= 0 ? '+' : ''}{formatNumber(totalProfitLoss)}원
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>총 수익률:</Text>
          <Text style={[styles.summaryValue, { color: getProfitRateColor(parseFloat(totalProfitRate) + '%') }]}>
            {parseFloat(totalProfitRate) >= 0 ? '+' : ''}{totalProfitRate}%
          </Text>
        </View>
      </View>

      {/* 보유종목 목록 */}
      <View style={styles.stocksContainer}>
        <Text style={styles.stocksTitle}>보유종목 ({userStocks.length}개)</Text>
        <ScrollView style={styles.stocksList} showsVerticalScrollIndicator={false}>
          {userStocks.map((stock, index) => (
            <TouchableOpacity
              key={`${stock.userId}-${stock.stockCode}`}
              style={styles.stockItem}
              onPress={() => onStockPress?.(stock)}
            >
              <View style={styles.stockHeader}>
                <Text style={styles.stockName}>{stock.stockName}</Text>
                <Text style={styles.stockCode}>{stock.stockCode}</Text>
              </View>
              
              <View style={styles.stockDetails}>
                <View style={styles.stockRow}>
                  <Text style={styles.stockLabel}>보유수량:</Text>
                  <Text style={styles.stockValue}>{formatNumber(stock.quantity)}주</Text>
                </View>
                
                <View style={styles.stockRow}>
                  <Text style={styles.stockLabel}>평균단가:</Text>
                  <Text style={styles.stockValue}>{formatNumber(stock.avgPrice)}원</Text>
                </View>
                
                <View style={styles.stockRow}>
                  <Text style={styles.stockLabel}>현재가:</Text>
                  <Text style={styles.stockValue}>{formatNumber(stock.currentPrice)}원</Text>
                </View>
                
                <View style={styles.stockRow}>
                  <Text style={styles.stockLabel}>평가금액:</Text>
                  <Text style={styles.stockValue}>{formatNumber(stock.totalValue)}원</Text>
                </View>
                
                <View style={styles.stockRow}>
                  <Text style={styles.stockLabel}>평가손익:</Text>
                  <Text style={[styles.stockValue, { color: getProfitLossColor(stock.profitLoss) }]}>
                    {stock.profitLoss >= 0 ? '+' : ''}{formatNumber(stock.profitLoss)}원
                  </Text>
                </View>
                
                <View style={styles.stockRow}>
                  <Text style={styles.stockLabel}>수익률:</Text>
                  <Text style={[styles.stockValue, { color: getProfitRateColor(stock.profitRate) }]}>
                    {stock.profitRate}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6FA',
  },
  userInfo: {
    backgroundColor: '#5F2E90',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userInfoSubtitle: {
    fontSize: 14,
    color: '#E0D0F0',
  },
  summary: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  totalAssets: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5F2E90',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  stocksContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  stocksTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  stocksList: {
    flex: 1,
  },
  stockItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stockName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  stockCode: {
    fontSize: 12,
    color: '#666666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  stockDetails: {
    gap: 6,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 14,
    color: '#666666',
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
}); 