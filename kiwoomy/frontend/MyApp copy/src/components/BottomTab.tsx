import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface BottomTabProps {
  tab: string;
  setTab: (tab: string) => void;
}

export default function BottomTab({ tab, setTab }: BottomTabProps) {
  return (
    <View style={styles.bottomTab}>
      <TouchableOpacity style={styles.tabBtn} onPress={() => setTab('홈')}>
        <Ionicons name="home" size={24} color={tab === '홈' ? '#5F2E90' : '#BDBDBD'} />
        <Text style={[styles.tabLabel, tab === '홈' && { color: '#5F2E90' }]}>홈</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabBtn} onPress={() => setTab('전체보기')}>
        <MaterialIcons name="view-list" size={24} color={tab === '전체보기' ? '#5F2E90' : '#BDBDBD'} />
        <Text style={[styles.tabLabel, tab === '전체보기' && { color: '#5F2E90' }]}>전체보기</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabBtn} onPress={() => setTab('설정')}>
        <Ionicons name="settings-outline" size={24} color={tab === '설정' ? '#5F2E90' : '#BDBDBD'} />
        <Text style={[styles.tabLabel, tab === '설정' && { color: '#5F2E90' }]}>설정</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomTab: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  tabBtn: {
    alignItems: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 12,
    color: '#BDBDBD',
    marginTop: 2,
    fontWeight: 'bold',
  },
}); 