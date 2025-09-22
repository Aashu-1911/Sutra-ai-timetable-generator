import { teachers, timeSlots, days, rooms, type TimetableSlot, type DaySchedule } from '@/data/timetableData';

export function generateTimetable(branch: string, division: string): DaySchedule[] {
  const schedule: DaySchedule[] = [];
  const classSlots = timeSlots.filter(slot => slot.type === 'class');
  
  // Get theory and lab subjects
  const theorySubjects = teachers.filter(t => t.type === 'TH');
  const labSubjects = teachers.filter(t => t.type === 'LAB');
  
  // Create session pool with multiple sessions per subject for better distribution
  const sessionPool: TimetableSlot[] = [];
  
  // Add theory sessions - 3 sessions per subject
  theorySubjects.forEach((teacher, index) => {
    for (let i = 0; i < 3; i++) {
      sessionPool.push({
        slotId: `theory-${teacher.shortForm}-${i}`,
        teacher: teacher.shortForm,
        course: teacher.courseShort,
        type: 'TH',
        room: rooms.theory[index % rooms.theory.length]
      });
    }
  });
  
  // Add lab sessions - 2 sessions per subject (each takes 2 slots)
  labSubjects.forEach((teacher, index) => {
    for (let i = 0; i < 2; i++) {
      sessionPool.push({
        slotId: `lab-${teacher.shortForm}-${i}`,
        teacher: teacher.shortForm,
        course: teacher.courseShort,
        type: 'LAB',
        room: rooms.lab[index % rooms.lab.length],
        batches: ['D1', 'D2', 'D3', 'D4'],
        isDoubleSlot: true
      });
    }
  });
  
  // Add library and project sessions
  for (let i = 0; i < 2; i++) {
    sessionPool.push({
      slotId: `library-${i}`,
      teacher: 'LIB',
      course: 'LIBRARY',
      type: 'LIBRARY',
      room: 'Library'
    });
  }
  
  for (let i = 0; i < 2; i++) {
    sessionPool.push({
      slotId: `project-${i}`,
      teacher: 'PROJ',
      course: 'PROJECT',
      type: 'PROJECT',
      room: 'Project Room'
    });
  }

  // Initialize empty schedule for all days
  days.forEach(day => {
    schedule.push({
      day,
      slots: new Array(classSlots.length).fill(null)
    });
  });

  // Randomly distribute sessions across days and slots
  const availableSessions = [...sessionPool];
  
  // Shuffle sessions for complete randomization
  for (let i = availableSessions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableSessions[i], availableSessions[j]] = [availableSessions[j], availableSessions[i]];
  }

  // Place sessions randomly across the week
  availableSessions.forEach(session => {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 50;

    while (!placed && attempts < maxAttempts) {
      const randomDay = Math.floor(Math.random() * 5);
      const randomSlot = Math.floor(Math.random() * classSlots.length);
      
      attempts++;

      if (session.isDoubleSlot) {
        // Lab session needs 2 consecutive slots
        if (randomSlot < classSlots.length - 1 && 
            !schedule[randomDay].slots[randomSlot] && 
            !schedule[randomDay].slots[randomSlot + 1]) {
          
          // Check if this teacher already has a session this day (for variety)
          const dayHasTeacher = schedule[randomDay].slots.some(slot => 
            slot && slot.teacher === session.teacher
          );
          
          // Allow placement but prefer days without this teacher
          if (!dayHasTeacher || attempts > 30) {
            schedule[randomDay].slots[randomSlot] = {
              ...session,
              slotId: `${days[randomDay].toLowerCase()}-${randomSlot}`
            };
            schedule[randomDay].slots[randomSlot + 1] = {
              ...session,
              slotId: `${days[randomDay].toLowerCase()}-${randomSlot + 1}`,
              course: `${session.course} (Cont.)`
            };
            placed = true;
          }
        }
      } else {
        // Theory session needs 1 slot
        if (!schedule[randomDay].slots[randomSlot]) {
          // Check if this teacher already has multiple sessions this day
          const teacherSessionsToday = schedule[randomDay].slots.filter(slot => 
            slot && slot.teacher === session.teacher
          ).length;
          
          // Prefer variety but allow placement if needed
          if (teacherSessionsToday < 2 || attempts > 30) {
            schedule[randomDay].slots[randomSlot] = {
              ...session,
              slotId: `${days[randomDay].toLowerCase()}-${randomSlot}`
            };
            placed = true;
          }
        }
      }
    }
  });

  return schedule;
}

export function formatTimeSlot(slotIndex: number): string {
  const classSlots = timeSlots.filter(slot => slot.type === 'class');
  if (slotIndex < classSlots.length) {
    const slot = classSlots[slotIndex];
    return `${slot.startTime} - ${slot.endTime}`;
  }
  return '';
}

export function getSlotColor(type: string): string {
  switch (type) {
    case 'TH': return 'bg-blue-50 border-l-4 border-l-blue-500 hover:bg-blue-100';
    case 'LAB': return 'bg-green-50 border-l-4 border-l-green-500 hover:bg-green-100';
    case 'LIBRARY': return 'bg-purple-50 border-l-4 border-l-purple-500 hover:bg-purple-100';
    case 'PROJECT': return 'bg-orange-50 border-l-4 border-l-orange-500 hover:bg-orange-100';
    default: return 'bg-gray-50 border-l-4 border-l-gray-300 hover:bg-gray-100';
  }
}

export function getTypeColor(type: string): string {
  switch (type) {
    case 'TH': return 'bg-blue-100 text-blue-800';
    case 'LAB': return 'bg-green-100 text-green-800';
    case 'LIBRARY': return 'bg-purple-100 text-purple-800';
    case 'PROJECT': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}