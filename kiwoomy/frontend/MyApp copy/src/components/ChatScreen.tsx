import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, SafeAreaView, Image, Alert, Modal, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChatListSideBar from './ChatListSideBar';
import { Animated } from 'react-native';
import AIContextService from '../services/AIContextService';
import { stockList } from './stockList';
import PriceChartModal from './PriceChartModal';
import { LineChart } from 'react-native-chart-kit';

// 화면 크기 계산
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const aspectRatio = 19 / 9;
let boxHeight = screenHeight;
let boxWidth = boxHeight / aspectRatio;
if (boxWidth > screenWidth) {
  boxWidth = screenWidth;
  boxHeight = boxWidth * aspectRatio;
}

// ────────────────────────────────────────────────────────────
// API HOST (에뮬레이터/실기기/웹 구분)
// ────────────────────────────────────────────────────────────

export const API_BASE = Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000";

interface ChatScreenProps {
  onBack: () => void;
  onChatHistoryUpdate?: () => void; // 채팅 히스토리 업데이트 콜백 추가
  selectedChat?: {
    id: string;
    title: string;
    timestamp: string;
    messages: Array<{
      id: number;
      text: string;
      isUser: boolean;
      timestamp: string;
      showProfile: boolean;
    }>;
  } | null;
}

interface ChatMessage {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: string;
  showProfile: boolean;
  isLoading?: boolean;
}

interface ChatHistory {
  id: string;
  title: string;
  messages: Array<ChatMessage>;
  timestamp: string;
}

// 입력창 컴포넌트 분리
function ChatInput({ value, onChangeText, onSend, onFocus, onBlur }: {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  return (
    <View style={styles.askRow}>
      <LinearGradient
        colors={["#E8F4FD", "#F0E8FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.askGradientBorder}
      >
        <View style={styles.askInnerBox}>
          <TextInput
            style={styles.askTextInput}
            value={value}
            onChangeText={onChangeText}
            placeholder="마이키우Me에게 물어보세요"
            placeholderTextColor="#B0B0B0"
            onFocus={onFocus}
            onBlur={onBlur}
            onSubmitEditing={onSend}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.planeCircle} onPress={onSend}>
            <LinearGradient
              colors={["#A7C8F2", "#5F2E90"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.planeCircleGradient}
            >
              <Ionicons name="send" size={22} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

export default function ChatScreen({ onBack, selectedChat, onChatHistoryUpdate }: ChatScreenProps) {
  const [message, setMessage] = useState('');
  // 자동완성 관련 상태
  const [autoCompleteList, setAutoCompleteList] = useState<{ name: string; code: string }[]>([]);
  const [showAutoComplete, setShowAutoComplete] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showPriceChart, setShowPriceChart] = useState(false);
  const [currentPriceCode, setCurrentPriceCode] = useState<string | null>(null);
  // 주가 차트 버튼 노출 상태 (답변 메시지 id와 종목코드 저장)
  const [chartButtonInfo, setChartButtonInfo] = useState<{ msgId: number, stockCode: string } | null>(null);
  // 주가 차트 인라인 렌더링 상태
  const [showInlineChart, setShowInlineChart] = useState<{ [msgId: number]: boolean }>({});
  const [inlineChartData, setInlineChartData] = useState<{ [msgId: number]: any }>({});
  const [inlineChartLoading, setInlineChartLoading] = useState<{ [msgId: number]: boolean }>({});
  const [inlineChartError, setInlineChartError] = useState<{ [msgId: number]: string }>({});
  // priceChartData를 종목별로 저장
  const [priceChartDataMap, setPriceChartDataMap] = useState<{ [code: string]: any[] }>({});
  
  // chatHistory 변경 감지
  useEffect(() => {
    console.log('🔍 chatHistory 상태 변경됨:', chatHistory);
    console.log('🔍 chatHistory 길이:', chatHistory.length);
  }, [chatHistory]);
  const [currentChatId, setCurrentChatId] = useState<string>(() => `chat_${Date.now()}`);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveModalMessage, setSaveModalMessage] = useState('');
  const [saveModalTitle, setSaveModalTitle] = useState('');
  const sidebarAnim = React.useRef(new Animated.Value(-300)).current;

  // 예상질문 관련 상태
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestedStock, setSuggestedStock] = useState<{ name: string; code: string } | null>(null);
  const suggestionOptions = [
    (stock: string) => `${stock} 관련 주가 추이 보여줘`,
    (stock: string) => `${stock} 공매도 현황 보여줘`,
    (stock: string) => `${stock}에 속한 테마 종목 보여줘`,
    (stock: string) => `${stock}의 투자자 기관 현황 보기`, // 추가
  ];

  // 기간 선택 상태
  const [showPeriodSelect, setShowPeriodSelect] = useState(false);
  const [selectedPriceStock, setSelectedPriceStock] = useState<{ name: string; code: string } | null>(null);
  const [pricePeriod, setPricePeriod] = useState('1개월');
  const [priceChartLoading, setPriceChartLoading] = useState(false);
  const [priceChartError, setPriceChartError] = useState('');
  const [priceChartAiAnswer, setPriceChartAiAnswer] = useState('');
  const periodOptions = ['1개월', '3개월', '6개월', '1년', '3년'];

  // 공매도 관련 상태
  const [showShortSaleSelect, setShowShortSaleSelect] = useState(false);
  const [selectedShortSaleStock, setSelectedShortSaleStock] = useState<{ name: string; code: string } | null>(null);
  const [shortSaleStartDate, setShortSaleStartDate] = useState({ year: '', month: '', day: '' });
  const [shortSaleEndDate, setShortSaleEndDate] = useState({ year: '', month: '', day: '' });
  const [shortSaleLoading, setShortSaleLoading] = useState(false);
  const [shortSaleError, setShortSaleError] = useState('');

  // 투자자 기관 날짜 선택 상태
  const [showInvestSelect, setShowInvestSelect] = useState(false);
  const [selectedInvestStock, setSelectedInvestStock] = useState<{ name: string; code: string } | null>(null);
  const [investStartDate, setInvestStartDate] = useState({ year: '', month: '', day: '' });
  const [investEndDate, setInvestEndDate] = useState({ year: '', month: '', day: '' });
  const [investLoading, setInvestLoading] = useState(false);
  const [investError, setInvestError] = useState('');

  // 스크롤 자동화를 위한 ref
  const scrollViewRef = React.useRef<ScrollView>(null);

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

  // 로컬 저장소에서 채팅 히스토리 로드
  useEffect(() => {
    loadChatHistory();
  }, []);

  // 선택된 채팅이 있으면 해당 채팅 로드
  useEffect(() => {
    if (selectedChat) {
      setCurrentChatId(selectedChat.id);
      setCurrentMessages(selectedChat.messages);
    }
  }, [selectedChat]);

  // 사이드바 애니메이션
  useEffect(() => {
    if (isSidebarOpen) {
      Animated.timing(sidebarAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(sidebarAnim, {
        toValue: -300,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  }, [isSidebarOpen]);

  // 메시지 변경 시 자동 스크롤
  useEffect(() => {
    if (scrollViewRef.current && currentMessages.length > 0) {
      // 약간의 지연을 두어 레이아웃 완료 후 스크롤
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [currentMessages]);

  // 모든 채팅 히스토리 초기화
  const clearAllChatHistory = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      console.log('🔍 모든 AsyncStorage 키:', keys);
      
      const chatKeys = keys.filter(key => key.startsWith('chatHistory_'));
      console.log('🔍 채팅 히스토리 키들:', chatKeys);
      
      // 각 채팅 키의 데이터 확인
      for (const key of chatKeys) {
        const data = await AsyncStorage.getItem(key);
        console.log(`🔍 ${key} 데이터:`, data);
      }
      
      await AsyncStorage.multiRemove(chatKeys);
      console.log('✅ 모든 채팅 히스토리 초기화됨, 삭제된 키:', chatKeys);
      
      // 삭제 후 확인
      const remainingKeys = await AsyncStorage.getAllKeys();
      const remainingChatKeys = remainingKeys.filter(key => key.startsWith('chatHistory_'));
      console.log('🔍 삭제 후 남은 채팅 키:', remainingChatKeys);
    } catch (error) {
      console.log('❌ 채팅 히스토리 초기화 오류:', error);
    }
  };

  // 채팅 히스토리 로드 (사용자별)
  const loadChatHistory = async () => {
    try {
      const aiContext = AIContextService.getCurrentContext();
      const userId = aiContext?.user?.id || 'guest';
      const chatHistoryKey = `chatHistory_${userId}`;
      
      console.log('🔍 채팅 히스토리 로드 시도:', { userId, chatHistoryKey });
      
      const savedHistory = await AsyncStorage.getItem(chatHistoryKey);
      console.log('🔍 저장된 히스토리:', savedHistory);
      
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        console.log('🔍 파싱된 히스토리:', parsed);
        console.log('🔍 setChatHistory 호출 - 파싱된 데이터로 설정');
        setChatHistory(parsed);
      } else {
        // 새 사용자이거나 히스토리가 없으면 빈 배열
        console.log('✅ 히스토리 없음, 빈 배열 설정');
        console.log('🔍 setChatHistory 호출 - 빈 배열로 설정');
        setChatHistory([]);
      }
    } catch (error) {
      console.log('❌ 채팅 히스토리 로드 실패:', error);
      console.log('🔍 setChatHistory 호출 - 오류로 인한 빈 배열 설정');
      setChatHistory([]);
    }
  };

  // AI를 활용한 채팅 제목 생성
  const generateAIChatTitle = async (messages: ChatMessage[]) => {
    try {
      // 사용자 메시지만 추출
      const userMessages = messages.filter(msg => msg.isUser).slice(0, 3);
      
      if (userMessages.length === 0) {
        return '새 채팅';
      }
      
      const conversationSummary = userMessages.map(msg => msg.text).join(' ');
      
      console.log('🤖 백엔드 서버에 제목 생성 요청 중...');
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { 
              role: 'system', 
              content: '다음 대화 내용을 보고 4-8글자의 간단한 제목을 만들어주세요. 금융, 투자 상담 내용이면 그에 맞는 제목을, 일반적인 내용이면 핵심 키워드를 담은 제목을 만들어주세요. 제목만 답변하세요.' 
            },
            { 
              role: 'user', 
              content: `대화 내용: ${conversationSummary}` 
            }
          ],
          model: 'gemma3:4b',
          stream: false
        })
      });
      
      if (response.ok) {
        console.log('🤖 백엔드 응답 성공, 데이터 파싱 중...');
        const data = await response.json();
        console.log('🤖 백엔드 응답 데이터:', data);
        let aiTitle = data.response.trim();
        
        // 제목 정리 (따옴표, 특수문자 제거)
        aiTitle = aiTitle.replace(/['"]/g, '').replace(/[^\w\s가-힣]/g, '').trim();
        
        // 길이 제한
        if (aiTitle.length > 12) {
          aiTitle = aiTitle.substring(0, 12);
        }
        
        if (aiTitle.length > 0) {
          console.log('🤖 AI 생성 제목:', aiTitle);
          return aiTitle;
        }
      } else {
        console.log('🤖 백엔드 응답 실패:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('🤖 AI 제목 생성 네트워크 오류:', error);
    }
    
    // AI 생성 실패 시 기본 로직 사용
    return generateSimpleTitle(messages);
  };

  // 간단한 규칙 기반 제목 생성
  const generateSimpleTitle = (messages: ChatMessage[]) => {
    try {
      const userMessages = messages.filter(msg => msg.isUser).slice(0, 3);
      
      if (userMessages.length === 0) {
        return '새 채팅';
      }
      
      const firstUserMessage = userMessages[0].text;
      let title = firstUserMessage;
      
      // 길이 제한
      if (title.length > 12) {
        title = title.substring(0, 12) + '...';
      }
      
      // 특정 패턴에 따른 제목 최적화
      if (title.includes('추천') || title.includes('종목')) {
        return '종목 추천 상담';
      } else if (title.includes('포트폴리오') || title.includes('자산')) {
        return '포트폴리오 분석';
      } else if (title.includes('시장') || title.includes('경제')) {
        return '시장 분석';
      } else if (title.includes('투자') || title.includes('매수') || title.includes('매도')) {
        return '투자 전략';
      } else if (title.includes('안녕') || title.includes('처음') || title.includes('시작')) {
        return '첫 상담';
      } else if (title.includes('주식')) {
        return '주식 상담';
      } else if (title.includes('코인') || title.includes('비트코인')) {
        return '암호화폐 상담';
      }
      
      return title;
    } catch (error) {
      console.log('간단 제목 생성 오류:', error);
      return '새 채팅';
    }
  };

  // 채팅 저장 (사용자별)
  const saveChat = async () => {
    try {
      console.log('💾 채팅 저장 시작...');
      console.log('💾 현재 메시지들:', currentMessages);
      console.log('💾 현재 채팅 ID:', currentChatId);
      
      const aiContext = AIContextService.getCurrentContext();
      const userId = aiContext?.user?.id || 'guest';
      const chatHistoryKey = `chatHistory_${userId}`;
      
      console.log('💾 사용자 ID:', userId);
      console.log('💾 저장 키:', chatHistoryKey);
      
      // 내용 기반 제목 생성 (임시로 기본 제목만 사용)
      console.log('💾 제목 생성 중... (기본 제목 사용)');
      const chatTitle = generateSimpleTitle(currentMessages);
      console.log('💾 기본 생성된 제목:', chatTitle);
      const chatToSave: ChatHistory = {
        id: currentChatId,
        title: chatTitle,
        messages: currentMessages,
        timestamp: new Date().toISOString()
      };
      
      console.log('💾 저장할 채팅 객체:', chatToSave);
      console.log('💾 기존 채팅 히스토리:', chatHistory);

      const updatedHistory = chatHistory.filter(chat => chat.id !== currentChatId);
      updatedHistory.unshift(chatToSave);
      
      console.log('💾 업데이트된 히스토리:', updatedHistory);
      console.log('💾 AsyncStorage에 저장 중...');
      
      await AsyncStorage.setItem(chatHistoryKey, JSON.stringify(updatedHistory));
      console.log('💾 AsyncStorage 저장 완료');
      
      console.log('🔍 setChatHistory 호출 - 채팅 저장 후 업데이트:', updatedHistory);
      setChatHistory(updatedHistory);
      
      // 저장 후 새로운 채팅 ID 생성 (저장된 채팅과 현재 채팅 구분)
      const newChatId = `chat_${Date.now()}`;
      setCurrentChatId(newChatId);
      console.log('💾 새로운 채팅 ID 생성:', newChatId);
      
      // MainHome에 채팅 히스토리 업데이트 알림
      if (onChatHistoryUpdate) {
        console.log('🔄 MainHome 채팅 히스토리 업데이트 요청');
        onChatHistoryUpdate();
      }
      
      // 성공 모달 표시
      console.log('💾 성공 모달 표시 중...');
      setSaveModalTitle('💬 채팅 저장 완료');
      setSaveModalMessage(`AI가 분석한 대화 내용을 바탕으로 제목을 생성했습니다.\n\n📝 제목: ${chatTitle}\n⏰ 저장 시간: ${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`);
      setShowSaveModal(true);
      console.log('💾 채팅 저장 프로세스 완료!');
    } catch (error) {
      console.error('❌ 채팅 저장 실패:', error);
      // 실패 모달 표시
      setSaveModalTitle('❌ 저장 실패');
      setSaveModalMessage(`채팅 저장에 실패했습니다.\n오류: ${error instanceof Error ? error.message : String(error)}\n다시 시도해주세요.`);
      setShowSaveModal(true);
    }
  };

  // 채팅 선택
  const selectChat = (chat: ChatHistory) => {
    setCurrentChatId(chat.id);
    setCurrentMessages(chat.messages);
    setIsSidebarOpen(false);
  };

  // 채팅 목록에서 채팅 선택
  const handleChatSelect = (index: number) => {
    if (chatHistory[index]) {
      selectChat(chatHistory[index]);
    }
  };

  // 새 채팅 시작
  const startNewChat = () => {
    const newChatId = Date.now().toString();
    setCurrentChatId(newChatId);
    
    // AI 컨텍스트에서 사용자 정보 가져와서 개인화된 인사말 생성
    const aiContext = AIContextService.getCurrentContext();
    let greetingMessage = '안녕하세요! 마이키우Me입니다. 무엇을 도와드릴까요?';
    
    if (aiContext && aiContext.user) {
      greetingMessage = `${aiContext.user.name}님 반갑습니다! 저는 마이키우Me입니다. 무엇을 도와드릴까요?`;
    }
    
    setCurrentMessages([
      { 
        id: 1, 
        text: greetingMessage, 
        isUser: false, 
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        showProfile: true 
      },
    ]);
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    const initializeChat = async () => {
      const updateDateTime = () => {
        const now = new Date();
        const dateString = now.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        setCurrentDateTime(dateString);
      };
      
      updateDateTime();
      
      // AI 컨텍스트에서 사용자 정보 가져오기
      const aiContext = AIContextService.getCurrentContext();
      let greetingMessage = '안녕하세요! 마이키우Me입니다. 무엇을 도와드릴까요?';
      
      if (aiContext && aiContext.user) {
        greetingMessage = `${aiContext.user.name}님 반갑습니다! 저는 마이키우Me입니다. 무엇을 도와드릴까요?`;
      }
      
      // 초기 인사말 메시지 설정
      const initialMessage = {
        id: 1,
        text: greetingMessage,
        isUser: false,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        showProfile: true
      };
      
      setCurrentMessages([initialMessage]);
      
      // 처음 접속 시 모든 채팅 히스토리 초기화 (개발용)
      await clearAllChatHistory();
      
      // 사용자별 채팅 히스토리 로드
      await loadChatHistory();
      
      // 현재 사용자 ID 설정
      const currentAiContext = AIContextService.getCurrentContext();
      setCurrentUserId(currentAiContext?.user?.id || null);
    };
    
    initializeChat();
    const interval = setInterval(() => {
      const now = new Date();
      const dateString = now.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      setCurrentDateTime(dateString);
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);



  // Ollama API와 통신하는 함수
  const chatWithGemma = async (userMessage: string) => {
    try {
      // 먼저 주식 데이터 기반 채팅 시도
      const stockResponse = await fetch(`${API_BASE}/stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage
        })
      });
      
      if (stockResponse.ok) {
        const stockData = await stockResponse.json();
        // 주식 데이터가 있으면 해당 응답 반환
        if (stockData.response && !stockData.response.includes('어떤 종목에 대한 이야기인지 잘 모르겠어요')) {
          return stockData.response;
        }
      }
      
      // 주식 데이터가 없으면 일반 채팅으로 처리
      // AI 컨텍스트 가져오기
      const aiContext = AIContextService.getCurrentContext();
      let messages = [];
      
      if (aiContext && aiContext.contextPrompt) {
        // 개인화된 시스템 프롬프트 추가
        messages = [
          { role: 'system', content: aiContext.contextPrompt },
          { role: 'user', content: userMessage }
        ];
      } else {
        // 기본 메시지
        messages = [
          { role: 'system', content: '당신은 친근하고 전문적인 금융 AI 상담사 마이키우Me입니다. 사용자의 질문에 정확하고 도움이 되는 답변을 제공해주세요.' },
          { role: 'user', content: userMessage }
        ];
      }
      
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          model: 'gemma3:4b',
          stream: false
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('API 오류:', error);
      return '죄송합니다. 현재 서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.';
    }
  };

  const sendMessage = async () => {
    if (message.trim()) {
      const userMessage = message.trim();
      
      // 종목명인지 확인
      const matchedStock = stockList.find(stock => stock.name === userMessage);
      
      const newMessage = {
        id: currentMessages.length + 1,
        text: userMessage,
        isUser: true,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        showProfile: false
      };
      
      setCurrentMessages(prev => [...prev, newMessage]);
      setMessage('');
      
      // 종목명인 경우 질문 옵션 표시
      if (matchedStock) {
        const aiMessage = {
          id: currentMessages.length + 2,
          text: `${matchedStock.name}에 대해 궁금하신 정보를 선택해주세요!`,
          isUser: false,
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          showProfile: false
        };
        setCurrentMessages(prev => [...prev, aiMessage]);
        setShowSuggestions(true);
        setSuggestedStock(matchedStock);
        return; // 종목명인 경우 AI 응답을 기다리지 않고 종료
      }
      
      // 일반 메시지인 경우 기존 로직 실행
      const loadingMessage = {
        id: currentMessages.length + 2,
        text: '',
        isUser: false,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        showProfile: false,
        isLoading: true
      };
      
      setCurrentMessages(prev => [...prev, loadingMessage]);
      
      try {
        // Ollama API 호출
        const aiResponse = await chatWithGemma(userMessage);
        
        // 로딩 메시지를 실제 응답으로 교체
        setCurrentMessages(prev => 
          prev.map(msg => 
            msg.id === loadingMessage.id 
              ? {
                  ...msg,
                  text: aiResponse,
                  timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                  isLoading: false
                }
              : msg
          )
        );
      } catch (error) {
        // 오류 발생 시 로딩 메시지를 오류 메시지로 교체
        setCurrentMessages(prev => 
          prev.map(msg => 
            msg.id === loadingMessage.id 
              ? {
                  ...msg,
                  text: '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.',
                  timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                  isLoading: false
                }
              : msg
          )
        );
      }
    }
  };

  // 자동완성 필터링 함수
  const handleInputChange = (text: string) => {
    setMessage(text);
    if (text.length > 0) {
      const filtered = stockList.filter(
        (item) => item.name.startsWith(text) || item.code.startsWith(text)
      ).slice(0, 10); // 최대 10개만 표시
      setAutoCompleteList(filtered);
      setShowAutoComplete(filtered.length > 0);
    } else {
      setShowAutoComplete(false);
    }
  };

  // 종목 자동완성 선택 시
  const handleAutoCompleteSelect = (item: { name: string; code: string }) => {
    // 1. 내가 종목명을 보낸 것처럼 추가
    const userMessage = {
      id: currentMessages.length + 1,
      text: item.name,
      isUser: true,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      showProfile: false
    };
    setCurrentMessages(prev => [...prev, userMessage]);
    setMessage('');
    setShowAutoComplete(false);
    // 2. 안내 메시지 추가
    const aiMessage = {
      id: currentMessages.length + 2,
      text: `${item.name}에 대해 궁금하신 정보를 선택해주세요!`,
      isUser: false,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      showProfile: false
    };
    setCurrentMessages(prev => [...prev, aiMessage]);
    setShowSuggestions(true);
    setSuggestedStock(item);
  };

  // 예상질문 버튼 클릭 시
  const handleSuggestionPress = async (question: string) => {
    if (!suggestedStock) return;
    if (question.includes('주가 추이')) {
      setShowSuggestions(false);
      setShowPeriodSelect(true);
      setSelectedPriceStock(suggestedStock);
      // 답변이 추가된 후에 버튼 노출을 위해 setTimeout 사용
      setTimeout(() => {
        // 답변 메시지의 id는 currentMessages.length + 1이 될 것임
        setChartButtonInfo({ msgId: currentMessages.length + 1, stockCode: suggestedStock.code });
      }, 500);
      return;
    }
    if (question.includes('공매도 현황')) {
      setShowSuggestions(false);
      setShowShortSaleSelect(true);
      setSelectedShortSaleStock(suggestedStock);
      return;
    }
    // 투자자 기관 현황 분기: 날짜 입력 UI 띄우기
    if (question.includes('투자자 기관 현황')) {
      setShowSuggestions(false);
      setShowInvestSelect(true);
      setSelectedInvestStock(suggestedStock);
      setInvestStartDate({ year: '', month: '', day: '' });
      setInvestEndDate({ year: '', month: '', day: '' });
      setInvestError('');
      return;
    }
    // 테마 정보 분기: 바로 조회
    if (question.includes('테마 종목')) {
      setShowSuggestions(false);
      await handleThemeSelect(suggestedStock.name, suggestedStock.code);
      return;
    }
    // 내가 보낸 메시지로 추가
    const userMessage = {
      id: currentMessages.length + 1,
      text: question,
      isUser: true,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      showProfile: false
    };
    setCurrentMessages(prev => [...prev, userMessage]);
    setShowSuggestions(false);
    setMessage('');
    // 로딩 메시지 추가
    const loadingMessage = {
      id: currentMessages.length + 2,
      text: '',
      isUser: false,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      showProfile: false,
      isLoading: true
    };
    setCurrentMessages(prev => [...prev, loadingMessage]);
    try {
      const aiResponse = await chatWithGemma(question);
      setCurrentMessages(prev =>
        prev.map(msg =>
          msg.id === loadingMessage.id
            ? {
                ...msg,
                text: String(aiResponse),
                timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                isLoading: false
              }
            : msg
        )
      );
    } catch (error) {
      setCurrentMessages(prev =>
        prev.map(msg =>
          msg.id === loadingMessage.id
            ? {
                ...msg,
                text: String('죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.'),
                timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                isLoading: false
              }
            : msg
        )
      );
    }
  };

  // 기간 버튼 클릭 시 주가 데이터 요청 및 AI 요약 설명만 챗봇 메시지로 추가
  const handlePeriodSelect = async (period: string) => {
    if (!selectedPriceStock) return;
  
    try {
      const code = selectedPriceStock.code;
      const res = await fetch(`${API_BASE}/price/${code}?period=${period}`);
      if (!res.ok) throw new Error("주가 데이터 요청 실패");
  
      const { summary } = await res.json();
  
      // 차트 비활성화니까 data는 필요 없고 summary만 챗봇 메시지로 추가
      setCurrentMessages(prev => [
        ...prev,
        {
          id: prev.length + 1,
          text: String(summary || "(요약 실패)"),
          isUser: false,
          timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
          showProfile: true,
        },
      ]);
    } catch (e: any) {
      setCurrentMessages(prev => [
        ...prev,
        {
          id: prev.length + 1,
          text: String(e.message),
          isUser: false,
          timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
          showProfile: true,
        },
      ]);
    }
  };

  // 공매도 날짜 선택 함수
  const handleShortSaleDateSelect = async () => {
    if (!selectedShortSaleStock) return;
    
    // 날짜 유효성 검사
    const startYear = parseInt(shortSaleStartDate.year);
    const startMonth = parseInt(shortSaleStartDate.month);
    const startDay = parseInt(shortSaleStartDate.day);
    const endYear = parseInt(shortSaleEndDate.year);
    const endMonth = parseInt(shortSaleEndDate.month);
    const endDay = parseInt(shortSaleEndDate.day);
    
    if (!startYear || !startMonth || !startDay || !endYear || !endMonth || !endDay) {
      setShortSaleError('날짜를 모두 입력해주세요.');
      return;
    }
    
    if (startMonth < 1 || startMonth > 12 || endMonth < 1 || endMonth > 12) {
      setShortSaleError('월은 1-12 사이의 숫자여야 합니다.');
      return;
    }
    
    if (startDay < 1 || startDay > 31 || endDay < 1 || endDay > 31) {
      setShortSaleError('일은 1-31 사이의 숫자여야 합니다.');
      return;
    }
    
    setShortSaleLoading(true);
    setShortSaleError('');
    
    try {
      const code = selectedShortSaleStock.code;
      const startDate = `${startYear.toString().padStart(4, '0')}-${startMonth.toString().padStart(2, '0')}-${startDay.toString().padStart(2, '0')}`;
      const endDate = `${endYear.toString().padStart(4, '0')}-${endMonth.toString().padStart(2, '0')}-${endDay.toString().padStart(2, '0')}`;
      
      const res = await fetch(`${API_BASE}/short/${code}?start_date=${startDate}&end_date=${endDate}`);
      
      if (!res.ok) {
        if (res.status === 503) {
          throw new Error("죄송합니다. 현재 서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.");
        }
        throw new Error("공매도 데이터 요청 실패");
      }
      
      const { summary } = await res.json();
      
      // 공매도 요약을 챗봇 메시지로 추가
      setCurrentMessages(prev => [
        ...prev,
        {
          id: prev.length + 1,
          text: String(summary || "(요약 실패)"),
          isUser: false,
          timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
          showProfile: true,
        },
      ]);
      
      setShowShortSaleSelect(false);
      setShortSaleStartDate({ year: '', month: '', day: '' });
      setShortSaleEndDate({ year: '', month: '', day: '' });
      
    } catch (e: any) {
      setShortSaleError(e.message);
    } finally {
      setShortSaleLoading(false);
    }
  };

  // 투자자 기관 날짜 선택 후 데이터 요청 함수
  const handleInvestDateSelect = async () => {
    if (!selectedInvestStock) return;
    // 날짜 유효성 검사
    const startYear = parseInt(investStartDate.year);
    const startMonth = parseInt(investStartDate.month);
    const startDay = parseInt(investStartDate.day);
    const endYear = parseInt(investEndDate.year);
    const endMonth = parseInt(investEndDate.month);
    const endDay = parseInt(investEndDate.day);
    if (!startYear || !startMonth || !startDay || !endYear || !endMonth || !endDay) {
      setInvestError('날짜를 모두 입력해주세요.');
      return;
    }
    if (startMonth < 1 || startMonth > 12 || endMonth < 1 || endMonth > 12) {
      setInvestError('월은 1-12 사이의 숫자여야 합니다.');
      return;
    }
    if (startDay < 1 || startDay > 31 || endDay < 1 || endDay > 31) {
      setInvestError('일은 1-31 사이의 숫자여야 합니다.');
      return;
    }
    setInvestLoading(true);
    setInvestError('');
    try {
      const code = selectedInvestStock.code;
      const fromDate = `${startYear.toString().padStart(4, '0')}${startMonth.toString().padStart(2, '0')}${startDay.toString().padStart(2, '0')}`;
      const toDate = `${endYear.toString().padStart(4, '0')}${endMonth.toString().padStart(2, '0')}${endDay.toString().padStart(2, '0')}`;
      // 내가 보낸 메시지로 추가
      const userMessage = {
        id: currentMessages.length + 1,
        text: `${selectedInvestStock.name}의 투자자 기관 현황 보기 (${fromDate}~${toDate})`,
        isUser: true,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        showProfile: false
      };
      setCurrentMessages(prev => [...prev, userMessage]);
      // 로딩 메시지 추가
      const loadingMessage = {
        id: currentMessages.length + 2,
        text: '',
        isUser: false,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        showProfile: false,
        isLoading: true
      };
      setCurrentMessages(prev => [...prev, loadingMessage]);
      setShowInvestSelect(false);
      const res = await fetch(`${API_BASE}/invest/${code}?from_date=${fromDate}&to_date=${toDate}`);
      if (!res.ok) throw new Error('투자자 기관 현황 데이터 요청 실패');
      const responseData = await res.json();
      console.log('🔍 투자자 기관 응답 데이터:', responseData);
      const { summary, data } = responseData;
      setCurrentMessages(prev =>
        prev.map(msg =>
          msg.id === loadingMessage.id
            ? {
                ...msg,
                text: summary ? String(summary) : JSON.stringify(data),
                timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                isLoading: false
              }
            : msg
        )
      );
    } catch (error) {
      setCurrentMessages(prev =>
        prev.map(msg =>
          msg.id === currentMessages.length + 2
            ? {
                ...msg,
                text: '죄송합니다. 투자자 기관 현황 정보를 불러오는 중 오류가 발생했습니다.',
                timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                isLoading: false
              }
            : msg
        )
      );
    } finally {
      setInvestLoading(false);
    }
  };

  // 테마 조회 함수
  const handleThemeSelect = async (stockName: string, stockCode: string) => {
    // 내가 보낸 메시지로 추가
    const userMessage = {
      id: currentMessages.length + 1,
      text: `${stockName}의 테마 정보 보기`,
      isUser: true,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      showProfile: false
    };
    setCurrentMessages(prev => [...prev, userMessage]);
    
    // 로딩 메시지 추가
    const loadingMessage = {
      id: currentMessages.length + 2,
      text: '',
      isUser: false,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      showProfile: false,
      isLoading: true
    };
    setCurrentMessages(prev => [...prev, loadingMessage]);
    
    try {
      const res = await fetch(`${API_BASE}/stock-theme/${stockCode}`);
      if (!res.ok) throw new Error('테마 정보 요청 실패');
      const responseData = await res.json();
      console.log('🔍 테마 응답 데이터:', responseData);
      const { summary, theme_stocks } = responseData;
      
      setCurrentMessages(prev =>
        prev.map(msg =>
          msg.id === loadingMessage.id
            ? {
                ...msg,
                text: summary ? String(summary) : '테마 정보를 찾을 수 없습니다.',
                timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                isLoading: false
              }
            : msg
        )
      );
    } catch (error) {
      setCurrentMessages(prev =>
        prev.map(msg =>
          msg.id === currentMessages.length + 2
            ? {
                ...msg,
                text: '죄송합니다. 테마 정보를 불러오는 중 오류가 발생했습니다.',
                timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                isLoading: false
              }
            : msg
        )
      );
    }
  };

  // 주가 관련 답변 판별 함수 (무조건 true로 변경)
  const isPriceAnswer = (msg: ChatMessage) => {
    if (msg.isUser) return false;
    if (msg.text.includes('궁금하신 정보를 선택해주세요!')) return false;
    return true;
  };

  // 메시지 렌더링 함수로 분리
  const renderMessages = () => (
    currentMessages.map((chat, idx) => (
      <View key={chat.id} style={[styles.messageContainer, chat.isUser ? styles.userMessage : styles.aiMessage]}>
        {!chat.isUser && chat.showProfile && (
          <View style={styles.profileContainer}>
            <Image 
              source={require('../../assets/마이키우미 머리.png')} 
              style={styles.profileImage}
              resizeMode="cover"
            />
            <Text style={styles.profileName}>마이키우Me</Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <View style={[styles.messageBubble, chat.isUser ? styles.userBubble : styles.aiBubble, chat.isUser && { maxWidth: 280 }]}>
            {chat.isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#5F2E90" />
                <Text style={[styles.loadingText]}>
                  마이키우Me가 답변을 준비하고 있습니다...
                </Text>
              </View>
            ) : (
              <Text style={[styles.messageText, chat.isUser ? styles.userText : styles.aiText]}>
                {String(chat.text)}
              </Text>
            )}
            {/* 주가 관련 답변이면 차트 버튼 추가 */}
            {isPriceAnswer(chat) && currentMessages[idx - 1] && currentMessages[idx - 1].isUser && (
              <TouchableOpacity
                style={{ marginTop: 10, alignSelf: 'flex-start', backgroundColor: '#E8F4FD', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 16 }}
                onPress={() => {
                  // 이전 메시지에서 종목코드 추출 (간단 예시: stockList에서 매칭)
                  const userMsg = currentMessages[idx - 1].text;
                  const found = stockList.find(s => userMsg.includes(s.name) || userMsg.includes(s.code));
                  if (found) {
                    setCurrentPriceCode(found.code);
                    setShowPriceChart(true);
                  } else {
                    Alert.alert('종목 인식 실패', '종목명을 정확히 입력해주세요.');
                  }
                }}
              >
                <Text style={{ color: '#5F2E90', fontWeight: 'bold' }}>📈 주가 추이 차트 보기</Text>
              </TouchableOpacity>
            )}
            {/* 예상질문에서 주가 추이 선택 시 차트 버튼 노출 (안내 메시지에는 절대 노출 X) */}
            {chartButtonInfo && chartButtonInfo.msgId === chat.id && !chat.isUser && chat.text !== `${suggestedStock?.name}에 대해 궁금하신 정보를 선택해주세요!` && (
              <TouchableOpacity
                style={{ marginTop: 10, alignSelf: 'flex-start', backgroundColor: '#E8F4FD', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 16 }}
                onPress={async () => {
                  setInlineChartLoading(prev => ({ ...prev, [chat.id]: true }));
                  setInlineChartError(prev => ({ ...prev, [chat.id]: '' }));
                  setShowInlineChart(prev => ({ ...prev, [chat.id]: true }));
                  try {
                    const res = await fetch(`${API_BASE}/price/${chartButtonInfo.stockCode}?period=3개월`);
                    const data = await res.json();
                    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                      const labels = data.data.map((d: any) => d.date.slice(4, 8));
                      const prices = data.data.map((d: any) => d.close);
                      setInlineChartData(prev => ({ ...prev, [chat.id]: { labels, prices } }));
                    } else {
                      setInlineChartError(prev => ({ ...prev, [chat.id]: '데이터가 없습니다.' }));
                    }
                  } catch {
                    setInlineChartError(prev => ({ ...prev, [chat.id]: '데이터를 불러오지 못했습니다.' }));
                  } finally {
                    setInlineChartLoading(prev => ({ ...prev, [chat.id]: false }));
                  }
                }}
              >
                <Text style={{ color: '#5F2E90', fontWeight: 'bold' }}>📈 주가 추이 차트 보기</Text>
              </TouchableOpacity>
            )}
            {/* 인라인 차트 렌더링 */}
            {showInlineChart[chat.id] && (
              <View style={{ marginTop: 12, alignSelf: 'stretch', backgroundColor: '#fff', borderRadius: 12, padding: 8 }}>
                {inlineChartLoading[chat.id] ? (
                  <ActivityIndicator size="small" color="#5F2E90" style={{ marginVertical: 20 }} />
                ) : inlineChartError[chat.id] ? (
                  <Text style={{ color: 'red', marginVertical: 20 }}>{inlineChartError[chat.id]}</Text>
                ) : inlineChartData[chat.id] ? (
                  <LineChart
                    data={{
                      labels: inlineChartData[chat.id].labels,
                      datasets: [{ data: inlineChartData[chat.id].prices }],
                    }}
                    width={260}
                    height={180}
                    chartConfig={{
                      backgroundGradientFrom: '#fff',
                      backgroundGradientTo: '#fff',
                      color: (opacity = 1) => `rgba(95, 46, 144, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                      strokeWidth: 2,
                      propsForDots: { r: '2', strokeWidth: '1', stroke: '#5F2E90' },
                    }}
                    bezier
                    style={{ borderRadius: 12 }}
                  />
                ) : null}
              </View>
            )}
          </View>
        </View>
        {/* 안내 메시지 아래에 예상질문 리스트 항상 펼쳐진 상태로 표시 */}
        {!chat.isUser && showSuggestions && suggestedStock && chat.text === `${suggestedStock.name}에 대해 궁금하신 정보를 선택해주세요!` && (
          <View style={{ marginTop: 8, marginLeft: 8, width: 260 }}>
            <View style={{
              backgroundColor: '#fff',
              borderColor: '#A7C8F2',
              borderWidth: 1,
              borderRadius: 12,
              maxHeight: 180,
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
              zIndex: 20,
            }}>
              <ScrollView style={{ maxHeight: 180 }}>
                {suggestionOptions.map((fn, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handleSuggestionPress(fn(suggestedStock.name))}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 18,
                      borderBottomWidth: i !== suggestionOptions.length - 1 ? 1 : 0,
                      borderBottomColor: '#eee',
                    }}
                  >
                    <Text style={{ fontSize: 16, color: '#333' }}>{fn(suggestedStock.name)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
        {/* 메시지 렌더링 함수 내 예상질문 아래에 기간 선택 및 차트 표시 */}
        {!chat.isUser && showPeriodSelect && selectedPriceStock && chat.text === `${selectedPriceStock.name}에 대해 궁금하신 정보를 선택해주세요!` && (
          <View style={{ marginTop: 8, marginLeft: 8, width: 260 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
              {periodOptions.map(period => (
                <TouchableOpacity
                  key={period}
                  onPress={() => handlePeriodSelect(period)}
                  style={{
                    backgroundColor: pricePeriod === period ? '#5F2E90' : '#E8F4FD',
                    borderRadius: 16,
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    marginRight: 8,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: '#A7C8F2',
                  }}
                >
                  <Text style={{ fontSize: 15, color: pricePeriod === period ? '#fff' : '#5F2E90', fontWeight: 'bold' }}>{period}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {priceChartLoading && <Text style={{ color: '#888', marginBottom: 8 }}>차트 불러오는 중...</Text>}
            {priceChartError && <Text style={{ color: 'red', marginBottom: 8 }}>{priceChartError}</Text>}
            {/* 차트 부분 완전 제거, 안내 메시지만 남김 */}
            {priceChartDataMap[selectedPriceStock?.code] && (
              <View style={{ height: 180, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee', borderRadius: 12, marginBottom: 8 }}>
                <Text style={{ color: '#888' }}>차트는 모바일 앱에서만 지원됩니다.</Text>
              </View>
            )}
            {priceChartAiAnswer && (
              <Text style={{ color: '#333', marginTop: 8 }}>{priceChartAiAnswer}</Text>
            )}
          </View>
        )}
        {chat.isUser && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 2 }}>
            <Text style={[styles.timestamp, styles.timestampOutside, styles.userTimestamp]}>{chat.timestamp}</Text>
          </View>
        )}
      </View>
    ))
  );

  // 차트 데이터 fetch 함수
  const fetchPriceChartData = async (code: string, period: string = '3개월') => {
    setPriceChartLoading(true);
    setPriceChartError('');
    try {
      const res = await fetch(`${API_BASE}/price/${code}?period=${period}`);
      const data = await res.json();
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        setPriceChartDataMap(prev => ({ ...prev, [code]: data.data }));
      } else {
        setPriceChartError('데이터가 없습니다.');
      }
    } catch {
      setPriceChartError('데이터를 불러오지 못했습니다.');
    } finally {
      setPriceChartLoading(false);
    }
  };

  // 차트 버튼 클릭 시
  const handleShowChart = (code: string) => {
    if (!priceChartDataMap[code]) {
      fetchPriceChartData(code);
    }
    setCurrentPriceCode(code);
    setShowPriceChart(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={styles.headerButton}>
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onBack} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>마이키우Me</Text>
        <TouchableOpacity onPress={saveChat} style={styles.headerButton}>
          <Ionicons name="save-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ChatListSideBar */}
      {isSidebarOpen && (
        <ChatListSideBar
          open={isSidebarOpen}
          width={boxWidth * 0.65}
          animValue={sidebarAnim}
          onClose={() => setIsSidebarOpen(false)}
          onNewChat={startNewChat}
          onSearch={() => {}}
          onChatSelect={(idx) => {
            // 필터링된 채팅 목록에서 선택
            const savedChats = chatHistory.filter(chat => 
              chat.id !== currentChatId &&
              chat.messages && chat.messages.length > 0 &&
              chat.timestamp
            );
            
            if (savedChats[idx]) {
              setCurrentChatId(savedChats[idx].id);
              setCurrentMessages(savedChats[idx].messages);
              setIsSidebarOpen(false);
            }
          }}
          chatList={(() => {
            console.log('🔍 사이드바 열림 - 전체 chatHistory:', chatHistory);
            console.log('🔍 사이드바 열림 - 현재 chatId:', currentChatId);
            
            // 실제로 저장된 채팅만 표시 (저장 버튼을 누른 채팅들)
            const savedChats = chatHistory.filter(chat => {
              console.log('🔍 필터링 검사 중인 채팅:', chat);
              console.log('🔍 채팅 ID:', chat.id, '현재 ID:', currentChatId);
              console.log('🔍 메시지 개수:', chat.messages?.length);
              console.log('🔍 채팅 제목:', chat.title);
              
              // 저장된 채팅의 조건: 
              // 1. 현재 진행중인 채팅이 아님
              // 2. 메시지가 1개 이상 (인사말만 있는 경우 제외)
              // 3. 실제로 저장 버튼을 눌러서 AsyncStorage에 저장된 채팅
              const isNotCurrent = chat.id !== currentChatId;
              const hasMessages = chat.messages && chat.messages.length > 0;
              const isActuallySaved = chat.timestamp; // 저장된 채팅은 timestamp가 있음
              
              console.log('🔍 필터 조건:', { isNotCurrent, hasMessages, isActuallySaved });
              
              return isNotCurrent && hasMessages && isActuallySaved;
            });
            
            console.log('🔍 사이드바 열림 - 필터링된 savedChats:', savedChats);
            
            const mappedList = savedChats.map(chat => ({ 
              title: chat.title, 
              timestamp: formatTimestamp(chat.timestamp) 
            }));
            
            console.log('🔍 사이드바 열림 - ChatListSideBar에 전달할 chatList:', mappedList);
            
            return mappedList;
          })()}
        />
      )}

      {/* 날짜 표시 */}
      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>{currentDateTime}</Text>
      </View>

      {/* 유의사항 */}
      <View style={styles.noticeContainer}>
        <Text style={styles.noticeTitle}>마이키우Me 서비스 이용 유의사항</Text>
        <Text style={styles.noticeText}>마이키우Me의 답변은 생성형 AI를 활용한 답변으로 사실과 다를 수 있어요.</Text>
      </View>

      {/* 채팅 메시지 영역 */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatContainer} 
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          // 콘텐츠 크기 변경 시에도 자동 스크롤
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }}
      >
        {renderMessages()}
      </ScrollView>

      {/* 메시지 입력 영역 */}
      {showAutoComplete && (
        <View style={{
          backgroundColor: '#fff',
          borderColor: '#A7C8F2',
          borderWidth: 1,
          borderRadius: 8,
          marginHorizontal: 16,
          marginBottom: 4,
          maxHeight: 180,
          zIndex: 10,
        }}>
          <ScrollView keyboardShouldPersistTaps="handled">
            {autoCompleteList.map((item) => (
              <TouchableOpacity
                key={item.code}
                onPress={() => handleAutoCompleteSelect(item)}
                style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
              >
                <Text style={{ fontSize: 16 }}>{item.name} <Text style={{ color: '#888', fontSize: 13 }}>({item.code})</Text></Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      <ChatInput
        value={message}
        onChangeText={handleInputChange}
        onSend={sendMessage}
      />

      {/* 기간 선택 모달 */}
      <Modal
        visible={showPeriodSelect}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPeriodSelect(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>기간을 선택해주세요</Text>
            <View style={styles.periodButtonContainer}>
              {periodOptions.map((period) => (
                <TouchableOpacity
                  key={period}
                  style={styles.periodButton}
                  onPress={() => {
                    handlePeriodSelect(period);
                    setShowPeriodSelect(false);
                  }}
                >
                  <Text style={styles.periodButtonText}>{period}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowPeriodSelect(false)}
            >
              <Text style={styles.modalButtonText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 공매도 날짜 선택 모달 */}
      <Modal
        visible={showShortSaleSelect}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowShortSaleSelect(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>공매도 조회 기간을 입력해주세요</Text>
            
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateInputLabel}>시작일</Text>
              <View style={styles.dateInputRow}>
                <TextInput
                  style={styles.dateInput}
                  placeholder="년"
                  value={shortSaleStartDate.year}
                  onChangeText={(text) => setShortSaleStartDate(prev => ({ ...prev, year: text }))}
                  keyboardType="numeric"
                  maxLength={4}
                />
                <Text style={styles.dateInputSeparator}>년</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="월"
                  value={shortSaleStartDate.month}
                  onChangeText={(text) => setShortSaleStartDate(prev => ({ ...prev, month: text }))}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={styles.dateInputSeparator}>월</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="일"
                  value={shortSaleStartDate.day}
                  onChangeText={(text) => setShortSaleStartDate(prev => ({ ...prev, day: text }))}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={styles.dateInputSeparator}>일</Text>
              </View>
            </View>

            <View style={styles.dateInputContainer}>
              <Text style={styles.dateInputLabel}>종료일</Text>
              <View style={styles.dateInputRow}>
                <TextInput
                  style={styles.dateInput}
                  placeholder="년"
                  value={shortSaleEndDate.year}
                  onChangeText={(text) => setShortSaleEndDate(prev => ({ ...prev, year: text }))}
                  keyboardType="numeric"
                  maxLength={4}
                />
                <Text style={styles.dateInputSeparator}>년</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="월"
                  value={shortSaleEndDate.month}
                  onChangeText={(text) => setShortSaleEndDate(prev => ({ ...prev, month: text }))}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={styles.dateInputSeparator}>월</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="일"
                  value={shortSaleEndDate.day}
                  onChangeText={(text) => setShortSaleEndDate(prev => ({ ...prev, day: text }))}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={styles.dateInputSeparator}>일</Text>
              </View>
            </View>

            {shortSaleError ? (
              <Text style={styles.errorText}>{shortSaleError}</Text>
            ) : null}

            <View style={styles.modalButtonRow}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowShortSaleSelect(false);
                  setShortSaleError('');
                  setShortSaleStartDate({ year: '', month: '', day: '' });
                  setShortSaleEndDate({ year: '', month: '', day: '' });
                }}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, shortSaleLoading && styles.disabledButton]}
                onPress={handleShortSaleDateSelect}
                disabled={shortSaleLoading}
              >
                {shortSaleLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>조회</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 투자자 기관 날짜 선택 모달 */}
      {showInvestSelect && selectedInvestStock && (
        <Modal
          visible={showInvestSelect}
          transparent
          animationType="fade"
          onRequestClose={() => setShowInvestSelect(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>{selectedInvestStock.name}의 투자자 기관 현황 기간 선택</Text>
              <Text style={{ marginBottom: 4 }}>시작 날짜 (YYYY-MM-DD)</Text>
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <TextInput
                  style={[styles.askTextInput, { width: 60, marginRight: 4 }]}
                  placeholder="YYYY"
                  keyboardType="numeric"
                  value={investStartDate.year}
                  onChangeText={text => setInvestStartDate(prev => ({ ...prev, year: text }))}
                  maxLength={4}
                />
                <TextInput
                  style={[styles.askTextInput, { width: 40, marginRight: 4 }]}
                  placeholder="MM"
                  keyboardType="numeric"
                  value={investStartDate.month}
                  onChangeText={text => setInvestStartDate(prev => ({ ...prev, month: text }))}
                  maxLength={2}
                />
                <TextInput
                  style={[styles.askTextInput, { width: 40 }]}
                  placeholder="DD"
                  keyboardType="numeric"
                  value={investStartDate.day}
                  onChangeText={text => setInvestStartDate(prev => ({ ...prev, day: text }))}
                  maxLength={2}
                />
              </View>
              <Text style={{ marginBottom: 4 }}>끝 날짜 (YYYY-MM-DD)</Text>
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <TextInput
                  style={[styles.askTextInput, { width: 60, marginRight: 4 }]}
                  placeholder="YYYY"
                  keyboardType="numeric"
                  value={investEndDate.year}
                  onChangeText={text => setInvestEndDate(prev => ({ ...prev, year: text }))}
                  maxLength={4}
                />
                <TextInput
                  style={[styles.askTextInput, { width: 40, marginRight: 4 }]}
                  placeholder="MM"
                  keyboardType="numeric"
                  value={investEndDate.month}
                  onChangeText={text => setInvestEndDate(prev => ({ ...prev, month: text }))}
                  maxLength={2}
                />
                <TextInput
                  style={[styles.askTextInput, { width: 40 }]}
                  placeholder="DD"
                  keyboardType="numeric"
                  value={investEndDate.day}
                  onChangeText={text => setInvestEndDate(prev => ({ ...prev, day: text }))}
                  maxLength={2}
                />
              </View>
              {investError ? <Text style={{ color: 'red', marginBottom: 8 }}>{investError}</Text> : null}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity
                  onPress={() => setShowInvestSelect(false)}
                  style={{ marginRight: 16 }}
                  disabled={investLoading}
                >
                  <Text style={{ color: '#888', fontSize: 16 }}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleInvestDateSelect}
                  style={{ backgroundColor: '#5F2E90', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18 }}
                  disabled={investLoading}
                >
                  <Text style={{ color: '#fff', fontSize: 16 }}>{investLoading ? '불러오는 중...' : '확인'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* 저장 완료 모달 */}
      <Modal
        visible={showSaveModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Image 
                source={require('../../assets/키우미아이콘.png')} 
                style={styles.modalIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.modalTitle}>{saveModalTitle}</Text>
            <Text style={styles.modalMessage}>{saveModalMessage}</Text>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowSaveModal(false)}
            >
              <Text style={styles.modalButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PriceChartModal */}
      {showPriceChart && currentPriceCode && (
        <PriceChartModal
          code={currentPriceCode}
          visible={showPriceChart}
          onClose={() => setShowPriceChart(false)}
          priceData={currentPriceCode ? priceChartDataMap[currentPriceCode] : undefined}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#5F2E90',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dateContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    backgroundColor: '#A8B7D8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    textAlign: 'center',
  },
  noticeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  noticeTitle: {
    fontSize: 14,
    color: '#444',
    marginBottom: 5,
    textAlign: 'center',
  },
  noticeText: {
    fontSize: 11,
    color: '#444',
    textAlign: 'center',
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  messageContainer: {
    marginBottom: 15,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#7E4AD5',
    borderBottomRightRadius: 5,
  },
  aiBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: '#999',
    textAlign: 'left',
  },
  askRow: {
    marginTop: -20,
    marginBottom: 0,
    alignItems: 'center',
    width: '100%',
    paddingTop: 0,
    paddingBottom: 0,
  },
  askGradientBorder: {
    width: '100%',
    borderRadius: 999,
    padding: 4,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  askInnerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    width: '100%',
    justifyContent: 'flex-start',
    position: 'relative',
    paddingRight: 46,
    overflow: 'hidden',
  },
  askTextInput: {
    color: '#5F2E90',
    fontWeight: 'normal',
    fontSize: 15,
    textAlign: 'left',
    flex: 1,
    textAlignVertical: 'center',
    paddingVertical: 0,
  },
  planeCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 4,
    top: '50%',
    marginTop: -19,
    marginLeft: 0,
    flexShrink: 0,
  },
  planeCircleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    minWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5F2E90',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#5F2E90',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIcon: {
    width: 60,
    height: 60,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timestampOutside: {
    marginLeft: 0,
    marginRight: 8,
    marginTop: 2,
    fontSize: 12,
    alignSelf: 'flex-end',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  // 기간 선택 모달 스타일
  periodButtonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  periodButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    minWidth: '45%',
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 16,
    color: '#5F2E90',
    fontWeight: '600',
  },
  // 공매도 날짜 입력 스타일
  dateInputContainer: {
    marginBottom: 16,
  },
  dateInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    textAlign: 'center',
    minWidth: 60,
    marginRight: 4,
  },
  dateInputSeparator: {
    fontSize: 16,
    color: '#333',
    marginHorizontal: 4,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    backgroundColor: '#999',
    flex: 1,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },

}); 