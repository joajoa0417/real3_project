import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import TabBar from './TabBar';
import YoutubeSearchModal from './YoutubeSearchModal';
import UserPortfolio from './UserPortfolio';
import FinancialSummaryModal from './FinancialSummaryModal';
import { UserStock, User, TradeHistory } from '../services/IndexedDBService';

interface ContentAreaProps {
  contentTab: string;
  setContentTab: (tab: string) => void;
  onIntroPress?: () => void;
  onSummaryPress?: () => void;
  userStocks?: UserStock[];
  currentUser?: User | null;
  tradeHistory?: TradeHistory[];
}

function ContentSearchBar({ title }: { title: string }) {
  return (
    <View style={styles.searchBarContainer}>
      <LinearGradient
        colors={["#E8F4FD", "#F0E8FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.searchBarGradient}
      >
        <View style={styles.searchBarInner}>
          <LinearGradient
            colors={["#87CEEB", "#9370DB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.magnifierCircle}
          >
            <Ionicons name="search" size={18} color="#fff" />
          </LinearGradient>
          <Text style={styles.searchBarText}>{title}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

// 부동산/자동차 카드 컴포넌트
function ServiceCard({ title, subtitle, iconName }: { title: string, subtitle: string, iconName: string }) {
  return (
    <TouchableOpacity style={styles.serviceCard}>
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Ionicons name={iconName as any} size={25} color="#5F2E90" />
          <View style={styles.dollarSign}>
            <Text style={styles.dollarText}>$</Text>
          </View>
        </View>
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => showAlert('아직 구현 중이에요', '빠른 시일 내에 제공될 예정입니다!')}>
          <Ionicons name="add" size={20} color="#5F2E90" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// 자산 요약 카드 컴포넌트
function AssetSummaryCard() {
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  return (
    <LinearGradient
      colors={['#A85AE0', '#6A5AE0']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.assetCard}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
        <Text style={styles.assetCardTitle}>MY자산 한눈에</Text>
        <Ionicons name="chevron-forward" size={15} color="#fff" style={{ marginLeft: 3 }} />
      </View>
      <Text style={styles.assetCardAmount}>889,999,620 원</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={styles.assetCardDate}>{dateStr}</Text>
        <Ionicons name="refresh" size={13} color="#fff" style={{ marginLeft: 3 }} />
      </View>
      <View style={styles.assetCardCategoryRow}>
        <View style={styles.assetCardCategory}><Text style={styles.assetCardCategoryNum}>7</Text><Text style={styles.assetCardCategoryLabel}>은행</Text></View>
        <View style={styles.assetCardCategory}><Text style={styles.assetCardCategoryNum}>5</Text><Text style={styles.assetCardCategoryLabel}>투자</Text></View>
        <View style={styles.assetCardCategory}><Text style={styles.assetCardCategoryPlus}>+</Text><Text style={styles.assetCardCategoryLabel}>대출</Text></View>
        <View style={styles.assetCardCategory}><Text style={styles.assetCardCategoryPlus}>+</Text><Text style={styles.assetCardCategoryLabel}>보험</Text></View>
        <View style={styles.assetCardCategory}><Text style={styles.assetCardCategoryPlus}>+</Text><Text style={styles.assetCardCategoryLabel}>연금</Text></View>
        <View style={styles.assetCardCategory}><Text style={styles.assetCardCategoryNum}>4</Text><Text style={styles.assetCardCategoryLabel}>카드</Text></View>
      </View>
      <TouchableOpacity style={styles.assetCardCreditBtn} activeOpacity={0.8} onPress={() => showAlert('아직 구현 중이에요', '빠른 시일 내에 제공될 예정입니다!')}>
        <Text style={styles.assetCardCreditText}>내 신용점수는?</Text>
        <Ionicons name="chevron-forward" size={15} color="#fff" style={{ marginLeft: 3 }} />
      </TouchableOpacity>
    </LinearGradient>
  );
}



// 계좌요약 그라데이션 카드 컴포넌트
function AccountSummaryCard({ userStocks, currentUser }: { userStocks: UserStock[], currentUser?: User | null }) {
  if (!currentUser || userStocks.length === 0) return null;

  const formatNumber = (num: number) => num.toLocaleString('ko-KR');
  
  const totalValue = userStocks.reduce((sum, stock) => sum + stock.totalValue, 0);
  const totalProfitLoss = userStocks.reduce((sum, stock) => sum + stock.profitLoss, 0);
  const deposit = userStocks[0]?.deposit || 0;
  const totalAssets = totalValue + deposit;
  const totalProfitRate = totalValue > 0 ? ((totalProfitLoss / (totalValue - totalProfitLoss)) * 100).toFixed(2) : '0.00';

  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  return (
    <LinearGradient
      colors={['#408EE1', '#655EF9', '#8354F8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.accountSummaryCard}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Text style={styles.accountCardTitle}>계좌 요약</Text>
        <Ionicons name="chevron-forward" size={15} color="#fff" style={{ marginLeft: 3 }} />
      </View>
      
      <Text style={styles.accountCardAmount}>{formatNumber(totalAssets)} 원</Text>
      <Text style={styles.accountCardSubtitle}>총 자산</Text>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 12 }}>
        <Text style={styles.accountCardDate}>{dateStr}</Text>
        <Ionicons name="refresh" size={13} color="#fff" style={{ marginLeft: 3 }} />
      </View>

      <View style={styles.accountSummaryRow}>
        <View style={styles.accountSummaryItem}>
          <Text style={styles.accountSummaryLabel}>예수금</Text>
          <Text style={styles.accountSummaryValue}>{formatNumber(deposit)}원</Text>
        </View>
        <View style={styles.accountSummaryItem}>
          <Text style={styles.accountSummaryLabel}>평가금액</Text>
          <Text style={styles.accountSummaryValue}>{formatNumber(totalValue)}원</Text>
        </View>
      </View>

      <View style={styles.accountSummaryRow}>
        <View style={styles.accountSummaryItem}>
          <Text style={styles.accountSummaryLabel}>평가손익</Text>
          <Text style={[styles.accountSummaryValue, { color: totalProfitLoss >= 0 ? '#FFE6E6' : '#E6F7FF' }]}>
            {totalProfitLoss >= 0 ? '+' : ''}{formatNumber(totalProfitLoss)}원
          </Text>
        </View>
        <View style={styles.accountSummaryItem}>
          <Text style={styles.accountSummaryLabel}>수익률</Text>
          <Text style={[styles.accountSummaryValue, { color: totalProfitLoss >= 0 ? '#FFE6E6' : '#E6F7FF' }]}>
            {totalProfitLoss >= 0 ? '+' : ''}{totalProfitRate}%
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

export default function ContentArea({ contentTab, setContentTab, onIntroPress, onSummaryPress, userStocks = [], currentUser, tradeHistory = [] }: ContentAreaProps) {
  const [youtubeModalVisible, setYoutubeModalVisible] = useState(false);
  const [financialSummaryVisible, setFinancialSummaryVisible] = useState(false);
  const homeContents = [
    { title: '마이키우Me에 대해 설명해줘' },
    { title: '나의 금융정보 요약' },
    { title: '종목관련 유튜브영상 검색할래' },
  ];

  return (
    <View style={styles.container}>
      <TabBar contentTab={contentTab} setContentTab={setContentTab} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {contentTab === '홈' && (
          <>
            {homeContents.map((content, index) => (
          <TouchableOpacity
            key={index}
            style={styles.bubbleArea}
            onPress={() => {
              if (content.title === '마이키우Me에 대해 설명해줘' && onIntroPress) {
                onIntroPress();
                  } else if (content.title === '나의 금융정보 요약') {
                    setFinancialSummaryVisible(true);
              } else if (content.title === '종목관련 유튜브영상 검색할래') {
                setYoutubeModalVisible(true);
              }
            }}
            activeOpacity={0.8}
          >
            <ContentSearchBar title={content.title} />
          </TouchableOpacity>
        ))}

          </>
        )}
        {contentTab === '전체보기' && (
          <>
            {/* 사용자 계좌 정보 */}
            {currentUser && (
              <View style={styles.userAccountInfo}>
                <Text style={styles.userAccountTitle}>{currentUser.name}님의 현재 계좌</Text>
                <Text style={styles.userAccountNumber}>계좌번호: {currentUser.id}-0001</Text>
              </View>
            )}

            {/* 계좌요약 그라데이션 카드 */}
            <AccountSummaryCard userStocks={userStocks} currentUser={currentUser} />

            {/* 보유종목 상세 */}
            {userStocks.length > 0 && (
              <View style={styles.stockDetailSection}>
                <Text style={styles.sectionTitle}>보유종목</Text>
                <View style={styles.stockListContainer}>
                  {userStocks.map((stock, index) => (
                    <View key={`${stock.stockCode}-${index}`} style={styles.stockItemCard}>
                      <View style={styles.stockItemHeader}>
                        <Text style={styles.stockItemName}>{stock.stockName}</Text>
                        <Text style={styles.stockItemCode}>{stock.stockCode}</Text>
                      </View>
                      <View style={styles.stockItemDetails}>
                        <View style={styles.stockItemRow}>
                          <Text style={styles.stockItemLabel}>보유수량</Text>
                          <Text style={styles.stockItemValue}>{stock.quantity.toLocaleString()}주</Text>
                        </View>
                        <View style={styles.stockItemRow}>
                          <Text style={styles.stockItemLabel}>평균단가</Text>
                          <Text style={styles.stockItemValue}>{stock.avgPrice.toLocaleString()}원</Text>
                        </View>
                        <View style={styles.stockItemRow}>
                          <Text style={styles.stockItemLabel}>현재가</Text>
                          <Text style={styles.stockItemValue}>{stock.currentPrice.toLocaleString()}원</Text>
                        </View>
                        <View style={styles.stockItemRow}>
                          <Text style={styles.stockItemLabel}>평가금액</Text>
                          <Text style={styles.stockItemValue}>{stock.totalValue.toLocaleString()}원</Text>
                        </View>
                        <View style={styles.stockItemRow}>
                          <Text style={styles.stockItemLabel}>평가손익</Text>
                          <Text style={[styles.stockItemValue, { 
                            color: stock.profitLoss >= 0 ? '#FF6B6B' : '#4ECDC4' 
                          }]}>
                            {stock.profitLoss >= 0 ? '+' : ''}{stock.profitLoss.toLocaleString()}원 ({stock.profitRate})
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 기존 부동산/자동차 섹션 */}
            <View style={styles.allViewContainer}>
              <Text style={styles.allViewTitle}>부동산 / 자동차</Text>
              <Text style={styles.allViewSubtitle}>
                내 부동산, 자동차 연결하고 시세 알아보세요
              </Text>
              <ServiceCard
                title="부동산"
                subtitle="부동산 연결하고 현재가 알아보기"
                iconName="home"
              />
              <ServiceCard
                title="자동차"
                subtitle="내 차 연결하고 시세 알아보기"
                iconName="car"
              />
            </View>
          </>
        )}
      </ScrollView>
      <YoutubeSearchModal visible={youtubeModalVisible} onClose={() => setYoutubeModalVisible(false)} />
      <FinancialSummaryModal 
        visible={financialSummaryVisible} 
        onClose={() => setFinancialSummaryVisible(false)}
        userStocks={userStocks}
        currentUser={currentUser}
        tradeHistory={tradeHistory}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  searchBarContainer: {
    marginBottom: 15,
  },
  searchBarGradient: {
    borderRadius: 25,
    padding: 2,
  },
  searchBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F5FF',
    borderRadius: 23,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
  },
  magnifierCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchBarText: {
    color: '#5F2E90',
    fontWeight: '600',
    fontSize: 14,
    flex: 1,
  },
  bubbleArea: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 20,
    padding: 16,
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0E8FF',
    marginRight: 15,
  },
  dollarSign: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#5F2E90',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dollarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  cardSubtitle: {
    color: '#666',
    fontSize: 12
  },
  addButton: {
    padding: 8
  },
  allViewContainer: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    width: '92%',
    alignSelf: 'center',
  },
  allViewTitle: {
    color: '#333',
    fontSize: 16, 
    fontWeight: 'bold',
    marginBottom: 8,
  },
  allViewSubtitle: {
    color: '#666',
    fontSize: 14,
    marginBottom: 20,
  },
  assetCard: {
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 12,
    paddingVertical: 24,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    width: '85%',
    alignSelf: 'center',
  },
  assetCardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  assetCardAmount: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  assetCardDate: {
    color: '#fff',
    fontSize: 11,
  },
  assetCardCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    marginTop: 4,
  },
  assetCardCategory: {
    alignItems: 'center',
    flex: 1,
  },
  assetCardCategoryNum: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 1,
  },
  assetCardCategoryPlus: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 1,
    opacity: 0.5,
  },
  assetCardCategoryLabel: {
    color: '#fff',
    fontSize: 12,
  },
  assetCardCreditBtn: {
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius:8, 
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 4
  },
  assetCardCreditText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userAccountInfo: {
    backgroundColor: '#5F2E90',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    width: '92%',
    alignSelf: 'center',
  },
  userAccountTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userAccountNumber: {
    fontSize: 14,
    color: '#E0D0F0',
  },
  assetSummarySection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  accountSummaryCard: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: '92%',
    alignSelf: 'center',
  },
  accountCardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  accountCardAmount: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  accountCardSubtitle: {
    color: '#E8F4FD',
    fontSize: 14,
    marginTop: 2,
  },
  accountCardDate: {
    color: '#E8F4FD',
    fontSize: 12,
  },
  accountSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  accountSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  accountSummaryLabel: {
    color: '#E8F4FD',
    fontSize: 12,
    marginBottom: 4,
  },
  accountSummaryValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  stockDetailSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    width: '92%',
    alignSelf: 'center',
  },
  stockListContainer: {
    gap: 12,
  },
  stockItemCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stockItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stockItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  stockItemCode: {
    fontSize: 12,
    color: '#666666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  stockItemDetails: {
    gap: 6,
  },
  stockItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockItemLabel: {
    fontSize: 14,
    color: '#666666',
  },
  stockItemValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
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
    maxHeight: '80%',
    padding: 0,
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

}); 