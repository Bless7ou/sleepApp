import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Image,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, RouteProp } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

const box2 = { uri: 'https://i.postimg.cc/yg9sCT82/box2.png' };
const plusIcon = { uri: 'https://i.postimg.cc/hJVcHrj6/plus-Button.png' };
const backIcon = { uri: 'https://i.postimg.cc/k2XJR8Tt/back.png' };
const startBtn = { uri: 'https://i.postimg.cc/BXy3byPR/start.png' };
const endBtn = { uri: 'https://i.postimg.cc/yDtNqxTg/end.png' };
const deleteBtn = { uri: 'https://i.postimg.cc/Vd76RDrF/delete.png' };
const closeBtn = { uri: 'https://i.postimg.cc/06G1tyXq/X.png' };
const addBtn = { uri: 'https://i.postimg.cc/bZCzxJ5V/add.png' };
const sleepCalcBtn = { uri: 'https://i.postimg.cc/Z0w4t0bb/Sleep-cal.png' };
const nextIcon = { uri: 'https://i.postimg.cc/qz7Bzyb6/next.png' };
const preIcon = { uri: 'https://i.postimg.cc/k6c95gWy/pre.png' };
const retimeBtn = { uri: 'https://i.postimg.cc/1V3SV1H1/retime.png' };

interface Task {
  id: string;
  title: string;
  date: string;
  color: string;
  start?: string;
  end?: string;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ScheduleList'>;
type Route = RouteProp<RootStackParamList, 'ScheduleList'>;

const isValidTimeFormat = (time: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

const getCurrentTime = () => {
  const formatter = new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  });
  const parts = formatter.formatToParts(new Date());
  const hour = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;
  return `${hour}:${minute}`;
};

export default function ScheduleListScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<NavigationProp>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentDate, setCurrentDate] = useState(() =>
    route.params?.selectedDate ? new Date(route.params.selectedDate) : new Date()
  );
  const [showModal, setShowModal] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#000000');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('@tasks');
      if (stored) setTasks(JSON.parse(stored));
    })();
  }, []);

  const palette = ['#FF4D4D', '#FF914D', '#FFCD4D', '#33CC33', '#4DA6FF', '#3366FF', '#9933FF', '#000000'];

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const timeToMinutes = (time: string = '00:00') => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const filteredTasks = tasks
    .filter(t => t.date === formatDate(currentDate))
    .sort((a, b) => timeToMinutes(a.start || '00:00') - timeToMinutes(b.start || '00:00'));

  const addTask = async () => {
    if (!title.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      date: formatDate(currentDate),
      color,
      start: '',
      end: '',
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    await AsyncStorage.setItem('@tasks', JSON.stringify(updatedTasks));
    setTitle('');
    setColor('#000000');
    setShowModal(false);
  };

  const handleStart = async () => {
    if (!selectedTask) return;
    const current = getCurrentTime();
    const updatedTasks = tasks.map(task =>
      task.id === selectedTask.id ? { ...task, start: current } : task
    );
    setTasks(updatedTasks);
    await AsyncStorage.setItem('@tasks', JSON.stringify(updatedTasks));
    setStartTime(current);
  };

  const handleEnd = async () => {
    if (!selectedTask) return;
    const current = getCurrentTime();
    const updatedTasks = tasks.map(task =>
      task.id === selectedTask.id ? { ...task, end: current } : task
    );
    setTasks(updatedTasks);
    await AsyncStorage.setItem('@tasks', JSON.stringify(updatedTasks));
    setEndTime(current);
  };

  const handleSaveTime = async () => {
    if (!selectedTask || !isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) return;
    const updatedTasks = tasks.map(task =>
      task.id === selectedTask.id ? { ...task, start: startTime, end: endTime } : task
    );
    setTasks(updatedTasks);
    await AsyncStorage.setItem('@tasks', JSON.stringify(updatedTasks));
    handleClose();
  };

  const handleDelete = async () => {
    if (!selectedTask) return;
    const updated = tasks.filter(task => task.id !== selectedTask.id);
    setTasks(updated);
    await AsyncStorage.setItem('@tasks', JSON.stringify(updated));
    handleClose();
  };

  const handleClose = () => {
    setEditModalVisible(false);
    setSelectedTask(null);
    setStartTime('');
    setEndTime('');
  };

  const changeDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + days);
    setCurrentDate(newDate);
    setStartTime('');
    setEndTime('');
    setSelectedTask(null);
  };

  const handleSleepRecommend = () => {
    const todayStr = formatDate(currentDate);
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(currentDate.getDate() + 1);
    const tomorrowStr = formatDate(tomorrow);

    const todayTasks = tasks.filter(t => t.date === todayStr);
    const tomorrowTasks = tasks.filter(t => t.date === tomorrowStr);

    navigation.navigate('SleepRecommend', {
      baseDate: currentDate.toISOString(),
      todayTasks,
      tomorrowTasks,
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Image source={backIcon} style={styles.backImage} />
      </TouchableOpacity>

      <View style={styles.dateRow}>
        <TouchableOpacity onPress={() => changeDate(-1)}>
          <Image source={preIcon} style={styles.arrowIcon} />
        </TouchableOpacity>
        <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
        <TouchableOpacity onPress={() => changeDate(1)}>
          <Image source={nextIcon} style={styles.arrowIcon} />
        </TouchableOpacity>
      </View>

      <ImageBackground source={box2} style={styles.card} resizeMode="cover">
        {filteredTasks.length === 0 ? (
          <Text style={styles.emptyText}>등록된 일정이 없습니다.</Text>
        ) : (
          filteredTasks.map((item) => (
            <TouchableOpacity key={item.id} onPress={() => {
              setSelectedTask(item);
              setStartTime(item.start || '');
              setEndTime(item.end || '');
              setEditModalVisible(true);
            }}>
              <View style={styles.taskRow}>
                <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                <Text style={[styles.taskText, { fontWeight: 'bold' }]}>{item.title}</Text>
                {(item.start && item.end) && (
                  <Text style={styles.timeText}>{item.start} ~ {item.end}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
          <Image source={plusIcon} style={styles.addButtonImage} />
        </TouchableOpacity>
      </ImageBackground>

      <TouchableOpacity
        style={styles.sleepCalcButton}
        onPress={handleSleepRecommend}>
        <Image source={sleepCalcBtn} style={styles.sleepCalcImage} />
      </TouchableOpacity>

      {/* 일정 추가 모달 */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#b4c8e4' }]}> 
            <TouchableOpacity onPress={() => setShowModal(false)} style={{ position: 'absolute', top: 10, right: 10 }}>
              <Image source={closeBtn} style={{ width: 30, height: 30, resizeMode: 'contain' }} />
            </TouchableOpacity>
            <Text style={[styles.modalLabel, { color: 'white' }]}>일정 제목</Text>
            <TextInput
              style={[styles.input, { borderColor: 'white', color: 'white', fontWeight: 'bold' }]}
              placeholder="제목 입력"
              placeholderTextColor="#ffffff99"
              value={title}
              onChangeText={setTitle}
            />
            <Text style={[styles.modalLabel, { color: 'white' }]}>색상 선택</Text>
            <View style={styles.colorGrid}>
              {palette.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, {
                    backgroundColor: c,
                    borderWidth: color === c ? 2 : 0,
                    borderColor: 'white'
                  }]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>
            <TouchableOpacity onPress={addTask} style={{ alignSelf: 'center', marginTop: 10 }}>
              <Image source={addBtn} style={{ width: 120, height: 40, resizeMode: 'contain' }} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 시간 기록 모달 */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#b4c8e4' }]}> 
            {selectedTask && (
              <>
                <TouchableOpacity onPress={handleClose} style={{ position: 'absolute', top: 10, right: 10 }}>
                  <Image source={closeBtn} style={{ width: 30, height: 30, resizeMode: 'contain' }} />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 10 }}>
                  <View style={[styles.colorDot, { backgroundColor: selectedTask.color, width: 20, height: 20 }]} />
                  <Text style={[styles.taskText, { fontSize: 17, color: 'white', marginLeft: 10, fontWeight: 'bold'}]}>{selectedTask.title}</Text>
                </View>
                <View style={[styles.modalButtons, { justifyContent: 'space-evenly' }]}>
                  <TouchableOpacity onPress={handleStart}>
                    <Image source={startBtn} style={{ width: 120, height: 40, resizeMode: 'contain' }} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleEnd}>
                    <Image source={endBtn} style={{ width: 120, height: 40, resizeMode: 'contain' }} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => { setPickerMode('start'); setShowPicker(true); }}>
        <TextInput
          style={[styles.input, { borderColor: 'white', fontSize: 14, color: 'white', fontWeight: 'bold' }]}
          value={startTime}
          editable={false}
          placeholder="시작 시간"
          placeholderTextColor="#ffffff99"
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => { setPickerMode('end'); setShowPicker(true); }}>
        <TextInput
          style={[styles.input, { borderColor: 'white', fontSize: 14, color: 'white', fontWeight: 'bold' }]}
          value={endTime}
          editable={false}
          placeholder="종료 시간"
          placeholderTextColor="#ffffff99"
        />
      </TouchableOpacity>

      {/* DateTimePicker 렌더링 */}
      {showPicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour={true}
          display="spinner"
          onChange={(event, selectedDate) => {
            if (event.type === 'dismissed') {
              setShowPicker(false);
              return;
            }

            const date = selectedDate || new Date();
            const h = date.getHours().toString().padStart(2, '0');
            const m = date.getMinutes().toString().padStart(2, '0');
            const formatted = `${h}:${m}`;

            if (pickerMode === 'start') setStartTime(formatted);
            if (pickerMode === 'end') setEndTime(formatted);

            setShowPicker(false);
            setPickerMode(null);
          }}
        />
      )}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                  <TouchableOpacity onPress={handleSaveTime}>
                    <Image source={retimeBtn} style={{ width: 140, height: 50, resizeMode: 'contain' }} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDelete}>
                    <Image source={deleteBtn} style={{ width: 140, height: 50, resizeMode: 'contain' }} />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#EFF8FF',
  },
  backButton: { marginBottom: 10 },
  backImage: { width: 50, height: 50, resizeMode: 'contain' },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  arrowIcon: { width: 30, height: 30, resizeMode: 'contain' },
  dateText: { fontSize: 16, fontWeight: 'bold', fontFamily: 'System' },
  card: {
    width: '105%',
    height: 450,
    padding: 20,
    borderRadius: 10,
    justifyContent: 'flex-start',
    marginBottom: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  taskRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  colorDot: {
    width: 14,
    height: 14,
    marginRight: 15,
    marginLeft: 5,
    borderRadius: 3,
  },
  taskText: { fontSize: 14, fontWeight: '500', fontFamily: 'System' },
  timeText: { marginLeft: 20, fontSize: 13, fontWeight: 'bold', color: '#555' },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 20,
    fontFamily: 'System',
  },
  addButton: {
    position: 'absolute',
    bottom: 10,
    right: 40,
    width: 40,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonImage: { width: 36, height: 36, resizeMode: 'contain' },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: { width: '80%', borderRadius: 10, padding: 20 },
  modalLabel: { fontWeight: 'bold', marginTop: 10, fontFamily: 'System' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 5,
    marginTop: 5,
    fontFamily: 'System',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginVertical: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 10,
  },
  sleepCalcButton: { marginTop: 20, alignSelf: 'flex-start' },
  sleepCalcImage: { width: 160, height: 50, resizeMode: 'contain' },
});
