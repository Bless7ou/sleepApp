import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList, Task } from './types';

type Route = RouteProp<RootStackParamList, 'SleepRecommend'>;

const REQUIRED_SLEEP_MINUTES = 7 * 60 + 30;

function timeToMinutes(time: string = '00:00') {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function SleepRecommendScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();

  const todayTasks = route.params.todayTasks
    .slice()
    .sort((a, b) => timeToMinutes(a.start ?? '00:00') - timeToMinutes(b.start ?? '00:00'));
  const tomorrowTasks = route.params.tomorrowTasks
    .slice()
    .sort((a, b) => timeToMinutes(a.start ?? '00:00') - timeToMinutes(b.start ?? '00:00'));

  const baseDate = new Date(route.params.baseDate);

  const todayStr = baseDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const tomorrow = new Date(baseDate);
  tomorrow.setDate(baseDate.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const [recommendation, setRecommendation] = useState('');
  const prevSlotsRef = useRef<string[]>([]);

  const calculateSleepTime = () => {
    if (tomorrowTasks.length === 0 || todayTasks.length === 0) {
      setRecommendation('내일 일정이 없습니다. 수면 시간이 자유롭습니다.');
      prevSlotsRef.current = [];
      return;
    }
  
    const nightStart = timeToMinutes(todayTasks[todayTasks.length - 1].end ?? '00:00');
    const nightEnd = timeToMinutes(tomorrowTasks[0].start ?? '00:00') - 60;
    let nightSleep = nightEnd - nightStart;
    let totalSleep = nightSleep;
  
    let recommendationText = `🌙 밤잠: ${minutesToTime(nightStart)} ~ ${minutesToTime(nightEnd)} (${nightSleep}분)`;
  
    // 낮잠 조건: 밤잠이 7시간 미만일 때만 계산
    if (nightSleep < 420) {
      const napStart = timeToMinutes(tomorrowTasks[0].end ?? '00:00') + 30;
      const napEnd = Math.min(napStart + 120, 24 * 60);
      const napDuration = napEnd - napStart;
  
      if (napDuration >= 60) {
        totalSleep += napDuration;
        recommendationText += `\n😴 낮잠: ${minutesToTime(napStart)} ~ ${minutesToTime(napEnd)} (${napDuration}분)`;
      }
    }
  
    // 최종 메시지
    if (nightSleep >= REQUIRED_SLEEP_MINUTES) {
      recommendationText += `\n어제 잘 주무셨나요? 오늘도 좋은 하루 보내고 꿀잠 주무세요~`;
    } else if (nightSleep >= 420) {
      recommendationText += `\n 어제 잘 주무셨나요? 오늘도 좋은 하루 보내고 꿀잠 주무세요~ :)`;
    } else if (totalSleep < REQUIRED_SLEEP_MINUTES) {
      recommendationText += `\n오늘은 조금 더 쉬는 게 좋겠어요. 일찍 주무시는 걸 추천드려요.`;
    } else {
      recommendationText += `\n밤잠이 부족했지만 낮잠으로 잘 보완됐어요!`;
    }
  
    if (recommendationText !== prevSlotsRef.current.join('\n')) {
      prevSlotsRef.current = recommendationText.split('\n');
      setRecommendation(recommendationText);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: '#EFF8FF' }}
      contentContainerStyle={styles.container}
    >
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Image source={{ uri: 'https://i.postimg.cc/k2XJR8Tt/back.png' }} style={styles.backImg} />
      </TouchableOpacity>

      <Text style={styles.header}>수면 추천 시간 계산</Text>

      <View style={styles.card}>
        <Text style={styles.date}>{todayStr}</Text>
        <View style={styles.rowHeader}>
          <Text style={styles.colHeader}>업무 내용</Text>
          <Text style={styles.colHeader}>시간</Text>
        </View>
        {todayTasks.length === 0 ? (
          <Text style={styles.noTask}>일정 없음</Text>
        ) : (
          todayTasks.map(task => (
            <View key={task.id} style={styles.taskRow}>
              <Text style={styles.taskText}>{task.title}</Text>
              <Text style={[styles.taskText, { fontWeight: 'bold', textAlign: 'right' }]}> {task.start} ~ {task.end} </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.date}>{tomorrowStr}</Text>
        <View style={styles.rowHeader}>
          <Text style={styles.colHeader}>업무 내용</Text>
          <Text style={styles.colHeader}>시간</Text>
        </View>
        {tomorrowTasks.length === 0 ? (
          <Text style={styles.noTask}>일정 없음</Text>
        ) : (
          tomorrowTasks.map(task => (
            <View key={task.id} style={styles.taskRow}>
              <Text style={styles.taskText}>{task.title}</Text>
              <Text style={[styles.taskText, { fontWeight: 'bold', textAlign: 'right' }]}> {task.start} ~ {task.end} </Text>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity onPress={calculateSleepTime} style={styles.calcButton}>
        <Text style={styles.calcText}>수면 시간 추천 계산</Text>
      </TouchableOpacity>

      {recommendation !== '' && (
        <Text style={styles.recommendation}>{recommendation}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    marginBottom: 10,
  },
  backImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  date: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 5,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 3,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingBottom: 4,
    marginBottom: 4,
  },
  colHeader: {
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  taskText: {
    flex: 1,
    flexWrap: 'wrap',
    textAlign: 'left',
  },
  noTask: {
    textAlign: 'center',
    color: '#666',
  },
  calcButton: {
    backgroundColor: '#708DDB',
    padding: 12,
    borderRadius: 20,
    marginTop: 10,
    alignSelf: 'center',
    paddingHorizontal: 25,
  },
  calcText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  recommendation: {
    marginTop: 15,
    fontWeight: 'bold',
    lineHeight: 22,
  },
});