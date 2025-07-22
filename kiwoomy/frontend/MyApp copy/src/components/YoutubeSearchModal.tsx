import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const API_KEY = "AIzaSyBTstk1nY3PJr7DJ33HOgiVBmTF74dve_4"; //APIKEY
const CHANNELS = {
  "키움증권": "UCZW1d7B2nYqQUiTiOnkirrQ"
};

async function getUploadsPlaylistId(channelId: string) {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.items[0].contentDetails.relatedPlaylists.uploads;
}

async function getVideoIdsFromPlaylist(playlistId: string, maxVideos = 100) {
  let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=50&key=${API_KEY}`;
  let videoIds: string[] = [];
  let nextPageToken = '';
  while (true) {
    const res = await fetch(url + (nextPageToken ? `&pageToken=${nextPageToken}` : ''));
    const data = await res.json();
    const items = data.items || [];
    for (const item of items) {
      videoIds.push(item.contentDetails.videoId);
      if (videoIds.length >= maxVideos) return videoIds;
    }
    if (data.nextPageToken) {
      nextPageToken = data.nextPageToken;
    } else {
      break;
    }
  }
  return videoIds;
}

async function getVideoDetails(videoIds: string[]) {
  let allVideos: any[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${batch.join(",")}&key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    allVideos = allVideos.concat(data.items || []);
  }
  return allVideos;
}

function match(keyword: string, text: string) {
  return text.toLowerCase().includes(keyword.toLowerCase());
}

async function searchVideosByKeyword(channelId: string, keyword: string) {
  const playlistId = await getUploadsPlaylistId(channelId);
  const videoIds = await getVideoIdsFromPlaylist(playlistId, 100);
  const videos = await getVideoDetails(videoIds);
  const result = [];
  for (const v of videos) {
    const snippet = v.snippet || {};
    const title = snippet.title || '';
    const description = snippet.description || '';
    const videoId = v.id;
    const thumbnail = snippet.thumbnails?.medium?.url;
    if ((match(keyword, title) || match(keyword, description)) && videoId && thumbnail && title) {
      result.push({ videoId, title, thumbnail });
    }
  }
  return result;
}

interface YoutubeSearchModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function YoutubeSearchModal({ visible, onClose }: YoutubeSearchModalProps) {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const channelId = CHANNELS["키움증권"];
      const videos = await searchVideosByKeyword(channelId, keyword.trim());
      setResults(videos);
    } catch (e) {
      setError('검색 중 오류가 발생했습니다.');
    }
    setLoading(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>유튜브 종목 영상 검색</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#5F2E90" />
            </TouchableOpacity>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="종목/키워드 입력"
              value={keyword}
              onChangeText={setKeyword}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoFocus
            />
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading || !keyword.trim()}>
              <Ionicons name="search" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          {loading && <ActivityIndicator size="large" color="#5F2E90" style={{ marginTop: 32 }} />}
          {error && <Text style={styles.errorText}>{error}</Text>}
          {!loading && !error && results.length === 0 && keyword.trim() && (
            <Text style={styles.noResultText}>검색 결과가 없습니다.</Text>
          )}
          {/* 검색 결과를 ScrollView로 감싸고, 높이 70% 제한 */}
          {!loading && !error && results.length > 0 && (
            <ScrollView
              style={styles.resultsScroll}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={true}
            >
              {results.map((v, idx) => (
                <TouchableOpacity
                  key={v.videoId}
                  style={styles.resultItem}
                  activeOpacity={0.85}
                  onPress={() => {
                    const url = `https://www.youtube.com/watch?v=${v.videoId}`;
                    if (Platform.OS === 'web') {
                      window.open(url, '_blank');
                    } else {
                      import('react-native').then(({ Linking }) => Linking.openURL(url));
                    }
                  }}
                >
                  <Image source={{ uri: v.thumbnail }} style={styles.thumbnail} />
                  <Text style={styles.videoTitle} numberOfLines={2}>{v.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '98%',
    maxWidth: 480,
    maxHeight: '98%', // 96%에서 98%로 증가 (모달 전체 크기 확대)
    minHeight: 600, // 300에서 400으로 증가 (최소 높이 확대)
    aspectRatio: 19 / 9, // 19:9 비율 고정
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 0,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24, // was 18
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F5FF',
  },
  headerTitle: {
    fontSize: 18, // was 18
    fontWeight: 'bold',
    color: '#5F2E90',
  },
  closeBtn: {
    padding: 4 // was 4
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 22, // was 16
    paddingBottom: 12, // was 8
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#C6C9F7',
    borderRadius: 12, // was 8
    paddingHorizontal: 18, // was 12
    paddingVertical: 18, // 12에서 18로 증가 (세로 크기 확대)
    fontSize: 18, // was 15
    backgroundColor: '#F8F5FF',
    marginRight: 12, // was 8
    minHeight: 56, // 최소 높이 추가로 더 큰 검색창
  },
  searchBtn: {
    backgroundColor: '#5F2E90',
    borderRadius: 12, // was 8
    padding: 16, // 14에서 16로 증가 (검색창과 높이 맞춤)
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56, // 검색창과 동일한 최소 높이
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24, // was 18
    backgroundColor: '#F8F5FF',
    borderRadius: 14, // was 10
    padding: 14, // was 10
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4, // was 2
    elevation: 2, // was 1
  },
  thumbnail: {
    width: 110, // was 90
    height: 74, // was 60
    borderRadius: 8, // was 6
    marginRight: 16, // was 12
    backgroundColor: '#eee',
  },
  videoTitle: {
    flex: 1,
    fontSize: 18, // was 15
    color: '#333',
    fontWeight: '500',
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
    marginTop: 32, // was 24
    fontSize: 18, // was 15
  },
  noResultText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40, // was 32
    fontSize: 18, // was 15
  },
  resultsScroll: {
    maxHeight: '80%', // 70%에서 80%로 증가 (검색결과 영역 확대)
    width: '100%',
    alignSelf: 'center',
  },
}); 