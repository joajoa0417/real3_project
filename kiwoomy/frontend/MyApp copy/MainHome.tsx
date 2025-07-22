import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, Dimensions, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './src/components/Header';
import { IntroCardCharacter, IntroCardSearch } from './src/components/IntroCard';
import ContentArea from './src/components/ContentArea';
import ChatScreen from './src/components/ChatScreen';
import IntroScreen from './src/components/IntroScreen';
import ChatListSideBar from './src/components/ChatListSideBar';
import ChatSearchModal from './src/components/ChatSearchModal';
import LoginModal from './src/components/LoginModal';
import WelcomeToast from './src/components/WelcomeToast';
import { User, UserStock, TradeHistory } from './src/services/IndexedDBService';
import IndexedDBService from './src/services/IndexedDBService';
import AIContextService from './src/services/AIContextService';
import FinancialSummaryModal from './src/components/FinancialSummaryModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 테스트~~~

// 비율 계산 
const aspectRatio = 19 / 9;
let boxHeight = screenHeight;
let boxWidth = boxHeight / aspectRatio;
if (boxWidth > screenWidth) {
  boxWidth = screenWidth;
  boxHeight = boxWidth * aspectRatio;
}

interface MainHomeProps {
  currentUser: User | null;
  userStocks: UserStock[];
  onLogout: () => void;
  onLogin?: (userId: string, password: string) => Promise<void>;
  isLoggedIn: boolean;
}

export default function MainHome({ 
  currentUser = null, 
  userStocks = [], 
  onLogout = () => {}, 
  onLogin = undefined, 
  isLoggedIn = false 
}: MainHomeProps) {
  // 디버깅 로그를 한 번만 출력
  const [hasLoggedProps, setHasLoggedProps] = useState(false);
  
  if (!hasLoggedProps) {
    console.log('MainHome 받은 props:', { currentUser, userStocks, onLogout, onLogin, isLoggedIn });
    console.log('onLogin type:', typeof onLogin);
    console.log('onLogin value:', onLogin);
    setHasLoggedProps(true);
  }
  
  // 로컬 상태로 현재 사용자 관리
  const [localCurrentUser, setLocalCurrentUser] = useState<User | null>(currentUser);
  const [localUserStocks, setLocalUserStocks] = useState<UserStock[]>(userStocks);
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);
  const [isDBInitialized, setIsDBInitialized] = useState(false);

  // props가 변경될 때 로컬 상태 업데이트
  useEffect(() => {
    if (currentUser !== localCurrentUser) {
      setLocalCurrentUser(currentUser);
    }
  }, [currentUser]);

  useEffect(() => {
    if (userStocks !== localUserStocks && userStocks.length > 0) {
      setLocalUserStocks(userStocks);
    }
  }, [userStocks]);

  // IndexedDB 초기화
  useEffect(() => {
    const initDB = async () => {
      try {
        console.log('MainHome에서 IndexedDB 초기화 시작...');
        await IndexedDBService.initDatabase();
        setIsDBInitialized(true);
        console.log('MainHome에서 IndexedDB 초기화 완료');
      } catch (error) {
        console.error('MainHome에서 IndexedDB 초기화 오류:', error);
      }
    };

    if (!isDBInitialized) {
      initDB();
    }
  }, [isDBInitialized]);
  
  const [contentTab, setContentTab] = useState('홈');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isIntroOpen, setIsIntroOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false); // 금융요약 창 상태
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 사이드바 상태 추가
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); // 로그인 모달 상태
  const [showWelcomeToast, setShowWelcomeToast] = useState(false); // 환영 토스트 상태
  const [chatHistory, setChatHistory] = useState<Array<{id: string, title: string, timestamp: string, messages: any[]}>>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const sidebarAnim = useRef(new Animated.Value(-boxWidth * 0.5)).current; // 사이드바 위치 애니메이션
  
  const contentTabs = [
    { id: '홈', label: '홈' },
    { id: '전체보기', label: '전체보기' },
  ];

  const handleSearchPress = () => {
    setIsChatOpen(true);
    // 채팅창이 열릴 때 채팅 히스토리 새로고침
    setTimeout(() => {
      loadChatHistory();
    }, 100);
  };

  const handleBackFromChat = () => {
    setSelectedChat(null); // 채팅창을 나갈 때 선택된 채팅 초기화
    setIsChatOpen(false);
    // 채팅 히스토리 새로고침
    setTimeout(() => {
      loadChatHistory();
    }, 200);
  };

  const handleInfoPress = () => {
    setIsIntroOpen(true);
  };

  const handleSidebarOpen = () => {
    setIsSidebarOpen(true);
    // 사이드바가 열릴 때 채팅 히스토리 새로고침
    setTimeout(() => {
      loadChatHistory();
    }, 100);
  };

  const handleBackFromIntro = () => {
    setIsIntroOpen(false);
  };

  const handleCloseIntro = () => {
    setIsIntroOpen(false);
  };

  const handleNewChat = () => {
    setSelectedChat(null); // 새 채팅이므로 선택된 채팅 초기화
    setIsSidebarOpen(false);
    setIsChatOpen(true);
    // 채팅 히스토리 새로고침
    setTimeout(() => {
      loadChatHistory();
    }, 100);
  };

  const handleSearch = () => {
    setIsSidebarOpen(false);
    setIsSearchOpen(true);
  };

  const handleChatSelect = (index: number) => {
    // 필터링된 채팅 목록에서 선택
    const savedChats = chatHistory.filter(chat => 
      chat.messages && chat.messages.length > 1
    );
    
    if (savedChats[index]) {
      setSelectedChat(savedChats[index]);
      setIsSidebarOpen(false);
      setIsChatOpen(true);
    }
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
  };

  const handleSummaryPress = () => {
    setIsSummaryOpen(true);
  };
  const handleBackFromSummary = () => {
    setIsSummaryOpen(false);
  };

  const handleLoginPress = () => {
    setIsLoginModalOpen(true);
  };

  const handleLoginModalClose = () => {
    setIsLoginModalOpen(false);
  };

  const handleLoginSubmit = async (userId: string, password: string) => {
    try {
      console.log('handleLoginSubmit 호출됨:', userId, password);
      
      if (onLogin && typeof onLogin === 'function') {
        console.log('App.tsx의 onLogin 함수 사용');
        await onLogin(userId, password);
        setIsLoginModalOpen(false);
        setShowWelcomeToast(true);
      } else {
        console.log('onLogin 함수가 없음, IndexedDB로 직접 처리');
        
        // IndexedDB 초기화 확인
        // IndexedDB가 초기화되지 않은 경우 먼저 초기화
        if (!isDBInitialized) {
          console.log('DB가 초기화되지 않음, 초기화 중...');
          await IndexedDBService.initDatabase();
          setIsDBInitialized(true);
        }
        
        // IndexedDB로 직접 로그인 처리
        const user = await IndexedDBService.authenticateUser(userId, password);
        console.log('직접 인증 결과:', user);
        
        if (user) {
          console.log('사용자 인증 성공, 보유종목 및 거래내역 조회 중...');
          const stocks = await IndexedDBService.getUserStocks(userId);
          const trades = await IndexedDBService.getTradeHistory(userId);
          console.log('보유종목 조회 결과:', stocks);
          console.log('거래내역 조회 결과:', trades);
          
          // AI 컨텍스트 생성
          console.log('🤖 AI 컨텍스트 생성 중...');
          const aiContext = await AIContextService.createUserContext(userId);
          if (aiContext) {
            console.log('🤖 AI가 사용자 정보를 학습했습니다:', aiContext.user.name);
            console.log('🤖 투자 성향:', aiContext.personalityProfile);
            console.log('🤖 AI 컨텍스트 프롬프트 생성됨 (길이:', aiContext.contextPrompt.length, '자)');
          }
          
          setLocalCurrentUser(user);
          setLocalUserStocks(stocks);
          setTradeHistory(trades);
          setIsLoginModalOpen(false);
          setShowWelcomeToast(true);
          console.log('직접 로그인 완료');
        } else {
          console.log('사용자 인증 실패');
          alert('로그인에 실패했습니다. 사용자 ID와 비밀번호를 확인해주세요.');
        }
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      alert('로그인 중 오류가 발생했습니다: ' + error);
    }
  };

  const handleWelcomeToastHide = () => {
    setShowWelcomeToast(false);
  };

  const handleLocalLogout = async () => {
    // AI 컨텍스트 초기화
    AIContextService.clearContext();
    console.log('🤖 AI 컨텍스트 초기화됨');
    
    // 현재 사용자의 채팅 히스토리 키로 저장된 데이터 삭제
    if (localCurrentUser) {
      try {
        const chatHistoryKey = `chatHistory_${localCurrentUser.id}`;
        await AsyncStorage.removeItem(chatHistoryKey);
        console.log('💬 채팅 히스토리 초기화됨');
      } catch (error) {
        console.log('채팅 히스토리 삭제 오류:', error);
      }
    }
    
    setLocalCurrentUser(null);
    setLocalUserStocks([]);
    setTradeHistory([]);
    if (onLogout) {
      onLogout();
    }
  };

  // 시간 포맷팅 함수
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      } else if (diffInHours < 48) {
        return '어제';
      } else {
        return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
      }
    } catch (error) {
      return timestamp;
    }
  };

  // 모든 채팅 히스토리 초기화
  const clearAllChatHistory = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const chatKeys = keys.filter(key => key.startsWith('chatHistory_'));
      await AsyncStorage.multiRemove(chatKeys);
      console.log('✅ MainHome - 모든 채팅 히스토리 초기화됨');
    } catch (error) {
      console.log('❌ MainHome - 채팅 히스토리 초기화 오류:', error);
    }
  };

  // 채팅 히스토리 로드 (사용자별)
  const loadChatHistory = async () => {
    try {
      // 사용자별 채팅 히스토리 키 생성
      const userId = localCurrentUser?.id || 'guest';
      const chatHistoryKey = `chatHistory_${userId}`;
      
      console.log('🔍 MainHome - 채팅 히스토리 로드 시도:', { userId, chatHistoryKey });
      
      const savedHistory = await AsyncStorage.getItem(chatHistoryKey);
      console.log('🔍 MainHome - 저장된 히스토리:', savedHistory);
      
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        console.log('🔍 MainHome - 파싱된 히스토리:', parsed);
        setChatHistory(parsed);
      } else {
        console.log('✅ MainHome - 히스토리 없음, 빈 배열 설정');
        setChatHistory([]);
      }
    } catch (error) {
      console.log('❌ MainHome - 채팅 히스토리 로드 실패:', error);
      setChatHistory([]);
    }
  };

  // 채팅 히스토리 새로고침
  const refreshChatHistory = () => {
    loadChatHistory();
  };

  useEffect(() => {
    loadChatHistory();
    
    // 주기적으로 채팅 히스토리 새로고침 (5초마다)
    const interval = setInterval(() => {
      loadChatHistory();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isSidebarOpen) {
      Animated.timing(sidebarAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(sidebarAnim, {
        toValue: -boxWidth * 0.5,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  }, [isSidebarOpen, boxWidth]);

  if (isIntroOpen) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.centerArea}>
          <View style={[styles.aspectBox, { width: boxWidth, height: boxHeight }]}> 
            <IntroScreen onBack={handleBackFromIntro} onClose={handleCloseIntro} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (isSummaryOpen) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.centerArea}>
          <View style={[styles.aspectBox, { width: boxWidth, height: boxHeight }]}> 
            <FinancialSummaryModal 
              visible={isSummaryOpen} 
              onClose={handleBackFromSummary}
              userStocks={userStocks}
              currentUser={currentUser}
              tradeHistory={tradeHistory}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (isChatOpen) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.centerArea}>
                  <View style={[styles.aspectBox, { width: boxWidth, height: boxHeight }]}> 
          <ChatScreen 
            onBack={handleBackFromChat} 
            selectedChat={selectedChat}
            onChatHistoryUpdate={refreshChatHistory}
          />
        </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.centerArea}>
        <View style={[styles.aspectBox, { width: boxWidth, height: boxHeight }]}> 
          <Header 
            leftButton="menu" 
            onLeftPress={handleSidebarOpen} 
            rightButton={localCurrentUser ? "logout" : "login"} 
            onRightPress={localCurrentUser ? handleLocalLogout : handleLoginPress}
            currentUser={localCurrentUser}
            isLoggedIn={!!localCurrentUser}
          />
          {isSidebarOpen && (
            <ChatListSideBar
              open={isSidebarOpen}
              width={boxWidth * 0.65}
              animValue={sidebarAnim}
              onClose={() => setIsSidebarOpen(false)}
              onNewChat={handleNewChat}
              onSearch={handleSearch}
              onChatSelect={handleChatSelect}
              chatList={(() => {
                console.log('🔍 MainHome - 전체 chatHistory:', chatHistory);
                
                // 실제로 저장된 채팅만 표시 (저장 버튼을 누른 채팅들)
                const savedChats = chatHistory.filter(chat => {
                  console.log('🔍 MainHome - 필터링 검사 중인 채팅:', chat);
                  
                  // 저장된 채팅의 조건: 
                  // 1. 메시지가 0개 이상 (저장된 채팅은 모두 표시)
                  // 2. 실제로 저장 버튼을 눌러서 AsyncStorage에 저장된 채팅
                  const hasMessages = chat.messages && chat.messages.length > 0;
                  const isActuallySaved = chat.timestamp; // 저장된 채팅은 timestamp가 있음
                  
                  console.log('🔍 MainHome - 필터 조건:', { hasMessages, isActuallySaved });
                  
                  return hasMessages && isActuallySaved;
                });
                
                console.log('🔍 MainHome - 필터링된 savedChats:', savedChats);
                
                const mappedList = savedChats.map(chat => ({ 
                  title: chat.title, 
                  timestamp: formatTimestamp(chat.timestamp) 
                }));
                
                console.log('🔍 MainHome - 사이드바 전체 chatHistory:', chatHistory);
                console.log('🔍 MainHome - 사이드바 필터링된 savedChats:', savedChats);
                console.log('🔍 MainHome - 사이드바에 전달할 chatList:', mappedList);
                
                return mappedList;
              })()}
            />
          )}
          
          
          {/* 전체 스크롤 가능한 콘텐츠 영역 */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <IntroCardCharacter />
            <IntroCardSearch onSearchPress={handleSearchPress} />
            <ContentArea 
              contentTab={contentTab} 
              setContentTab={setContentTab} 
              onIntroPress={handleInfoPress}
              onSummaryPress={handleSummaryPress}
              userStocks={localUserStocks}
              currentUser={localCurrentUser}
              tradeHistory={tradeHistory}
            />
          </ScrollView>
        </View>
      </View>
      
      {/* 로그인 모달 */}
      <LoginModal
        visible={isLoginModalOpen}
        onClose={handleLoginModalClose}
        onLogin={handleLoginSubmit}
      />

      {/* 환영 토스트 */}
      <WelcomeToast
        visible={showWelcomeToast}
        userName={localCurrentUser?.name || ''}
        onHide={handleWelcomeToastHide}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aspectBox: {
    backgroundColor: '#5F2E90',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F6F6FA',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  introCardTop: {
    backgroundColor: '#5F2E90',
  },
});
