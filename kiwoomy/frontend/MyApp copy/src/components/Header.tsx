import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  leftButton?: 'info' | 'back' | 'menu';
  onLeftPress?: () => void;
  rightButton?: 'close' | 'none' | 'logout' | 'login';
  onRightPress?: () => void;
  currentUser?: { id: string; name: string } | null;
  isLoggedIn?: boolean;
}

export default function Header({ 
  leftButton = 'info', 
  onLeftPress, 
  rightButton = 'close', 
  onRightPress,
  currentUser,
  isLoggedIn = false
}: HeaderProps) {
  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={onLeftPress} style={styles.button}>
          {leftButton === 'info' ? (
            <View style={styles.infoCircle}>
              <Ionicons name="information-circle" size={24} color="#fff" />
            </View>
          ) : leftButton === 'menu' ? (
            <Ionicons name="menu" size={28} color="#fff" />
          ) : (
            <Ionicons name="arrow-back" size={24} color="#fff" />
          )}
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>마이키우Me</Text>
          {currentUser && isLoggedIn && (
            <Text style={styles.userInfo}>{currentUser.name}님</Text>
          )}
        </View>
        {rightButton === 'close' ? (
          <TouchableOpacity onPress={onRightPress} style={styles.button}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        ) : rightButton === 'logout' ? (
          <TouchableOpacity onPress={onRightPress} style={styles.button}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        ) : rightButton === 'login' ? (
          <TouchableOpacity onPress={onRightPress} style={styles.button}>
            <Ionicons name="person" size={24} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.button} />
        )}
      </View>
      <View style={styles.headerDivider} />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#5F2E90',
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    opacity: 0.5,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    color: '#E0E0E0',
    fontSize: 12,
    marginTop: 2,
  },
  button: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 