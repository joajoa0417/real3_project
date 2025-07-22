import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface SearchInputProps {
  onPress?: () => void;
  value?: string;
  onChangeText?: (text: string) => void;
  onSend?: () => void;
  isInput?: boolean;
  isCompact?: boolean;
  isFullWidth?: boolean;
}

export default function SearchInput({ onPress, value, onChangeText, onSend, isInput = false }: SearchInputProps) {
  const shimmerAnim = useRef(new Animated.Value(-250)).current;
  const [isFocused, setIsFocused] = useState(false);

  // 고정 높이 및 스타일
  const FIXED_HEIGHT = 38;

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isActive = true;

    const startShimmer = () => {
      if (!isActive) return;
      
      shimmerAnim.setValue(-350); 
      Animated.timing(shimmerAnim, {
        toValue: 415, 
        duration: 950,
        useNativeDriver: false,
      }).start(() => {
        if (isActive) {
          timeoutId = setTimeout(startShimmer, 450);
        }
      });
    };

    startShimmer();

    return () => {
      isActive = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <View style={styles.askRow}>
      <LinearGradient
        colors={["#A7C8F2", "#7B5FE6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.askGradientBorder}
      >
        <View style={styles.askInnerBox}>
          {isInput ? (
            <TextInput
              style={styles.fixedText}
              value={value}
              onChangeText={onChangeText}
              placeholder={isFocused ? '' : '마이키우Me에게 물어보세요'}
              placeholderTextColor="#5F2E90"
              multiline={false}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              underlineColorAndroid="transparent"
              blurOnSubmit={true}
              returnKeyType="done"
            />
          ) : (
            <TouchableOpacity 
              onPress={onPress} 
              style={{ flex: 1 }}
              activeOpacity={0.8}
            >
              <Text style={styles.fixedText}>마이키우Me에게 물어보세요</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={onSend} 
            style={styles.planeCircle}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#A7C8F2", "#7B5FE6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.planeCircleGradient}
            >
              <Ionicons name="send" size={22} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        {/* Shimmer 효과 - 입력 모드가 아닐 때만 표시 */}
        {!isInput && (
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX: shimmerAnim }],
              },
            ]}
          />
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  askRow: {
    marginTop: -20,
    marginBottom: 0,
    alignItems: 'center',
    width: '100%',
    paddingTop: 0,
    paddingBottom: 0,
  },
  askRowCompact: {
    marginTop: -10, // -20에서 -10으로 줄임
    marginBottom: 0,
    alignItems: 'center',
    width: '100%',
    paddingTop: 0,
    paddingBottom: 0,
  },
  askRowFullWidth: {
    marginTop: 0,
    marginBottom: 0,
    alignItems: 'center',
    width: '100%',
    paddingTop: 0,
    paddingBottom: 0,
  },
  askGradientBorder: {
    width: '100%',
    borderRadius: 999,
    padding: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  askGradientBorderFullWidth: {
    width: '100%',
    borderRadius: 999,
    padding: 2,
    position: 'relative',
    overflow: 'hidden',
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
    paddingRight: 46, // planeCircle 크기(38) + 여유
    overflow: 'hidden',
  },
  askInnerBoxCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 2, // 4에서 2로 더 줄임
    paddingHorizontal: 16,
    width: '100%',
    justifyContent: 'flex-start',
    position: 'relative',
    paddingRight: 46,
    overflow: 'hidden',
  },
  askInnerBoxFullWidth: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 16,
    width: '100%',
    justifyContent: 'flex-start',
    position: 'relative',
    paddingRight: 46,
    overflow: 'hidden',
  },
  askTextLeft: {
    color: '#5F2E90',
    fontWeight: 'normal',
    fontSize: 15,
    textAlign: 'left',
    flex: 1,
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
    marginTop: -19, // height/2로 수직 중앙 정렬
    marginLeft: 0,
    flexShrink: 0,
  },
  planeCircleCompact: {
    width: 28, // 32에서 28로 더 줄임
    height: 28, // 32에서 28로 더 줄임
    borderRadius: 14, // 16에서 14로 줄임
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 4,
    top: '50%',
    marginTop: -14, // height/2로 수직 중앙 정렬
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
  planeCircleGradientCompact: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40, // 더 좁은 직사각형
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-30deg' }], // 더 명확한 기울기
    zIndex: 1,
    borderRadius: 2, // 약간의 둥근 모서리
  },
  fixedText: {
    color: '#5F2E90',
    fontWeight: 'normal',
    fontSize: 15,
    textAlign: 'left',
    flex: 1,
    height: 38,
    lineHeight: 22,
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlignVertical: 'center',
    backgroundColor: 'transparent',
  },
}); 