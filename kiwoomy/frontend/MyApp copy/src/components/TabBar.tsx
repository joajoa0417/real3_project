import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TabBarProps {
  contentTab: string;
  setContentTab: (tab: string) => void;
}

export default function TabBar({ contentTab, setContentTab }: TabBarProps) {
  const tabs = [
    { id: '홈', label: '홈' },
    { id: '전체보기', label: '전체보기' },
  ];

  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            contentTab === tab.id && styles.activeTab
          ]}
          onPress={() => setContentTab(tab.id)}
        >
          <Text style={[
            styles.tabText,
            contentTab === tab.id && styles.activeTabText
          ]}>
            {tab.label}
          </Text>
          {contentTab === tab.id && <View style={styles.underline} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  tab: {
    marginRight: 30,
    position: 'relative',
  },
  activeTab: {
    // 활성 탭 스타일
  },
  tabText: {
    fontSize: 17,
    color: '#B0B0B0',
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  activeTabText: {
    color: '#5F2E90',
    fontWeight: 'bold',
  },
  underline: {
    position: 'absolute',
    bottom: -15,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#5F2E90',
    borderRadius: 1,
  },
}); 