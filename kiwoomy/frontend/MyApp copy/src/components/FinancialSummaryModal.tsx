import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Text as SvgText, Path } from 'react-native-svg';
import { UserStock, User, TradeHistory } from '../services/IndexedDBService';
import AIAnalysisModal from './AIAnalysisModal';

// 파이 차트 컴포넌트
function PieChart({ data, size = 200 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const radius = size / 2 - 20;
  const centerX = size / 2;
  const centerY = size / 2;
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -90; // 시작 각도 (12시 방향)
  
  const createPath = (startAngle: number, endAngle: number) => {
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };
  
  return (
    <Svg width={size} height={size}>
      {data.map((item, index) => {
        const angle = (item.value / total) * 360;
        const path = createPath(currentAngle, currentAngle + angle);
        const nextAngle = currentAngle + angle;
        currentAngle = nextAngle;
        
        return (
          <Path
            key={index}
            d={path}
            fill={item.color}
            stroke="#fff"
            strokeWidth="2"
          />
        );
      })}
      {/* 중앙 원 */}
      <Circle cx={centerX} cy={centerY} r={radius * 0.5} fill="#fff" stroke="#f0f0f0" strokeWidth="1" />
      <SvgText x={centerX} y={centerY - 8} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#333">
        총 자산
      </SvgText>
      <SvgText x={centerX} y={centerY + 8} textAnchor="middle" fontSize="10" fill="#666">
        {total.toLocaleString()}원
      </SvgText>
    </Svg>
  );
}

// 금융정보 요약 모달 컴포넌트
interface FinancialSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  userStocks: UserStock[];
  currentUser?: User | null;
  tradeHistory: TradeHistory[];
}

export default function FinancialSummaryModal({ visible, onClose, userStocks, currentUser, tradeHistory }: FinancialSummaryModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAIModalVisible, setIsAIModalVisible] = useState(false);

  if (!currentUser || userStocks.length === 0) return null;

  // 차트 데이터 준비
  const colors = ['#408EE1', '#655EF9', '#8354F8', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
  const chartData = userStocks.map((stock, index) => ({
    label: stock.stockName,
    value: stock.totalValue,
    color: colors[index % colors.length]
  }));

  const totalValue = userStocks.reduce((sum, stock) => sum + stock.totalValue, 0);
  const totalProfitLoss = userStocks.reduce((sum, stock) => sum + stock.profitLoss, 0);
  const deposit = userStocks[0]?.deposit || 0;
  const totalAssets = totalValue + deposit;
  const totalProfitRate = totalValue > 0 ? ((totalProfitLoss / (totalValue - totalProfitLoss)) * 100).toFixed(2) : '0.00';

  // AI 분석 함수
  const handleAIAnalysis = async () => {
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    setAiAnalysis(null);
    setIsAIModalVisible(true); // AI 모달 즉시 열기
    
    try {
      // 포트폴리오 데이터 준비
      const portfolioData = {
        user: currentUser.name,
        totalAssets,
        totalValue,
        totalProfitLoss,
        totalProfitRate,
        deposit,
        stocks: userStocks.map(stock => ({
          name: stock.stockName,
          code: stock.stockCode,
          quantity: stock.quantity,
          avgPrice: stock.avgPrice,
          currentPrice: stock.currentPrice,
          totalValue: stock.totalValue,
          profitLoss: stock.profitLoss,
          profitRate: stock.profitRate
        })),
        recentTrades: tradeHistory.slice(0, 5).map(trade => ({
          stockName: trade.stockName,
          tradeType: trade.tradeType,
          quantity: trade.quantity,
          price: trade.price,
          date: trade.tradeDateTime
        }))
      };

      // AI 분석 요청
      const analysisPrompt = `다음은 ${currentUser.name}님의 포트폴리오 정보입니다:

## 💰 자산 현황
- 총 자산: ${totalAssets.toLocaleString()}원
- 투자 금액: ${(totalValue - totalProfitLoss).toLocaleString()}원
- 평가 금액: ${totalValue.toLocaleString()}원
- 평가 손익: ${totalProfitLoss >= 0 ? '+' : ''}${totalProfitLoss.toLocaleString()}원 (${totalProfitRate}%)
- 예수금: ${deposit.toLocaleString()}원

## 📈 보유 종목
${userStocks.map(stock => 
  `- ${stock.stockName} (${stock.stockCode}): ${stock.quantity}주, 평단가 ${stock.avgPrice.toLocaleString()}원, 현재가 ${stock.currentPrice.toLocaleString()}원, 손익 ${stock.profitLoss >= 0 ? '+' : ''}${stock.profitLoss.toLocaleString()}원 (${stock.profitRate})`
).join('\n')}

## 📊 최근 거래내역
${tradeHistory.slice(0, 5).map(trade => 
  `- ${trade.tradeDateTime}: ${trade.stockName} ${trade.tradeType} ${trade.quantity}주 × ${trade.price.toLocaleString()}원`
).join('\n')}

위 정보를 바탕으로 다음과 같이 분석해주세요:
1. 포트폴리오의 현재 상태 평가
2. 종목별 위험도 및 수익률 분석
3. 투자 성향 및 리밸런싱 제안
4. 향후 투자 전략 권고사항

분석 결과는 친근하고 이해하기 쉽게 작성해주세요.`;

      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: '당신은 전문적인 금융 분석가이자 투자 상담사입니다. 사용자의 포트폴리오를 분석하고 실용적인 조언을 제공해주세요.' },
            { role: 'user', content: analysisPrompt }
          ],
          model: 'gemma3:4b',
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAiAnalysis(data.response);
    } catch (error) {
      console.error('AI 분석 오류:', error);
      setAiAnalysis('죄송합니다. AI 분석 중 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.financialModalContainer}>
          {/* 헤더 */}
          <View style={styles.financialModalHeader}>
            <Text style={styles.financialModalTitle}>나의 금융정보 요약</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* 계좌요약 카드 */}
            <LinearGradient
              colors={['#408EE1', '#655EF9', '#8354F8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryCard}
            >
              <Text style={styles.summaryCardTitle}>{currentUser.name}님의 포트폴리오</Text>
              <Text style={styles.summaryCardAmount}>{totalAssets.toLocaleString()} 원</Text>
              <Text style={styles.summaryCardSubtitle}>총 자산</Text>
              
              <View style={styles.summaryCardStats}>
                <View style={styles.summaryCardStat}>
                  <Text style={styles.summaryCardStatLabel}>평가손익</Text>
                  <Text style={[styles.summaryCardStatValue, { color: totalProfitLoss >= 0 ? '#FFE6E6' : '#E6F7FF' }]}>
                    {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLoss.toLocaleString()}원
                  </Text>
                </View>
                <View style={styles.summaryCardStat}>
                  <Text style={styles.summaryCardStatLabel}>수익률</Text>
                  <Text style={[styles.summaryCardStatValue, { color: totalProfitLoss >= 0 ? '#FFE6E6' : '#E6F7FF' }]}>
                    {totalProfitLoss >= 0 ? '+' : ''}{totalProfitRate}%
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* 종목 비율 차트 */}
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>종목별 비율</Text>
              <View style={styles.chartContainer}>
                <PieChart data={chartData} size={200} />
              </View>
            </View>

            {/* 범례 */}
            <View style={styles.legendSection}>
              <Text style={styles.legendTitle}>보유 종목</Text>
              {chartData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                  <Text style={styles.legendLabel}>{item.label}</Text>
                  <Text style={styles.legendValue}>
                    {item.value.toLocaleString()}원 ({((item.value / totalValue) * 100).toFixed(1)}%)
                  </Text>
                </View>
              ))}
            </View>

            {/* 추가 정보 */}
            <View style={styles.additionalInfo}>
              <Text style={styles.additionalTitle}>계좌 상세 정보</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>예수금</Text>
                <Text style={styles.infoValue}>{deposit.toLocaleString()}원</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>투자금액</Text>
                <Text style={styles.infoValue}>{(totalValue - totalProfitLoss).toLocaleString()}원</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>평가금액</Text>
                <Text style={styles.infoValue}>{totalValue.toLocaleString()}원</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>보유종목 수</Text>
                <Text style={styles.infoValue}>{userStocks.length}개</Text>
              </View>
            </View>

            {/* 거래내역 */}
            <View style={styles.tradeHistorySection}>
              <Text style={styles.tradeHistoryTitle}>최근 거래내역</Text>
              {tradeHistory.length > 0 ? (
                <View style={styles.tradeHistoryContainer}>
                  {tradeHistory.slice(0, 10).map((trade, index) => (
                    <View key={trade.id} style={styles.tradeHistoryItem}>
                      <View style={styles.tradeHistoryHeader}>
                        <Text style={styles.tradeHistoryStock}>{trade.stockName}</Text>
                        <Text style={[
                          styles.tradeHistoryType,
                          { color: trade.tradeType === '매수' ? '#FF6B6B' : '#4ECDC4' }
                        ]}>
                          {trade.tradeType}
                        </Text>
                      </View>
                      <View style={styles.tradeHistoryDetails}>
                        <Text style={styles.tradeHistoryDetail}>
                          {trade.quantity}주 × {trade.price.toLocaleString()}원
                        </Text>
                        <Text style={styles.tradeHistoryDate}>
                          {new Date(trade.tradeDateTime).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </View>
                      <Text style={styles.tradeHistoryDescription}>{trade.description}</Text>
                    </View>
                  ))}
                  
                  {tradeHistory.length > 10 && (
                    <View style={styles.moreTradesContainer}>
                      <Text style={styles.moreTradesText}>
                        외 {tradeHistory.length - 10}건의 거래내역이 더 있습니다
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.noTradeHistory}>
                  <Ionicons name="receipt-outline" size={48} color="#ccc" />
                  <Text style={styles.noTradeHistoryText}>거래내역이 없습니다</Text>
                </View>
              )}
            </View>

            {/* AI 분석 버튼 */}
            <View style={styles.aiAnalysisSection}>
              {/* 구분선 */}
              <View style={styles.aiSeparator} />
              
              <TouchableOpacity 
                style={styles.aiAnalysisButton}
                onPress={handleAIAnalysis}
                disabled={isAnalyzing}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.aiAnalysisGradient, isAnalyzing && styles.aiAnalysisDisabled]}
                >
                  <Ionicons name="sparkles" size={20} color="#fff" />
                  <Text style={styles.aiAnalysisButtonText}>AI 포트폴리오 분석</Text>
                  <Ionicons name="chevron-forward" size={16} color="#fff" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
      
      {/* AI 분석 모달 */}
      <AIAnalysisModal
        visible={isAIModalVisible}
        onClose={() => setIsAIModalVisible(false)}
        analysis={aiAnalysis}
        isAnalyzing={isAnalyzing}
        userName={currentUser.name}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  financialModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '85%',
    padding: 0,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  financialModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  financialModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  summaryCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  summaryCardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryCardAmount: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  summaryCardSubtitle: {
    color: '#E8F4FD',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  summaryCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCardStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryCardStatLabel: {
    color: '#E8F4FD',
    fontSize: 12,
    marginBottom: 4,
  },
  summaryCardStatValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chartSection: {
    padding: 16,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: 'center',
  },
  legendSection: {
    padding: 16,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  legendValue: {
    fontSize: 12,
    color: '#666',
  },
  additionalInfo: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    margin: 16,
    borderRadius: 12,
  },
  additionalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  tradeHistorySection: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    margin: 16,
    marginBottom: 24,
    borderRadius: 12,
  },
  tradeHistoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  tradeHistoryContainer: {
    maxHeight: 300,
    paddingBottom: 8,
  },
  tradeHistoryItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#408EE1',
  },
  tradeHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tradeHistoryStock: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  tradeHistoryType: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tradeHistoryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tradeHistoryDetail: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  tradeHistoryDate: {
    fontSize: 10,
    color: '#999',
  },
  tradeHistoryDescription: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
  },
  moreTradesContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  moreTradesText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  noTradeHistory: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noTradeHistoryText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  aiAnalysisSection: {
    padding: 20,
    paddingTop: 16,
    marginTop: 8,
    marginBottom: 30,
    backgroundColor: '#ffffff',
  },
  aiSeparator: {
    height: 2,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
    marginHorizontal: 16,
  },
  aiAnalysisButton: {
    marginBottom: 20,
    marginTop: 8,
  },
  aiAnalysisGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  aiAnalysisButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  aiAnalysisDisabled: {
    opacity: 0.7,
  },
}); 