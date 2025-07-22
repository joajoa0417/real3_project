import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  ScrollView, 
  Animated,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ChatSearchModalProps {
  visible: boolean;
  onClose: () => void;
  chatHistory?: Array<{
    id: number;
    title: string;
    content: string;
    timestamp: string;
  }>;
}

export default function ChatSearchModal({ visible, onClose, chatHistory = [] }: ChatSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    id: number;
    title: string;
    content: string;
    timestamp: string;
    highlightedContent: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 샘플 채팅 데이터 (실제로는 props로 받아올 데이터)
  const sampleChatHistory = [
    {
      id: 1,
      title: '내 마이데이터',
      content: '마이데이터 관련 정보를 조회했습니다. 현재 포트폴리오 상태는 양호합니다.',
      timestamp: '2024-01-15 14:30'
    },
    {
      id: 2,
      title: '시장관련유튜브목록',
      content: '오늘의 주요 시장 동향과 관련된 유튜브 영상들을 정리해드렸습니다.',
      timestamp: '2024-01-15 13:45'
    },
    {
      id: 3,
      title: '오늘 국내시장 이슈요약',
      content: '코스피 지수가 상승세를 보이고 있으며, 반도체 섹터가 강세를 나타내고 있습니다.',
      timestamp: '2024-01-15 12:20'
    },
    {
      id: 4,
      title: '투자 포트폴리오 분석',
      content: '현재 보유 주식들의 수익률을 분석한 결과, 평균 수익률은 15.3%입니다.',
      timestamp: '2024-01-15 11:15'
    }
  ];

  const actualChatHistory = chatHistory.length > 0 ? chatHistory : sampleChatHistory;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // 디바운싱 검색
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
        setIsSearching(false);
      }, 300); // 300ms 디바운싱
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // 검색 및 하이라이팅
  const performSearch = (query: string) => {
    const results = actualChatHistory
      .filter(chat => 
        chat.title.toLowerCase().includes(query.toLowerCase()) ||
        chat.content.toLowerCase().includes(query.toLowerCase())
      )
      .map(chat => ({
        ...chat,
        highlightedContent: highlightText(chat.content, query)
      }));

    setSearchResults(results);
  };

  // 텍스트 하이라이팅
  const highlightText = (text: string, query: string): string => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '**$1**');
  };

  // 하이라이팅된 텍스트 렌더링
  const renderHighlightedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={index} style={styles.highlightedText}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <View style={styles.modalContainer}>
          {/* 헤더 */}
          <LinearGradient
            colors={["#5F2E90", "#A7C8F2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>채팅 검색</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* 검색 입력창 */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#5F2E90" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="검색어를 입력하세요..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 검색 결과 */}
          <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
            {isSearching && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>검색 중...</Text>
              </View>
            )}
            
            {!isSearching && searchQuery.trim() && searchResults.length === 0 && (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search-outline" size={48} color="#ccc" />
                <Text style={styles.noResultsText}>검색 결과가 없습니다</Text>
                <Text style={styles.noResultsSubtext}>다른 검색어를 시도해보세요</Text>
              </View>
            )}

            {!isSearching && searchResults.map((result) => (
              <TouchableOpacity key={result.id} style={styles.resultItem} activeOpacity={0.8}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultTitle}>{result.title}</Text>
                  <Text style={styles.resultTimestamp}>{result.timestamp}</Text>
                </View>
                <Text style={styles.resultContent}>
                  {renderHighlightedText(result.highlightedContent)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth * 0.28,
    height: screenHeight * 0.22,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  noResultsSubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
  },
  resultItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5F2E90',
    flex: 1,
  },
  resultTimestamp: {
    fontSize: 12,
    color: '#999',
  },
  resultContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  highlightedText: {
    backgroundColor: '#FFE066',
    fontWeight: 'bold',
    color: '#333',
  },
}); 