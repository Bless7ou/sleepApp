export type Task = {
    id: string;
    title: string;
    date: string;
    color: string;
    start?: string;
    end?: string;
  };

  export type RootStackParamList = {
    ScheduleList: { selectedDate: string };
    Home: undefined;
    SleepRecommend: {
      todayTasks: Task[];
      tomorrowTasks: Task[];
      baseDate: string;
    };
  };
  
  