import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface AIAnalysisModalProps {
  visible: boolean;
  onClose: () => void;
  analysis: string | null;
  isAnalyzing: boolean;
  userName: string;
}

export default function AIAnalysisModal({ visible, onClose, analysis, isAnalyzing, userName }: AIAnalysisModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.analysisModalContainer}>
          {/* 헤더 */}
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.analysisModalHeader}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Ionicons name="sparkles" size={24} color="#fff" />
                <Text style={styles.analysisModalTitle}>AI 포트폴리오 분석</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.analysisSubtitle}>{userName}님의 투자 분석 리포트</Text>
          </LinearGradient>

          {/* 콘텐츠 */}
          <ScrollView style={styles.analysisContent} showsVerticalScrollIndicator={false}>
            {isAnalyzing ? (
              <View style={styles.loadingContainer}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.loadingGradient}
                >
                  <Ionicons name="refresh" size={32} color="#fff" style={styles.loadingIcon} />
                  <Text style={styles.loadingText}>AI가 포트폴리오를 분석하고 있습니다...</Text>
                  <Text style={styles.loadingSubtext}>잠시만 기다려주세요</Text>
                </LinearGradient>
              </View>
            ) : analysis ? (
              <View style={styles.analysisResult}>
                <View style={styles.analysisHeader}>
                  <Ionicons name="bulb" size={20} color="#667eea" />
                  <Text style={styles.analysisHeaderTitle}>분석 완료</Text>
                  <View style={styles.analysisDate}>
                    <Text style={styles.analysisDateText}>
                      {new Date().toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.analysisTextContainer}>
                  <Text style={styles.analysisText}>{analysis}</Text>
                </View>
                
                {/* 하단 액션 버튼들 */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="share-outline" size={18} color="#667eea" />
                    <Text style={styles.actionButtonText}>공유하기</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="bookmark-outline" size={18} color="#667eea" />
                    <Text style={styles.actionButtonText}>저장하기</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
                <Text style={styles.errorTitle}>분석 결과를 가져올 수 없습니다</Text>
                <Text style={styles.errorText}>네트워크 연결을 확인하고 다시 시도해주세요.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analysisModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '95%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  analysisModalHeader: {
    padding: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  analysisModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  analysisSubtitle: {
    fontSize: 14,
    color: '#E8F4FD',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  analysisContent: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    marginTop: 40,
  },
  loadingGradient: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingIcon: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#E8F4FD',
    textAlign: 'center',
  },
  analysisResult: {
    flex: 1,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  analysisHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  analysisDate: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  analysisDateText: {
    fontSize: 12,
    color: '#666',
  },
  analysisTextContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  analysisText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
    marginLeft: 6,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 