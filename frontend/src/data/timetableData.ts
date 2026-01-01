// Teacher and course data
export interface Teacher {
  name: string;
  shortForm: string;
  course: string;
  courseShort: string;
  type: 'TH' | 'LAB';
}

export const teachers: Teacher[] = [
  { name: "DR.SATISH GAJBHIV", shortForm: "SG", course: "CALCULUS & DIFFERENTIAL EQUATION", courseShort: "CDE", type: "TH" },
  { name: "Mrs. Priyanka Mane", shortForm: "PM", course: "FOUNDATIONS OF COMPUTING", courseShort: "FOC", type: "TH" },
  { name: "Dr. Ashish Itolikar", shortForm: "AI", course: "ENGINEERING PHYSICS", courseShort: "PHY", type: "TH" },
  { name: "Satish S. Kabra", shortForm: "SSK", course: "DIGITAL ELECTRONICS ENGINEER", courseShort: "DEE", type: "TH" },
  { name: "Suyoga Bansode", shortForm: "SB", course: "DATA DRIVEN MODELLING", courseShort: "DDM", type: "TH" },
  { name: "DR.SATISH GAJBHIV", shortForm: "SG", course: "MATHS TUTORIAL", courseShort: "MT", type: "LAB" },
  { name: "Mrs. Priyanka Mane", shortForm: "PM", course: "FOUNDATIONS OF COMPUTING LAB", courseShort: "FOC", type: "LAB" },
  { name: "Dr. Ashish Itolikar", shortForm: "AI", course: "ENGINEERING PHYSICS LAB", courseShort: "PHY", type: "LAB" },
  { name: "Satish S. Kabra", shortForm: "SK", course: "DIGITAL ELECTRONICS ENGINEERING LAB", courseShort: "DEE", type: "LAB" },
  { name: "Dr. S.S.Kulkarni", shortForm: "SSK", course: "COMMUNICATION SKILLS LAB- ENGLISH", courseShort: "CSE", type: "LAB" },
  { name: "Suyoga Bansode", shortForm: "SB", course: "DATA DRIVEN MODELLING", courseShort: "DDM", type: "LAB" },
];

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  type: 'class' | 'break' | 'lunch';
}

export const timeSlots: TimeSlot[] = [
  // First two slots
  { id: "slot1", startTime: "08:30", endTime: "09:25", duration: 55, type: "class" },
  { id: "slot2", startTime: "09:25", endTime: "10:20", duration: 55, type: "class" },
  // Short break
  { id: "break1", startTime: "10:20", endTime: "10:30", duration: 10, type: "break" },
  // Next two slots
  { id: "slot3", startTime: "10:30", endTime: "11:25", duration: 55, type: "class" },
  { id: "slot4", startTime: "11:25", endTime: "12:20", duration: 55, type: "class" },
  // Lunch break
  { id: "lunch", startTime: "12:20", endTime: "01:15", duration: 55, type: "lunch" },
  // After lunch slots
  { id: "slot5", startTime: "01:15", endTime: "02:10", duration: 55, type: "class" },
  { id: "slot6", startTime: "02:10", endTime: "03:05", duration: 55, type: "class" },
  // Short break
  { id: "break2", startTime: "03:05", endTime: "03:15", duration: 10, type: "break" },
  // Final slots
  { id: "slot7", startTime: "03:15", endTime: "04:10", duration: 55, type: "class" },
  { id: "slot8", startTime: "04:10", endTime: "04:50", duration: 40, type: "class" }, // Last slot slightly shorter
];

export interface TimetableSlot {
  slotId: string;
  teacher: string;
  course: string;
  type: 'TH' | 'LAB' | 'LIBRARY' | 'PROJECT';
  room?: string;
  batches?: string[]; // For lab sessions
  isDoubleSlot?: boolean; // For lab sessions that span 2 slots
}

export interface DaySchedule {
  day: string;
  slots: (TimetableSlot | null)[];
}

export const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export const colors = {
  theory: "bg-blue-100 border-blue-300 text-blue-800",
  lab: "bg-green-100 border-green-300 text-green-800",
  library: "bg-purple-100 border-purple-300 text-purple-800",
  project: "bg-orange-100 border-orange-300 text-orange-800",
  break: "bg-gray-100 border-gray-300 text-gray-600"
};

// Room assignments
export const rooms = {
  theory: ["101", "102", "103", "201", "202", "203"],
  lab: ["Lab-A", "Lab-B", "Lab-C", "Lab-D", "CS-Lab", "Physics-Lab"]
};