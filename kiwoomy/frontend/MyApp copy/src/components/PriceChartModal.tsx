import React, { useEffect, useState } from 'react';
import { View, Text, Modal, ActivityIndicator, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { API_BASE } from './ChatScreen';

interface PriceChartModalProps {
  code: string;
  visible: boolean;
  onClose: () => void;
  priceData?: any[];
}

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: '#f8fafc',
  backgroundGradientTo: '#f8fafc',
  color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`, // 트레이딩뷰 느낌의 파란색
  labelColor: (opacity = 1) => `rgba(44, 62, 80,${opacity})`,
  strokeWidth: 2.5,
  propsForDots: {
    r: '3.5',
    strokeWidth: '2',
    stroke: '#2980b9',
    fill: '#fff',
  },
  propsForBackgroundLines: {
    stroke: '#e1e8ed',
    strokeDasharray: '',
  },
  decimalPlaces: 0,
};

export default function PriceChartModal({ code, visible, onClose, priceData }: PriceChartModalProps) {
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  const [error, setError] = useState('');
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: number; date: string } | null>(null);

  useEffect(() => {
    if (visible) {
      if (priceData && Array.isArray(priceData) && priceData.length > 0) {
        // priceData로 차트 데이터 가공
        const total = priceData.length;
        const labelCount = Math.min(8, Math.max(4, Math.floor(total / 10) + 1));
        const step = Math.floor(total / labelCount);
        const labels: string[] = priceData.map((d: any, i: number) => {
          if (i % step === 0 || i === total - 1) {
            const yyyymm = d.date.slice(0, 6);
            return yyyymm.slice(0, 4) + '-' + yyyymm.slice(4, 6);
          }
          return '';
        });
        const prices = priceData.map((d: any) => d.close);
        setChartData({ labels, prices, raw: priceData });
        setLoading(false);
        setError('');
        return;
      }
      // priceData가 없을 때만 fetch
      if (code) {
        setLoading(true);
        setError('');
        fetch(`${API_BASE}/price/${code}?period=3개월`)
          .then(res => res.json())
          .then(res => {
            if (res.data && Array.isArray(res.data) && res.data.length > 0) {
              const total = res.data.length;
              const labelCount = Math.min(8, Math.max(4, Math.floor(total / 10) + 1));
              const step = Math.floor(total / labelCount);
              const labels: string[] = res.data.map((d: any, i: number) => {
                if (i % step === 0 || i === total - 1) {
                  const yyyymm = d.date.slice(0, 6);
                  return yyyymm.slice(0, 4) + '-' + yyyymm.slice(4, 6);
                }
                return '';
              });
              const prices = res.data.map((d: any) => d.close);
              setChartData({ labels, prices, raw: res.data });
            } else {
              setError('데이터가 없습니다.');
            }
          })
          .catch(() => setError('데이터를 불러오지 못했습니다.'))
          .finally(() => setLoading(false));
      }
    }
  }, [visible, code, priceData]);

  // 툴팁 닫기(다른 곳 터치 시)
  const handleCloseTooltip = () => setTooltip(null);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, width: screenWidth * 0.92, alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#2980b9' }}>주가 추이 차트</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#2980b9" style={{ marginVertical: 40 }} />
          ) : error ? (
            <Text style={{ color: 'red', marginVertical: 40 }}>{error}</Text>
          ) : chartData ? (
            <View>
              <LineChart
                data={{
                  labels: chartData.labels,
                  datasets: [{ data: chartData.prices }],
                }}
                width={screenWidth * 0.8}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={{ borderRadius: 12, marginBottom: 8, backgroundColor: '#f8fafc' }}
                fromZero
                onDataPointClick={({ index, x, y, value }) => {
                  if (!chartData.raw) return;
                  setTooltip({
                    x,
                    y,
                    value,
                    date: chartData.raw[index]?.date || '',
                  });
                }}
              />
              {/* 툴팁 */}
              {tooltip && (
                <View
                  style={[
                    styles.tooltip,
                    {
                      left: tooltip.x - 60, // 중앙 정렬
                      top: tooltip.y + 10, // 점 아래로
                    },
                  ]}
                >
                  <Text style={styles.tooltipText}>가격: {tooltip.value.toLocaleString()}원</Text>
                  <Text style={styles.tooltipText}>날짜: {tooltip.date.slice(0, 4)}-{tooltip.date.slice(4, 6)}-{tooltip.date.slice(6, 8)}</Text>
                </View>
              )}
              {/* 차트 외부 터치 시 툴팁 닫기 */}
              {tooltip && (
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleCloseTooltip} />
              )}
            </View>
          ) : null}
          <TouchableOpacity onPress={onClose} style={{ marginTop: 18, backgroundColor: '#2980b9', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 28 }}>
            <Text style={{ color: '#fff', fontSize: 16 }}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#2980b9',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 100,
  },
  tooltipText: {
    color: '#222',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
}); 