export interface User {
  id: string;
  name: string;
  password: string;
}

export interface UserStock {
  userId: string;
  stockName: string;
  stockCode: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitRate: string;
  deposit: number;
}

export interface TradeHistory {
  id: string;
  userId: string;
  accountNumber: string;
  stockName: string;
  stockCode: string;
  tradeDateTime: string;
  tradeType: string;
  quantity: number;
  price: number;
  description: string;
}

class IndexedDBService {
  private dbName = 'KiwoomyDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('IndexedDB 초기화 시작...');
      
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('IndexedDB 열기 실패:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB 연결 성공');
        this.insertInitialData().then(resolve).catch(reject);
      };

      request.onupgradeneeded = (event) => {
        console.log('IndexedDB 스키마 업그레이드 중...');
        const db = (event.target as IDBOpenDBRequest).result;

        // Users 테이블
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          console.log('users 테이블 생성됨');
        }

        // UserStocks 테이블
        if (!db.objectStoreNames.contains('userStocks')) {
          const stockStore = db.createObjectStore('userStocks', { keyPath: ['userId', 'stockCode'] });
          stockStore.createIndex('userId', 'userId', { unique: false });
          console.log('userStocks 테이블 생성됨');
        }

        // TradeHistory 테이블
        if (!db.objectStoreNames.contains('tradeHistory')) {
          const tradeStore = db.createObjectStore('tradeHistory', { keyPath: 'id' });
          tradeStore.createIndex('userId', 'userId', { unique: false });
          console.log('tradeHistory 테이블 생성됨');
        }
      };
    });
  }

  private async insertInitialData(): Promise<void> {
    if (!this.db) return;

    console.log('초기 데이터 삽입 시작...');

    // 사용자 데이터
    const users: User[] = [
      { id: 'user01', name: '이경희', password: '1234' },
      { id: 'user02', name: '김우진', password: '1234' },
      { id: 'user03', name: '이준혁', password: '1234' },
      { id: 'user04', name: '김영철', password: '1234' },
      { id: 'user05', name: '박정훈', password: '1234' },
      { id: 'user06', name: '김승현', password: '1234' },
    ];

    // 보유종목 데이터
    const userStocks: UserStock[] = [
      { userId: 'user01', stockName: '한미약품', stockCode: '128940', quantity: 27, avgPrice: 116924, currentPrice: 114084, totalValue: 3080268, profitLoss: -76680, profitRate: '-2.43%', deposit: 2016927 },
      { userId: 'user01', stockName: '현대차', stockCode: '5380', quantity: 15, avgPrice: 118202, currentPrice: 113256, totalValue: 1698840, profitLoss: -74190, profitRate: '-4.18%', deposit: 2016927 },
      { userId: 'user01', stockName: 'NAVER', stockCode: '35420', quantity: 4, avgPrice: 85124, currentPrice: 92003, totalValue: 368012, profitLoss: 27516, profitRate: '8.08%', deposit: 2016927 },
      { userId: 'user02', stockName: 'HMM', stockCode: '11200', quantity: 22, avgPrice: 82313, currentPrice: 89549, totalValue: 1970078, profitLoss: 159192, profitRate: '8.79%', deposit: 1712552 },
      { userId: 'user02', stockName: '삼성바이오로직스', stockCode: '207940', quantity: 4, avgPrice: 61152, currentPrice: 64039, totalValue: 256156, profitLoss: 11548, profitRate: '4.72%', deposit: 1712552 },
      { userId: 'user03', stockName: '신한지주', stockCode: '55550', quantity: 7, avgPrice: 69155, currentPrice: 76199, totalValue: 533393, profitLoss: 49308, profitRate: '10.19%', deposit: 460250 },
      { userId: 'user04', stockName: '포스코홀딩스', stockCode: '5490', quantity: 66, avgPrice: 95160, currentPrice: 98424, totalValue: 6495984, profitLoss: 215424, profitRate: '3.43%', deposit: 4222369 },
      { userId: 'user04', stockName: '셀트리온', stockCode: '68270', quantity: 1, avgPrice: 54104, currentPrice: 61972, totalValue: 61972, profitLoss: 7868, profitRate: '14.54%', deposit: 4222369 },
      { userId: 'user04', stockName: '삼성바이오로직스', stockCode: '207940', quantity: 3, avgPrice: 77284, currentPrice: 86723, totalValue: 260169, profitLoss: 28317, profitRate: '12.21%', deposit: 4222369 },
      { userId: 'user05', stockName: 'HMM', stockCode: '11200', quantity: 70, avgPrice: 58765, currentPrice: 60997, totalValue: 4269790, profitLoss: 156240, profitRate: '3.80%', deposit: 5030360 },
      { userId: 'user06', stockName: 'HMM', stockCode: '11200', quantity: 84, avgPrice: 114002, currentPrice: 114620, totalValue: 9628080, profitLoss: 51912, profitRate: '0.54%', deposit: 1371179 },
      { userId: 'user06', stockName: '한화에어로스페이스', stockCode: '12450', quantity: 2, avgPrice: 67379, currentPrice: 66562, totalValue: 133124, profitLoss: -1634, profitRate: '-1.21%', deposit: 1371179 },
      { userId: 'user06', stockName: '한국전력', stockCode: '15760', quantity: 36, avgPrice: 57991, currentPrice: 60828, totalValue: 2189808, profitLoss: 102132, profitRate: '4.89%', deposit: 1371179 },
      { userId: 'user06', stockName: '한미약품', stockCode: '128940', quantity: 54, avgPrice: 66240, currentPrice: 75343, totalValue: 4068522, profitLoss: 491562, profitRate: '13.74%', deposit: 1371179 },
    ];

    // 거래내역 데이터
    const tradeHistory: TradeHistory[] = [
      { id: '1', userId: 'user01', accountNumber: '1111-1111', stockName: '한미약품', stockCode: '128940', tradeDateTime: '2022-01-08 09:56', tradeType: '매수', quantity: 10, price: 122443, description: '기관 매수세 확인 후 동참' },
      { id: '2', userId: 'user01', accountNumber: '1111-1111', stockName: 'NAVER', stockCode: '35420', tradeDateTime: '2022-01-22 12:47', tradeType: '매수', quantity: 10, price: 83694, description: '주가 조정 구간에서 2차 매수 진입' },
      { id: '3', userId: 'user01', accountNumber: '1111-1111', stockName: '현대차', stockCode: '5380', tradeDateTime: '2022-06-25 10:11', tradeType: '매수', quantity: 6, price: 113344, description: '우량주 분할 매수 전략으로 첫 진입' },
      { id: '4', userId: 'user01', accountNumber: '1111-1111', stockName: '한미약품', stockCode: '128940', tradeDateTime: '2022-11-10 13:55', tradeType: '매도', quantity: 4, price: 116060, description: '장기 보유 목적으로 리밸런싱' },
      { id: '5', userId: 'user01', accountNumber: '1111-1111', stockName: 'NAVER', stockCode: '35420', tradeDateTime: '2022-11-11 15:07', tradeType: '매수', quantity: 8, price: 89287, description: '급락에 따른 저가 매수 대응' },
    ];

    try {
      // 기존 데이터가 있는지 확인
      const existingUser = await this.getUser('user01');
      if (existingUser) {
        console.log('초기 데이터가 이미 존재함');
        return;
      }

      // 사용자 데이터 삽입
      for (const user of users) {
        await this.insertUser(user);
      }

      // 보유종목 데이터 삽입
      for (const stock of userStocks) {
        await this.insertUserStock(stock);
      }

      // 거래내역 데이터 삽입
      for (const trade of tradeHistory) {
        await this.insertTradeHistory(trade);
      }

      console.log('초기 데이터 삽입 완료');
    } catch (error) {
      console.error('초기 데이터 삽입 오류:', error);
    }
  }

  private async insertUser(user: User): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('Database not initialized');

      const transaction = this.db.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      const request = store.put(user);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async insertUserStock(stock: UserStock): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('Database not initialized');

      const transaction = this.db.transaction(['userStocks'], 'readwrite');
      const store = transaction.objectStore('userStocks');
      const request = store.put(stock);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async insertTradeHistory(trade: TradeHistory): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('Database not initialized');

      const transaction = this.db.transaction(['tradeHistory'], 'readwrite');
      const store = transaction.objectStore('tradeHistory');
      const request = store.put(trade);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUser(userId: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('Database not initialized');

      const transaction = this.db.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.get(userId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async authenticateUser(userId: string, password: string): Promise<User | null> {
    try {
      console.log('사용자 인증 시도:', userId);
      const user = await this.getUser(userId);
      
      if (user && user.password === password) {
        console.log('인증 성공:', user.name);
        return user;
      } else {
        console.log('인증 실패: 사용자를 찾을 수 없거나 비밀번호가 틀림');
        return null;
      }
    } catch (error) {
      console.error('사용자 인증 오류:', error);
      return null;
    }
  }

  async getUserStocks(userId: string): Promise<UserStock[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('Database not initialized');

      console.log('사용자 보유종목 조회:', userId);
      const transaction = this.db.transaction(['userStocks'], 'readonly');
      const store = transaction.objectStore('userStocks');
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        console.log('보유종목 조회 결과:', request.result);
        resolve(request.result || []);
      };
      request.onerror = () => {
        console.error('보유종목 조회 오류:', request.error);
        reject(request.error);
      };
    });
  }

  async getTradeHistory(userId: string): Promise<TradeHistory[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('Database not initialized');

      const transaction = this.db.transaction(['tradeHistory'], 'readonly');
      const store = transaction.objectStore('tradeHistory');
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        const result = request.result || [];
        // 날짜순으로 정렬 (최신순)
        result.sort((a, b) => new Date(b.tradeDateTime).getTime() - new Date(a.tradeDateTime).getTime());
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export default new IndexedDBService(); 