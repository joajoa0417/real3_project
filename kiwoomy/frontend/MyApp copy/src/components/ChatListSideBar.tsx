import React from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, StyleSheet, View, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface ChatListSideBarProps {
  open: boolean;
  width: number;
  animValue: Animated.Value;
  onClose: () => void;
  chatList?: Array<{title: string, timestamp: string}>;
  onNewChat?: () => void;
  onSearch?: () => void;
  onChatSelect?: (index: number) => void;
}

export default function ChatListSideBar({ open, width, animValue, onClose, chatList, onNewChat, onSearch, onChatSelect }: ChatListSideBarProps) {
  console.log('🔍 ChatListSideBar 렌더링');
  console.log('🔍 받은 chatList:', chatList);
  console.log('🔍 chatList 길이:', chatList?.length);
  console.log('🔍 chatList 타입:', typeof chatList);
  console.log('🔍 chatList가 배열인가?:', Array.isArray(chatList));
  if (chatList && chatList.length > 0) {
    console.log('🔍 첫 번째 채팅 항목:', chatList[0]);
    console.log('🔍 모든 채팅 항목들:', chatList);
  }
  
  // 강제로 빈 배열로 처리 (테스트용)
  const safeChatList = Array.isArray(chatList) ? chatList : [];
  console.log('🔍 안전한 chatList:', safeChatList);
  console.log('🔍 안전한 chatList 길이:', safeChatList.length);
  return (
    <Animated.View
      style={[
        styles.sidebar,
        {
          width,
          transform: [{ translateX: animValue }],
        },
      ]}
    >
      {/* 상단 헤더 영역 */}
      <LinearGradient
        colors={["#5F2E90", "#A7C8F2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBg}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.title}>나의 채팅목록</Text>
          <Image 
            source={require('../../assets/키우미아이콘.png')} 
            style={styles.titleIcon}
            resizeMode="contain"
            tintColor="#fff"
          />
          
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>
      
      {/* 새채팅 & 검색 메뉴 영역 */}
      <View style={styles.menuArea}>
        <TouchableOpacity style={styles.menuBtn} activeOpacity={0.8} onPress={onNewChat}>
          <View style={styles.menuBtnGradient}>
            <Ionicons name="add" size={20} color="#5A66F1" />
            <Text style={styles.menuBtnText}>새채팅</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuBtn} activeOpacity={0.8} onPress={onSearch}>
          <View style={styles.menuBtnGradient}>
            <Ionicons name="search" size={20} color="#5A66F1" />
            <Text style={styles.menuBtnText}>채팅검색</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {/* 구분선 */}
      <View style={styles.divider} />
      
      {/* 채팅 목록 영역 */}
      <ScrollView style={styles.listArea} contentContainerStyle={{ paddingVertical: 16 }}>
        <Text style={styles.sectionTitle}>최근 채팅</Text>
        {safeChatList && safeChatList.length > 0 ? (
          safeChatList.map((item, idx) => [
            <TouchableOpacity
              key={idx}
              style={styles.itemBtn}
              activeOpacity={0.85}
              onPress={() => onChatSelect && onChatSelect(idx)}
            >
              <View style={styles.itemContent}>
                <Text style={styles.itemText}>{item.title}</Text>
                <Text style={styles.itemTimestamp}>{item.timestamp}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#A7C8F2" style={{ marginLeft: 4 }} />
            </TouchableOpacity>,
            idx < safeChatList.length - 1 && <View key={`divider-${idx}`} style={styles.itemDivider} />
          ])
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color="#E1E5E9" />
            <Text style={styles.emptyText}>저장된 채팅이 없습니다</Text>
            <Text style={styles.emptySubText}>새로운 채팅을 시작해보세요!</Text>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: '#fff',
    zIndex: 100,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  headerBg: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 18,
    borderTopRightRadius: 28,
    backgroundColor: 'transparent',
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    letterSpacing: -0.5,
    marginRight: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    width: 28,
    height: 28,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  menuArea: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  menuBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10, // 줄임
    paddingHorizontal: 8, // 줄임
    backgroundColor: '#DDE0FF',
    minWidth: 70, // 최소 너비 추가
  },
  menuBtnText: {
    color: '#5A66F1',
    fontSize: 12, // 더 작게
    fontWeight: '600',
    marginLeft: 4, // 더 작게
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
    opacity: 0.6,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
    opacity: 0.4,
  },
  sectionTitle: {
    color: '#5F2E90',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  listArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  itemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6FA',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 0,
    shadowColor: '#A7C8F2',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    color: '#5F2E90',
    fontSize: 16,
    fontWeight: '600',
  },
  itemTimestamp: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 8,
    textAlign: 'center',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
    marginHorizontal: 18,
    opacity: 0.3,
  },
}); 