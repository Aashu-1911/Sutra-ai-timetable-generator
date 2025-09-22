import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Home, BookOpen, Clock, MapPin, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { BranchSelection } from "@/components/ui/branch-selection";
import { AcademicCalendar } from "@/components/ui/academic-calendar";

const StudentDashboard = () => {
  const [showBranchSelection, setShowBranchSelection] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleBranchSelection = (year: string, branch: string, division?: string) => {
    setSelectedYear(year);
    setSelectedBranch(branch);
    setSelectedDivision(division || "");
    setShowBranchSelection(false);
  };
  // Sample student timetable data
  const studentSchedule = [
    { day: "Monday", slots: [
      { time: "9:00-10:00", subject: "Educational Psychology", faculty: "Dr. Johnson", room: "Room 101", type: "theory" },
      { time: "10:00-11:00", subject: "Mathematics Methods", faculty: "Dr. Smith", room: "Room 203", type: "theory" },
      { time: "11:00-12:00", subject: "English Literature", faculty: "Prof. Williams", room: "Room 105", type: "theory" },
      { time: "2:00-4:00", subject: "Science Lab", faculty: "Dr. Brown", room: "Lab A", type: "practical" }
    ]},
    { day: "Tuesday", slots: [
      { time: "9:00-10:00", subject: "History of Education", faculty: "Dr. Davis", room: "Room 102", type: "theory" },
      { time: "10:00-11:00", subject: "Child Psychology", faculty: "Dr. Johnson", room: "Room 101", type: "theory" },
      { time: "2:00-3:00", subject: "Art & Craft", faculty: "Ms. Taylor", room: "Art Studio", type: "practical" }
    ]},
    { day: "Wednesday", slots: [
      { time: "9:00-10:00", subject: "Mathematics Methods", faculty: "Dr. Smith", room: "Room 203", type: "theory" },
      { time: "11:00-12:00", subject: "Physical Education", faculty: "Mr. Wilson", room: "Gymnasium", type: "practical" },
      { time: "2:00-4:00", subject: "Teaching Practice", faculty: "Dr. Johnson", room: "Practice School", type: "practical" }
    ]},
    { day: "Thursday", slots: [
      { time: "9:00-10:00", subject: "Environmental Science", faculty: "Dr. Green", room: "Room 104", type: "theory" },
      { time: "10:00-11:00", subject: "Educational Technology", faculty: "Prof. Kumar", room: "Computer Lab", type: "practical" },
      { time: "11:00-12:00", subject: "English Literature", faculty: "Prof. Williams", room: "Room 105", type: "theory" }
    ]},
    { day: "Friday", slots: [
      { time: "9:00-10:00", subject: "Research Methodology", faculty: "Dr. Patel", room: "Room 201", type: "theory" },
      { time: "10:00-11:00", subject: "Educational Psychology", faculty: "Dr. Johnson", room: "Room 101", type: "theory" },
      { time: "2:00-4:00", subject: "Teaching Practice", faculty: "Dr. Johnson", room: "Practice School", type: "practical" }
    ]}
  ];

  const studentInfo = {
    name: "Priya Sharma",
    program: "B.Ed",
    semester: "Semester 4",
    rollNo: "BED2022045",
    batch: "2022-2024"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent via-secondary to-muted">
      {/* Header */}
      <header className="bg-primary shadow-elegant">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center space-x-3">
                <img 
                  src="/lovable-uploads/1606dbd9-e5f2-4a27-b88e-820d9baad768.png" 
                  alt="Timely.ai logo" 
                  className="w-10 h-10"
                />
                <h1 className="text-2xl font-bold text-primary-foreground">Timely.ai</h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-primary-lighter text-primary">
                Student Portal
              </Badge>
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Student Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {studentInfo.name} - {studentInfo.program} {studentInfo.semester}
          </p>
          {selectedBranch && selectedDivision && (
            <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary">
              Year {selectedYear} - {selectedBranch} - Division {selectedDivision}
            </Badge>
          )}
        </div>

        {/* Student Info Card */}
        <Card className="bg-card/50 backdrop-blur-sm shadow-card mb-8">
          <CardHeader>
            <CardTitle className="text-primary">Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <span className="text-muted-foreground text-sm">Roll Number</span>
                <div className="font-medium text-primary">{studentInfo.rollNo}</div>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Program</span>
                <div className="font-medium text-primary">{studentInfo.program}</div>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Semester</span>
                <div className="font-medium text-primary">{studentInfo.semester}</div>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Batch</span>
                <div className="font-medium text-primary">{studentInfo.batch}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Timetable */}
        <Card className="bg-card/50 backdrop-blur-sm shadow-card mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-primary">Weekly Timetable</CardTitle>
                <CardDescription>Your class schedule for this week</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 min-w-[900px]">
                {studentSchedule.map((day) => (
                  <Card key={day.day} className="bg-accent/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-primary text-center">{day.day}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {day.slots.length > 0 ? (
                        day.slots.map((slot, index) => (
                          <div 
                            key={index} 
                            className={`p-3 rounded-lg text-sm ${
                              slot.type === 'practical' 
                                ? 'bg-primary-lighter/20 border border-primary-lighter/30' 
                                : 'bg-primary/10 border border-primary/20'
                            }`}
                          >
                            <div className="font-medium text-primary mb-1">{slot.time}</div>
                            <div className="text-foreground font-medium mb-1">{slot.subject}</div>
                            <div className="flex items-center text-muted-foreground text-xs mb-1">
                              <BookOpen className="w-3 h-3 mr-1" />
                              {slot.faculty}
                            </div>
                            <div className="flex items-center text-muted-foreground text-xs mb-2">
                              <MapPin className="w-3 h-3 mr-1" />
                              {slot.room}
                            </div>
                            <Badge 
                              variant={slot.type === 'practical' ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {slot.type}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-muted-foreground py-4">No classes</div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Summary */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-card/30 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-primary">Weekly Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Classes:</span>
                <span className="font-medium text-primary">25</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Theory Hours:</span>
                <span className="font-medium text-primary">11</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lab Hours:</span>
                <span className="font-medium text-primary-light">14</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-primary">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <Download className="w-4 h-4 mr-2" />
                Download Timetable
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => setCalendarOpen(true)}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Academic Calendar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <BranchSelection 
        open={showBranchSelection} 
        onOpenChange={setShowBranchSelection}
        userRole="student"
        onSelection={handleBranchSelection}
      />
      
      <AcademicCalendar open={calendarOpen} onOpenChange={setCalendarOpen} />
    </div>
  );
};

export default StudentDashboard;