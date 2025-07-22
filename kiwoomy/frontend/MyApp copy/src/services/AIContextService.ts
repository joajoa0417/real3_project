import { User, UserStock, TradeHistory } from './IndexedDBService';
import IndexedDBService from './IndexedDBService';

interface UserContext {
  user: User;
  stocks: UserStock[];
  trades: TradeHistory[];
  summary: {
    totalAssets: number;
    totalValue: number;
    totalProfitLoss: number;
    profitRate: string;
    deposit: number;
    stockCount: number;
  };
  personalityProfile: {
    investmentStyle: string;
    riskLevel: string;
    preferredSectors: string[];
    tradingFrequency: string;
  };
  contextPrompt: string;
}

class AIContextService {
  private currentUserContext: UserContext | null = null;

  // 사용자 로그인 시 컨텍스트 생성
  async createUserContext(userId: string): Promise<UserContext | null> {
    try {
      console.log(`🤖 AI 컨텍스트 생성 시작: ${userId}`);
      
      // 사용자 정보 조회
      const user = await IndexedDBService.getUser(userId);
      if (!user) {
        console.error('사용자를 찾을 수 없습니다.');
        return null;
      }

      // 보유종목 조회
      const stocks = await IndexedDBService.getUserStocks(userId);
      
      // 거래내역 조회
      const trades = await IndexedDBService.getTradeHistory(userId);

      // 요약 정보 계산
      const summary = this.calculateSummary(stocks);

      // 투자 성향 분석
      const personalityProfile = this.analyzeInvestmentProfile(stocks, trades);

      // AI용 컨텍스트 프롬프트 생성
      const contextPrompt = this.generateContextPrompt(user, stocks, trades, summary, personalityProfile);

      const context: UserContext = {
        user,
        stocks,
        trades,
        summary,
        personalityProfile,
        contextPrompt
      };

      this.currentUserContext = context;
      console.log('🤖 AI 컨텍스트 생성 완료:', context);
      
      return context;
    } catch (error) {
      console.error('AI 컨텍스트 생성 오류:', error);
      return null;
    }
  }

  // 현재 사용자 컨텍스트 반환
  getCurrentContext(): UserContext | null {
    return this.currentUserContext;
  }

  // 컨텍스트 초기화 (로그아웃 시)
  clearContext(): void {
    this.currentUserContext = null;
    console.log('🤖 AI 컨텍스트 초기화됨');
  }

  // 요약 정보 계산
  private calculateSummary(stocks: UserStock[]) {
    const totalValue = stocks.reduce((sum, stock) => sum + stock.totalValue, 0);
    const totalProfitLoss = stocks.reduce((sum, stock) => sum + stock.profitLoss, 0);
    const deposit = stocks[0]?.deposit || 0;
    const totalAssets = totalValue + deposit;
    const profitRate = totalValue > 0 ? ((totalProfitLoss / (totalValue - totalProfitLoss)) * 100).toFixed(2) : '0.00';

    return {
      totalAssets,
      totalValue,
      totalProfitLoss,
      profitRate,
      deposit,
      stockCount: stocks.length
    };
  }

  // 투자 성향 분석
  private analyzeInvestmentProfile(stocks: UserStock[], trades: TradeHistory[]) {
    // 투자 스타일 분석
    let investmentStyle = '안정형';
    if (stocks.length > 5) investmentStyle = '적극형';
    else if (stocks.length > 3) investmentStyle = '중립형';

    // 리스크 레벨 분석
    const avgProfitLoss = stocks.reduce((sum, stock) => sum + Math.abs(parseFloat(stock.profitRate.replace('%', ''))), 0) / stocks.length;
    let riskLevel = '보수적';
    if (avgProfitLoss > 10) riskLevel = '공격적';
    else if (avgProfitLoss > 5) riskLevel = '중간';

    // 선호 섹터 분석
    const sectorMap: { [key: string]: number } = {};
    stocks.forEach(stock => {
      // 종목명을 기반으로 간단한 섹터 분류
      if (stock.stockName.includes('바이오') || stock.stockName.includes('약품')) {
        sectorMap['바이오/제약'] = (sectorMap['바이오/제약'] || 0) + 1;
      } else if (stock.stockName.includes('전력') || stock.stockName.includes('에너지')) {
        sectorMap['에너지'] = (sectorMap['에너지'] || 0) + 1;
      } else if (stock.stockName.includes('차') || stock.stockName.includes('모빌리티')) {
        sectorMap['자동차'] = (sectorMap['자동차'] || 0) + 1;
      } else if (stock.stockName.includes('HMM') || stock.stockName.includes('해운')) {
        sectorMap['해운/물류'] = (sectorMap['해운/물류'] || 0) + 1;
      } else {
        sectorMap['기타'] = (sectorMap['기타'] || 0) + 1;
      }
    });

    const preferredSectors = Object.entries(sectorMap)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([sector]) => sector);

    // 거래 빈도 분석
    let tradingFrequency = '장기 보유형';
    if (trades.length > 10) tradingFrequency = '활발한 거래형';
    else if (trades.length > 5) tradingFrequency = '중간 거래형';

    return {
      investmentStyle,
      riskLevel,
      preferredSectors,
      tradingFrequency
    };
  }

  // AI용 컨텍스트 프롬프트 생성
  private generateContextPrompt(
    user: User, 
    stocks: UserStock[], 
    trades: TradeHistory[], 
    summary: any, 
    profile: any
  ): string {
    return `
당신은 ${user.name}님의 전용 금융 AI 상담사입니다. 다음은 ${user.name}님의 상세 정보입니다:

## 🏛️ 기본 정보
- 이름: ${user.name}
- 사용자 ID: ${user.id}

## 💰 자산 현황
- 총 자산: ${summary.totalAssets.toLocaleString()}원
- 투자 금액: ${summary.totalValue.toLocaleString()}원
- 예수금: ${summary.deposit.toLocaleString()}원
- 평가손익: ${summary.totalProfitLoss >= 0 ? '+' : ''}${summary.totalProfitLoss.toLocaleString()}원
- 수익률: ${summary.totalProfitLoss >= 0 ? '+' : ''}${summary.profitRate}%
- 보유종목 수: ${summary.stockCount}개

## 📈 보유종목 상세
${stocks.map(stock => `
- ${stock.stockName} (${stock.stockCode})
  * 수량: ${stock.quantity.toLocaleString()}주
  * 평균단가: ${stock.avgPrice.toLocaleString()}원
  * 현재가: ${stock.currentPrice.toLocaleString()}원
  * 평가금액: ${stock.totalValue.toLocaleString()}원
  * 손익: ${stock.profitLoss >= 0 ? '+' : ''}${stock.profitLoss.toLocaleString()}원 (${stock.profitRate})`).join('')}

## 📊 투자 성향 분석
- 투자 스타일: ${profile.investmentStyle}
- 리스크 성향: ${profile.riskLevel}
- 선호 섹터: ${profile.preferredSectors.join(', ')}
- 거래 빈도: ${profile.tradingFrequency}

## 💱 최근 거래내역 (최대 5건)
${trades.slice(0, 5).map(trade => `
- ${trade.tradeDateTime}: ${trade.tradeType} ${trade.stockName} ${trade.quantity}주 @${trade.price.toLocaleString()}원
  사유: ${trade.description}`).join('')}

## 🎯 상담 지침
1. ${user.name}님의 이름을 자연스럽게 사용하여 개인화된 상담을 제공하세요.
2. 위 정보를 바탕으로 구체적이고 개인화된 투자 조언을 제공하세요.
3. ${user.name}님의 투자 성향(${profile.investmentStyle}, ${profile.riskLevel})에 맞는 조언을 하세요.
4. 현재 보유종목의 손익 상황을 고려한 조언을 제공하세요.
5. 친근하고 전문적인 톤으로 대화하세요.
6. 구체적인 수치와 데이터를 활용하여 설득력 있는 조언을 하세요.

이제 ${user.name}님과 자연스럽고 개인화된 금융 상담을 시작하세요.
    `.trim();
  }

  // 실시간 데이터 업데이트 (주가 변동 시)
  async updateStockPrices(userId: string): Promise<void> {
    if (this.currentUserContext && this.currentUserContext.user.id === userId) {
      // 최신 주식 데이터로 컨텍스트 업데이트
      const updatedStocks = await IndexedDBService.getUserStocks(userId);
      this.currentUserContext.stocks = updatedStocks;
      this.currentUserContext.summary = this.calculateSummary(updatedStocks);
      
      // 컨텍스트 프롬프트 재생성
      this.currentUserContext.contextPrompt = this.generateContextPrompt(
        this.currentUserContext.user,
        this.currentUserContext.stocks,
        this.currentUserContext.trades,
        this.currentUserContext.summary,
        this.currentUserContext.personalityProfile
      );
      
      console.log('🤖 AI 컨텍스트 업데이트됨');
    }
  }
}

export default new AIContextService(); 