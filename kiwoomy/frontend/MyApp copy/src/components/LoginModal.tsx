import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  onLogin: (userId: string, password: string) => void;
}

export default function LoginModal({ visible, onClose, onLogin }: LoginModalProps) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!userId.trim() || !password.trim()) {
      Alert.alert('오류', '사용자 ID와 비밀번호를 입력해주세요.');
      return;
    }
    onLogin(userId.trim(), password.trim());
  };

  const handleClose = () => {
    setUserId('');
    setPassword('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#5F2E90', '#8B5CF6']}
            style={styles.gradient}
          >
            {/* 헤더 */}
            <View style={styles.header}>
              <Text style={styles.title}>로그인</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* 로그인 폼 */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>사용자 ID</Text>
                <TextInput
                  style={styles.input}
                  value={userId}
                  onChangeText={setUserId}
                  placeholder="사용자 ID를 입력하세요"
                  placeholderTextColor="#A0A0A0"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>비밀번호</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="비밀번호를 입력하세요"
                  placeholderTextColor="#A0A0A0"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>로그인</Text>
              </TouchableOpacity>

              {/* 테스트 계정 정보 */}
              <View style={styles.testInfo}>
                <Text style={styles.testInfoTitle}>테스트 계정</Text>
                <Text style={styles.testInfoText}>user01 ~ user06 / 1234</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
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
    width: screenWidth * 0.85,
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  gradient: {
    padding: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333333',
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5F2E90',
  },
  testInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  testInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  testInfoText: {
    fontSize: 12,
    color: '#E0E0E0',
    textAlign: 'center',
  },
}); 