import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import SearchInput from './SearchInput';

// 캐릭터 부분만 렌더링하는 컴포넌트 (스크롤됨)
export function IntroCardCharacter() {
  return (
    <View style={styles.cardBg}>
      <LinearGradient
        colors={["#5F2E90", "#A7C8F2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.cardCharacter}
      >
        <View style={styles.row}>
          <View style={styles.imageContainer}>
            <Image source={require('../../assets/키우미 배경없음.png')} style={styles.kiwoomiImg} resizeMode="contain" />
          </View>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            {/* 오른쪽으로 살짝 이동 */}
            <View style={{ paddingLeft: 40 }}>
              <View style={styles.levelRow}>
                <View style={styles.levelPill}>
                  <Ionicons name="medal-outline" size={16} color="#FFD700" />
                  <Text style={styles.levelText}>Lv.04</Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>
                나만의 비서{"\n"}마이키우Me
              </Text>
              <Text style={styles.cardDesc}>#마이데이터 #시장이슈</Text>
            </View>
          </View>
        </View>
        {/* Beta 말풍선 */}
        <View style={styles.betaBubble}>
          <LinearGradient
            colors={["#8B5CF6", "#A855F7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 2, y: 2 }}
            style={styles.betaGradient}
          >
            <Text style={styles.betaText}>Beta</Text>
            <View style={styles.betaTail} />
          </LinearGradient>
        </View>
      </LinearGradient>
    </View>
  );
}

// 검색창 부분만 렌더링하는 컴포넌트 (sticky header)
export function IntroCardSearch({ onSearchPress }: { onSearchPress?: () => void }) {
  return (
    <View style={styles.searchCardBg}>
      <LinearGradient
        colors={["#A7C8F2", "#A7C8F2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.searchCard}
      >
        {/* 검색창 */}
        <SearchInput onPress={onSearchPress} />
        {/* 설명 텍스트도 그라데이션 영역 안에 포함 */}
        <View style={styles.cardNoticeGradient}>
          {/* 대각선 그라데이션 배경 효과 */}
          <LinearGradient
            colors={["rgba(255,255,255,0.15)", "rgba(255,255,255,0.08)", "transparent"]}
            start={{ x: 1, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={styles.diagonalGradient}
          />
          <Text style={styles.notice}>마이키우Me의 답변은 생성형 AI를 활용한 답변으로 사실과 다를 수 있어요.</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

// 전체 IntroCard (기존 호환성을 위해 유지)
export default function IntroCard() {
  return (
    <View style={styles.cardBg}>
      <LinearGradient
        colors={["#5F2E90", "#A7C8F2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.card}
      >
        <View style={styles.row}>
          <View style={styles.imageContainer}>
            <Image source={require('../../assets/키우미 배경없음.png')} style={styles.kiwoomiImg} resizeMode="contain" />
          </View>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            {/* 오른쪽으로 살짝 이동 */}
            <View style={{ paddingLeft: 40 }}>
              <View style={styles.levelRow}>
                <View style={styles.levelPill}>
                  <Ionicons name="medal-outline" size={16} color="#FFD700" />
                  <Text style={styles.levelText}>Lv.00</Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>
                나만의비서{"\n"}마이키우Me
              </Text>
              <Text style={styles.cardDesc}>#경제동향 #시장이슈</Text>
            </View>
          </View>
        </View>
        {/* Beta 말풍선 */}
        <View style={styles.betaBubble}>
          <LinearGradient
            colors={["#8B5CF6", "#A855F7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 2, y: 2 }}
            style={styles.betaGradient}
          >
            <Text style={styles.betaText}>Beta</Text>
            <View style={styles.betaTail} />
          </LinearGradient>
        </View>
        {/* 검색창 */}
        <SearchInput />
        {/* 설명 텍스트도 그라데이션 영역 안에 포함 */}
        <View style={styles.cardNoticeGradient}>
          <Text style={styles.notice}>마이키우Me의 답변은 생성형 AI를 활용한 답변으로 사실과 다를 수 있어요</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  cardBg: {
    backgroundColor: '#5F2E90',
    borderTopRightRadius: 32,
    borderBottomRightRadius: 32,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    marginTop: -15,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    padding: 0,
    shadowColor: 'transparent',
  },
  card: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 32,
    marginHorizontal: 0,
    marginVertical: 0,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCharacter: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginHorizontal: 0,
    marginVertical: 0,
    padding: 15,
    paddingBottom: 0,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  searchCardBg: {
    backgroundColor: '#A7C8F2',
    borderTopRightRadius: 0,
    borderBottomRightRadius: 32,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    marginTop: 0,
    marginBottom: 16,
    marginLeft: 0,
    marginRight: 0,
    padding: 0,
    shadowColor: 'transparent',
  },
  searchCard: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 32,
    marginHorizontal: 0,
    marginVertical: 0,
    padding: 15,
    paddingTop: 0,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  diagonalGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    paddingBottom: 0,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 8,
  },
  kiwoomiImg: {
    width: 130,
    height: 150,
    marginBottom: 0,
    paddingBottom: 0,
    overflow: 'hidden',
    borderRadius: 8,
    marginLeft :16,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  levelText: {
    color: '#FFC347',
    fontSize: 13,
    marginLeft: 4,
    fontWeight: 'bold',

  },
  levelPill: {
    backgroundColor: '#4B217A',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    minHeight: 28,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 22,
    fontSize : 19
  },
  cardDesc: {
    color: '#E0E0E0',
    fontSize: 13,
    marginTop: 2,
  },
  notice: {
    color: '#FFFFFF',
    fontSize: 10,
    marginTop: -10,
  },
  cardNoticeGradient: {
    marginTop: 10,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 32,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  betaBubble: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    marginTop : 15
  },
  betaGradient: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  betaText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  betaTail: {
    position: 'absolute',
    bottom: -8,
    right: 10,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#A855F7',
  },
}); 