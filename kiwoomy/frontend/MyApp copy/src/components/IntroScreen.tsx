import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image, FlatList, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface IntroScreenProps {
  onBack: () => void;
  onClose: () => void;
}

export default function IntroScreen({ onBack, onClose }: IntroScreenProps) {
  const [selectedTab, setSelectedTab] = useState<'intro' | 'how' | 'notice'>('intro');

  // 탭별 내용
  const renderTabContent = () => {
    switch (selectedTab) {
      case 'intro':
        return (
          <>
            {/* Combined Card Section */}
            <LinearGradient
              colors={['#DADFFF', '#DADFFF', '#fff']}
              style={styles.combinedCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              {/* Greeting Section */}
              <View style={styles.greetingSection}>
                <Text style={styles.greeting}>안녕하세요!{'\n'}
                고객님만의 금융 비서{'\n'}
                  <Text style={styles.highlight}>마이키우Me 입니다.</Text> 
                </Text>
              </View>

              {/* Character Section */}
              <View style={styles.characterSection}>
                {/* Floating Chat Bubbles */}
                <View style={styles.chatBubble1}>
                  <View style={styles.dots}>
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                  </View>
                </View>
                <View style={styles.chatBubble2}>
                  <View style={styles.dots}>
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                  </View>
                </View>

                {/* Character Image with Shadow */}
                <View style={styles.characterContainer}>
                  <Image 
                    source={require('../../assets/마이키우미소개.png')} 
                    style={styles.characterImage}
                    resizeMode="contain"
                  />
                  {/* Ground Shadow */}
                  <View style={styles.groundShadow} />
                </View>
              </View>
            </LinearGradient>

            {/* Service Description Box */}
            <View style={[styles.descriptionBox, { backgroundColor: '#C6C9F7' }]}> 
              <View style={styles.questionRow}>
                <Ionicons name="help-circle" size={20} color="#5F2E90" />
                <Text style={styles.questionText}>마이키우Me 서비스란?</Text>
              </View>
              <Text style={styles.serviceDescription}>
              마이키우Me는 나만을 위한 챗봇입니다.
              증권 중심의 데이터 기반으로 정보들을 통합 분석해
              복잡한 시장 흐름을 쉽고 빠르게 이해할 수 있도록 도와줍니다.
              은행, 보험, 부동산까지 확장해 ‘개인화된 금융 서비스’로 발전해 나갈 예정입니다.


              </Text>
            </View>
          </>
        );
      case 'how':
        return (
          <View style={styles.howToUseContainer}>
            <Text style={styles.howToUseSubtitle}>마이키우Me변경하기</Text>
            <Text style={styles.howToUseTitle}>마이키우Me는 언제든지{'\n'}변경할 수 있어요!</Text>
            <Text style={styles.howToUseDescription}>다른 마이키우Me로 변경하여 다양한 서비스를 이용해보세요!</Text>
            {/* 캐러셀 적용 */}
            <View style={styles.kiwoomiCardsContainer}>
              {kiwoomiCards.map((item, index) => (
                <View key={index} style={styles.kiwoomiCard}>
                  <Image source={item.img} style={styles.kiwoomiImage} resizeMode="contain" />
                  <Text style={styles.kiwoomiTitle}>{item.title}</Text>
                  <Text style={styles.kiwoomiDescription}>{item.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      case 'notice':
        return (
          <View style={styles.noticeContainer}>
            <Text style={styles.howToUseSubtitle}>유의사항 안내</Text>
            <Text style={styles.noticeTitle}>마이키우Me 서비스 {'\n'}이용시 유의사항</Text>
            <Text style={styles.noticeText}>
              • 마이키우Me의 답변은 인공지능 기반의 대화형 서비스로 어떠한 의사나 입장이 반영되지 않습니다.{'\n'}
              • 중요한 의사결정 전에는 반드시 전문가와 상담하세요.{'\n'}
              • 투자 손실에 대한 책임은 투자자 본인에게 있습니다.{'\n'}
              • 제공되는 정보는 참고용이며, 투자 판단의 근거로만 사용하시기 바랍니다.

            </Text>
            
            <Text style={styles.noticeTitle}>개인정보 보호</Text>
            <Text style={styles.noticeText}>
              • 고객님의 개인정보는 안전하게 보호됩니다.{'\n'}
              • 채팅 내용은 서비스 개선 목적으로만 사용됩니다.{'\n'}
              • 개인정보는 암호화되어 저장됩니다.{'\n'}
              • 언제든지 개인정보 삭제를 요청할 수 있습니다.
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>마이키우Me 서비스 소개</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'intro' && styles.activeTab]}
            onPress={() => setSelectedTab('intro')}
          >
            <Text style={[styles.tabText, selectedTab === 'intro' && styles.activeTabText]}>마이키우Me란?</Text>
            {selectedTab === 'intro' && <View style={styles.activeTabUnderline} />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'how' && styles.activeTab]}
            onPress={() => setSelectedTab('how')}
          >
            <Text style={[styles.tabText, selectedTab === 'how' && styles.activeTabText]}>이용방법</Text>
            {selectedTab === 'how' && <View style={styles.activeTabUnderline} />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'notice' && styles.activeTab]}
            onPress={() => setSelectedTab('notice')}
          >
            <Text style={[styles.tabText, selectedTab === 'notice' && styles.activeTabText]}>유의사항</Text>
            {selectedTab === 'notice' && <View style={styles.activeTabUnderline} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>
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
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  betaBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  betaText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginRight: 24,
  },
  activeTab: {
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#333',
    fontWeight: 'bold',
  },
  activeTabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 3,
    backgroundColor: '#5F2E90',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  combinedCard: {
    borderRadius: 16,
    marginHorizontal: 0,
    marginBottom: 20,
  },
  greetingSection: {
    paddingTop: 40,
    paddingBottom: 20,
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 36,
  },
  description: {
    fontWeight: 'bold',
    fontSize: 24,
    color: '#7E4AD5',
    lineHeight: 28,
  },
  highlight: {
    color: '#5A66F1',
    fontWeight: 'bold',
  },
  characterSection: {
    alignItems: 'center',
    paddingVertical: 40,
    position: 'relative',
  },
  chatBubble1: {
    position: 'absolute',
    top: -20,
    left: 155,
    width: 60,
    height: 40,
    backgroundColor: '#8B5CF6',
    borderWidth: 3,
    borderColor: '#B794F4',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  chatBubble2: {
    position: 'absolute',
    top: -40,
    left: 145,
    width: 40,
    height: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#E5E7EB',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
    marginHorizontal: 1,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C0C0C0',
    marginHorizontal: 4,
  },
  characterContainer: {
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  characterImage: {
    width: '100%',
    height: '100%',
  },
  groundShadow: {
    position: 'absolute',
    bottom: -15,
    left: '50%',
    marginLeft: -50,
    width: 100,
    height: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },

  descriptionBox: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 8,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#706FBA',
    marginLeft: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#7574C0',
    lineHeight: 24,
  },

  howToUseContainer: {
    paddingTop: 40,
    paddingBottom: 20,
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  howToUseSubtitle: {
    fontSize: 14,
    color: '#5F2E90',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  howToUseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'left',
    lineHeight: 32,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  howToUseDescription: {
    fontSize: 14,
    color: '#333',
    textAlign: 'left',
    lineHeight: 20,
    alignSelf: 'flex-start',
  },
  noticeContainer: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  noticeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 20,
  },
  noticeText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },

  kiwoomiCardsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 10,
    width : '75%',

  },
  kiwoomiCard: {
    width: '90%',
    backgroundColor: '#F0F2FF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  kiwoomiImage: {
    width: 100,
    height: 100,
    marginBottom: 15,
  },
  kiwoomiTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  kiwoomiDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  
}); 

// 캐러셀 카드 데이터
const kiwoomiCards = [
  {
    title: '일반키우미',
    desc: '#금융정보 #경제동향',
    img: require('../../assets/그냥키우미.png'),
  },
  {
    title: '보험키우미',
    desc: '#보험정보 #보험분석',
    img: require('../../assets/보험키우미.png'),
  },
  {
    title: '투자키우미',
    desc: '#투자정보 #포트폴리오',
    img: require('../../assets/투자키우미.png'),
  },
]; 