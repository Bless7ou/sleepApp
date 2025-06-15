import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Image, ImageBackground,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

const days = ['월', '화', '수', '목', '금', '토', '일'];

type Task = {
  title: string;
  color: string;
  date: string; // YYYY-MM-DD 형식
  start?: string;
};

export default function HomeScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [screen, setScreen] = useState<'Home' | 'SleepLog' | 'Schedule' | 'Profile'>('Home');
    const [sleepData, setSleepData] = useState<Record<string, { start: string; end: string }>>({});
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [startTime, setStartTime] = useState(new Date(0, 0, 0, 23, 0));
    const [endTime, setEndTime] = useState(new Date(0, 0, 0, 7, 0));
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [name, setName] = useState('');
    const [gender, setGender] = useState<'남' | '여'>('남');

  useEffect(
    React.useCallback(() => {
        (async () => {
          const storedName = await AsyncStorage.getItem('@name');
          const storedGender = await AsyncStorage.getItem('@gender');
          const jsonValue = await AsyncStorage.getItem('@sleepData');
          const taskValue = await AsyncStorage.getItem('@tasks');
          if (storedName) setName(storedName);
          if (storedGender === '남' || storedGender === '여') setGender(storedGender);
          if (jsonValue != null) setSleepData(JSON.parse(jsonValue));
          if (taskValue != null) setTasks(JSON.parse(taskValue));
        })();
      }, [])
);


  const saveData = async (day: string, start: Date, end: Date) => {
    const newData = {
      ...sleepData,
      [day]: { start: start.toISOString(), end: end.toISOString() },
    };
    setSleepData(newData);
    await AsyncStorage.setItem('@sleepData', JSON.stringify(newData));
  };

  const calculateSleepHours = (start: Date, end: Date) => {
    let startDate = new Date(0, 0, 0, start.getHours(), start.getMinutes());
    let endDate = new Date(0, 0, 0, end.getHours(), end.getMinutes());
    if (endDate <= startDate) endDate.setDate(endDate.getDate() + 1);
    return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  };

  const sleepStats = () => {
    const values = days.map(day =>
      sleepData[day] ? calculateSleepHours(new Date(sleepData[day].start), new Date(sleepData[day].end)) : 0
    );
    const total = values.reduce((a, b) => a + b, 0);
    const count = values.filter(v => v > 0).length;
    const avg = count ? (total / count) : 0;
    const max = Math.max(...values);
    const min = Math.min(...values.filter(v => v > 0));
    const best = days[values.indexOf(max)];
    const worst = values.includes(min) ? days[values.indexOf(min)] : '-';
    return { average: avg.toFixed(1), best, worst };
  };

  const onChangeStart = (_: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) setStartTime(selectedDate);
  };

  const onChangeEnd = (_: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) setEndTime(selectedDate);
  };

  const openModal = (day: string) => {
    setSelectedDay(day);
    if (sleepData[day]) {
      setStartTime(new Date(sleepData[day].start));
      setEndTime(new Date(sleepData[day].end));
    } else {
      setStartTime(new Date(0, 0, 0, 23, 0));
      setEndTime(new Date(0, 0, 0, 7, 0));
    }
    setModalVisible(true);
  };

  const generateMarkedDates = (): Record<string, { dots: { color: string; selectedDotColor: string }[] }> => {
    const grouped: Record<string, Task[]> = {};
    tasks.forEach(task => {
      if (!grouped[task.date]) grouped[task.date] = [];
      grouped[task.date].push(task);
    });

    const marked: Record<string, { dots: { color: string; selectedDotColor: string }[] }> = {};
    Object.entries(grouped).forEach(([date, taskList]) => {
      const sorted = taskList.sort((a, b) => {
        const [ha, ma] = (a.start ?? '00:00').split(':').map(Number);
        const [hb, mb] = (b.start ?? '00:00').split(':').map(Number);
        return ha * 60 + ma - (hb * 60 + mb);
      });

      const dots = sorted.slice(0, 3).map(t => ({
        color: t.color,
        selectedDotColor: t.color,
      }));

      marked[date] = { dots };
    });

    return marked;
  };

  const getTodayKST = () => {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    return kstDate.toISOString().split('T')[0];
  };


  return (
    <View style={styles.container}>
      {screen === 'Home' && (
        <>
          <TouchableOpacity style={styles.charButton}>
            <Text style={styles.charButtonText}>Character</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton} onPress={() => setScreen('Profile')}>
            <Image source={{ uri: gender === '여'
              ? 'https://i.postimg.cc/kXv5vgdh/profile2.jpg'
              : 'https://i.postimg.cc/h4xvh0Zn/pripile.jpg' }}
              style={styles.profileIcon} />
          </TouchableOpacity>
          <Image source={{ uri: 'https://i.postimg.cc/P5dPg84j/message.png' }} style={styles.speechBubbleImage} />
          <Text style={styles.speechOverlayText}>안녕하세요! 이제 자러 가보일까요?</Text>
          <Image source={{ uri: 'https://i.postimg.cc/tgVmMVZN/image.png' }} style={styles.characterImage} />
          <Text style={styles.nameText}>{name || '이름'}</Text>
          <View style={styles.bottomButtons}>
            <TouchableOpacity onPress={() => setScreen('SleepLog')}>
              <ImageBackground source={{ uri: 'https://i.postimg.cc/h4Hm5j6D/BT3-3.png' }} style={styles.imageButton} imageStyle={{ resizeMode: 'contain' }}>
                <Text style={styles.imageButtonText}>SleepLog</Text>
              </ImageBackground>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setScreen('Schedule')}>
              <ImageBackground source={{ uri: 'https://i.postimg.cc/h4Hm5j6D/BT3-3.png' }} style={styles.imageButton} imageStyle={{ resizeMode: 'contain' }}>
                <Text style={styles.imageButtonText}>Schedule</Text>
              </ImageBackground>
            </TouchableOpacity>
          </View>
        </>
      )}

      {screen === 'SleepLog' && (
        <>
            <TouchableOpacity style={styles.homeButton} onPress={() => setScreen('Home')}>
                <Image
                     source={{ uri: 'https://i.postimg.cc/5yvXVBTx/home.png' }}
                    style={styles.homeIcon}
                />
            </TouchableOpacity>
          <Text style={styles.nameText}>Weekly Sleep Tracker</Text>
          <View style={styles.graphContainer}>
            <View style={styles.yAxis}>
              {[...Array(13)].map((_, i) => {
                const label = 24 - i * 2;
                return <Text key={i} style={styles.yLabel}>{label}</Text>;
              })}
            </View>
            <View style={styles.barContainer}>
              {days.map((day) => {
                const hours = sleepData[day] ? calculateSleepHours(new Date(sleepData[day].start), new Date(sleepData[day].end)) : 0;
                const height = (hours / 24) * 240;
                return (
                  <View key={day} style={styles.barWrapper}>
                    <View style={[styles.bar, { height }]} />
                    <Text style={styles.barLabel}>{day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
          <View style={styles.dayButtons}>
            {days.map((day) => (
              <TouchableOpacity key={day} style={styles.dayCircle} onPress={() => openModal(day)}>
                <Text style={styles.dayCircleText}>{day}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.statsContainer}>
            <Text>📊 평균 수면: {sleepStats().average}시간</Text>
            <Text>💤 가장 많이 자는 날: {sleepStats().best}</Text>
            <Text>🚪 가장 적게 자는 날: {sleepStats().worst}</Text>
          </View>
            <View style={styles.bottomButtons}>
                <TouchableOpacity onPress={() => setScreen('SleepLog')}>
                    <ImageBackground
                    source={{ uri: 'https://i.postimg.cc/h4Hm5j6D/BT3-3.png' }}
                    style={styles.imageButton}
                    imageStyle={{ resizeMode: 'contain' }}
                        >
                        <Text style={styles.imageButtonText}>SleepLog</Text>
                    </ImageBackground>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setScreen('Schedule')}>
                <ImageBackground
                    source={{ uri: 'https://i.postimg.cc/h4Hm5j6D/BT3-3.png' }}
                    style={styles.imageButton}
                    imageStyle={{ resizeMode: 'contain' }}
                    >
                    <Text style={styles.imageButtonText}>Schedule</Text>
                </ImageBackground>
                </TouchableOpacity>
            </View>
        </>
      )}

    {screen === 'Schedule' && (
        <>
          <TouchableOpacity style={styles.homeButton} onPress={() => setScreen('Home')}>
            <Image source={{ uri: 'https://i.postimg.cc/5yvXVBTx/home.png' }} style={styles.homeIcon} />
          </TouchableOpacity>
          <Text style={styles.nameText}>Schedule</Text>
          <Calendar
            current={getTodayKST()}
            markingType={'multi-dot'}
            markedDates={generateMarkedDates()}
            monthFormat={'yyyy MM'}
            hideExtraDays
            theme={{
              selectedDayBackgroundColor: '#4977B9',
              todayTextColor: '#4977B9',
              arrowColor: '#4977B9',
              textDayFontSize: 16,
              textDayHeaderFontSize: 14,
            }}
            style={{
              borderRadius: 10,
              paddingBottom: 20,
              marginTop: 80,
              backgroundColor: 'white',
              position: 'relative',
              zIndex: 0,
            }}
            onDayPress={(day) => {
              navigation.navigate('ScheduleList', { selectedDate: day.dateString });
            }}
          />
          <View style={styles.bottomButtons}>
            <TouchableOpacity onPress={() => setScreen('SleepLog')}>
              <ImageBackground
                source={{ uri: 'https://i.postimg.cc/h4Hm5j6D/BT3-3.png' }}
                style={styles.imageButton}
                imageStyle={{ resizeMode: 'contain' }}
              >
                <Text style={styles.imageButtonText}>SleepLog</Text>
              </ImageBackground>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setScreen('Schedule')}>
              <ImageBackground
                source={{ uri: 'https://i.postimg.cc/h4Hm5j6D/BT3-3.png' }}
                style={styles.imageButton}
                imageStyle={{ resizeMode: 'contain' }}
              >
                <Text style={styles.imageButtonText}>Schedule</Text>
              </ImageBackground>
            </TouchableOpacity>
          </View>
        </>
        )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedDay ? `${selectedDay}요일 수면 시간 입력` : '수면 시간 입력'}
            </Text>
            <TouchableOpacity style={styles.modalTimeButton} onPress={() => setShowStartPicker(true)}>
              <Text>🌙 수면 시작: {startTime.getHours()}시 {startTime.getMinutes()}분</Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker value={startTime} mode="time" is24Hour display="spinner" onChange={onChangeStart} />
            )}
            <TouchableOpacity style={styles.modalTimeButton} onPress={() => setShowEndPicker(true)}>
              <Text>☀️ 기상 시간: {endTime.getHours()}시 {endTime.getMinutes()}분</Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker value={endTime} mode="time" is24Hour display="spinner" onChange={onChangeEnd} />
            )}
            <View style={styles.modalButtons}>
  <TouchableOpacity onPress={() => {
    if (selectedDay) saveData(selectedDay, startTime, endTime);
    setModalVisible(false);
  }}>
    <ImageBackground
      source={{ uri: 'https://i.postimg.cc/RC8hZDLX/BT-2.png' }}
      style={styles.modalImageButton}
      imageStyle={{ resizeMode: 'contain' }}
    >
      <Text style={styles.modalImageButtonText}>저장</Text>
    </ImageBackground>
  </TouchableOpacity>

  <TouchableOpacity onPress={() => setModalVisible(false)}>
    <ImageBackground
      source={{ uri: 'https://i.postimg.cc/RC8hZDLX/BT-2.png' }}
      style={styles.modalImageButton}
      imageStyle={{ resizeMode: 'contain' }}
    >
      <Text style={styles.modalImageButtonText}>취소</Text>
    </ImageBackground>
  </TouchableOpacity>
</View>

          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EAF4FB', paddingHorizontal: 20, paddingBottom: 120 },
  charButton: { position: 'absolute', top: 40, left: 20, backgroundColor: '#D8EFFF', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
  charButtonText: { fontSize: 16, color: '#4977B9', fontWeight: 'bold' },
  profileButton: { position: 'absolute', top: 30, right: 20 },
  profileIcon: { width: 60, height: 60, borderRadius: 50 },
  speechBubbleImage: { width: 280, height: 280, alignSelf: 'center', marginTop: 40, resizeMode: 'contain' },
  speechOverlayText: { position: 'absolute', top: 150, alignSelf: 'center', color: 'white', fontSize: 14, fontWeight: 'bold' },
  characterImage: { width: 250, height: 250, alignSelf: 'center', marginTop: -30 },
  nameText: { textAlign: 'center', fontSize: 20, marginTop: 10 },
  bottomButtons: { position: 'absolute', bottom: 30, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around' },
  imageButton: { width: 130, height: 100, justifyContent: 'center', alignItems: 'center' },
  imageButtonText: { color: '#4977B9', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  modalContent: { width: '100%', backgroundColor: '#EAF4FB', borderRadius: 15, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#4977B9' },
  modalTimeButton: { padding: 12, backgroundColor: '#A4D8F0', borderRadius: 10, marginBottom: 15, width: '100%', alignItems: 'center' },
  modalButtons: { flexDirection: 'row', width: '100%', justifyContent: 'space-around' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#4977B9', alignSelf: 'center', marginTop: 70 },
  graphContainer: { flexDirection: 'row', marginTop: 100, alignItems: 'flex-end', justifyContent: 'center' },
  yAxis: { justifyContent: 'space-between', alignItems: 'flex-end', height: 240, marginRight: 10 },
  yLabel: { fontSize: 10, color: '#999', width: 30, textAlign: 'right' },
  barContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', flex: 1 },
  barWrapper: { alignItems: 'center', marginHorizontal: 4 },
  bar: { width: 20, backgroundColor: '#8BB8E8', borderRadius: 20 },
  barLabel: { marginTop: 20, fontSize: 12, color: '#4977B9' },
  dayButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 40 },
  dayCircle: { backgroundColor: '#A4D8F0', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  dayCircleText: { fontSize: 16, fontWeight: 'bold', color: '#4977B9' },
  statsContainer: { marginTop: 30, alignItems: 'center' },
  homeButton: {position: 'absolute',top: 30,left: 20,zIndex: 10,elevation: 10,},
  homeIcon: {width: 50,height: 50,resizeMode: 'contain',},
  modalImageButton: {
    width: 80,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  
  modalImageButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
