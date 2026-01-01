import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Home, BookOpen, Clock, MapPin, Download, AlertCircle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { BranchSelection } from "@/components/ui/branch-selection";
import { AcademicCalendar } from "@/components/ui/academic-calendar";
import { useToast } from "@/hooks/use-toast";
import { DataImportService } from "@/utils/DataImportService";

interface TimetableEntry {
  day: string;
  time: string;
  courseName: string;
  faculty: string;
  venue: string;
  classBatch: string;
}

interface DaySchedule {
  day: string;
  slots: {
    time: string;
    subject: string;
    faculty: string;
    room: string;
    type: string;
    batch?: string;
  }[];
}

const StudentDashboard = () => {
  const [showBranchSelection, setShowBranchSelection] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [studentSchedule, setStudentSchedule] = useState<DaySchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timetableStats, setTimetableStats] = useState({
    totalClasses: 0,
    theoryHours: 0,
    labHours: 0,
    libraryHours: 0,
    projectHours: 0
  });
  const { toast } = useToast();

  const studentInfo = {
    name: "Student",
    program: "B.Tech",
    semester: `Year ${selectedYear}`,
    rollNo: "2023001",
    batch: `${selectedBranch} - Division ${selectedDivision}`
  };

  const handleBranchSelection = (year: string, branch: string, division?: string) => {
    setSelectedYear(year);
    setSelectedBranch(branch);
    setSelectedDivision(division || "");
    setShowBranchSelection(false);
    
    // Load timetable for selected branch and division
    if (branch && division) {
      loadStudentTimetable(branch, division);
    }
  };

  const loadStudentTimetable = async (branch: string, division: string) => {
    setIsLoading(true);
    try {
      console.log(`Loading timetable for ${branch} Division ${division}`);
      
      // Get stored timetables for the specific branch and division
      const result = await DataImportService.getStoredTimetables(branch, division);
      
      if (result.success && result.data.length > 0) {
        // Use the most recent timetable
        const latestTimetable = result.data[0];
        console.log('Loaded timetable:', latestTimetable);
        
        // Convert timetable data to student schedule format
        const convertedSchedule = convertTimetableToSchedule(latestTimetable.timetable);
        setStudentSchedule(convertedSchedule);
        
        // Calculate statistics
        calculateTimetableStats(latestTimetable.timetable);
        
        toast({
          title: "Timetable Loaded",
          description: `Loaded timetable for ${branch} Division ${division}`,
        });
      } else {
        console.log('No timetables found for this branch/division');
        setStudentSchedule([]);
        toast({
          title: "No Timetable Found",
          description: `No timetable available for ${branch} Division ${division}. Please contact admin.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading timetable:', error);
      toast({
        title: "Error",
        description: "Failed to load timetable. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const convertTimetableToSchedule = (timetableData: any): DaySchedule[] => {
    if (!timetableData || !timetableData.rows) return [];

    const daysMap: { [key: string]: DaySchedule } = {};
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Initialize days
    daysOrder.forEach(day => {
      daysMap[day] = { day, slots: [] };
    });

    // Process timetable rows
    timetableData.rows.forEach((row: string[]) => {
      if (row.length >= 6) {
        const [day, time, classBatch, courseName, faculty, venue] = row;
        
        // Clean day name (remove markdown formatting)
        const cleanDay = day.replace(/\*\*/g, '').trim();
        
        // Skip lunch and holiday entries
        if (courseName === 'LUNCH' || courseName === 'HOLIDAY' || time === '12:00-1:00') {
          return;
        }

        // Determine type
        let type = 'theory';
        if (courseName.includes('LAB')) type = 'lab';
        else if (courseName.includes('LIBRARY')) type = 'library';
        else if (courseName.includes('PROJECT')) type = 'project';

        if (daysMap[cleanDay]) {
          daysMap[cleanDay].slots.push({
            time,
            subject: courseName,
            faculty,
            room: venue,
            type,
            batch: classBatch
          });
        }
      }
    });

    // Sort slots by time for each day
    Object.values(daysMap).forEach(day => {
      day.slots.sort((a, b) => a.time.localeCompare(b.time));
    });

    return daysOrder.map(day => daysMap[day]).filter(day => day.slots.length > 0);
  };

  const calculateTimetableStats = (timetableData: any) => {
    if (!timetableData || !timetableData.rows) return;

    let totalClasses = 0;
    let theoryHours = 0;
    let labHours = 0;
    let libraryHours = 0;
    let projectHours = 0;

    timetableData.rows.forEach((row: string[]) => {
      if (row.length >= 4) {
        const courseName = row[3];
        
        if (courseName && courseName !== 'LUNCH' && courseName !== 'HOLIDAY') {
          totalClasses++;
          
          if (courseName.includes('LAB')) {
            labHours++;
          } else if (courseName.includes('LIBRARY')) {
            libraryHours++;
          } else if (courseName.includes('PROJECT')) {
            projectHours++;
          } else {
            theoryHours++;
          }
        }
      }
    });

    setTimetableStats({
      totalClasses,
      theoryHours,
      labHours,
      libraryHours,
      projectHours
    });
  };

  const handleRefreshTimetable = () => {
    if (selectedBranch && selectedDivision) {
      loadStudentTimetable(selectedBranch, selectedDivision);
    }
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
              <Button 
                onClick={handleRefreshTimetable}
                variant="ghost" 
                size="sm" 
                className="text-primary-foreground hover:bg-primary-foreground/10"
                disabled={!selectedBranch || !selectedDivision || isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
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
                <span className="text-muted-foreground text-sm">Year</span>
                <div className="font-medium text-primary">{studentInfo.semester}</div>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Branch & Division</span>
                <div className="font-medium text-primary">{studentInfo.batch}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timetable Loading/Empty State */}
        {isLoading && (
          <Card className="bg-card/50 backdrop-blur-sm shadow-card mb-8">
            <CardContent className="text-center py-12">
              <RefreshCw className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-primary mb-2">Loading Timetable...</h3>
              <p className="text-muted-foreground">Please wait while we fetch your schedule.</p>
            </CardContent>
          </Card>
        )}

        {/* No Timetable State */}
        {!isLoading && selectedBranch && selectedDivision && studentSchedule.length === 0 && (
          <Card className="bg-card/50 backdrop-blur-sm shadow-card mb-8">
            <CardContent className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-primary mb-2">No Timetable Available</h3>
              <p className="text-muted-foreground mb-4">
                No timetable has been generated for {selectedBranch} Division {selectedDivision} yet.
              </p>
              <Button onClick={handleRefreshTimetable} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Weekly Timetable */}
        {!isLoading && studentSchedule.length > 0 && (
          <Card className="bg-card/50 backdrop-blur-sm shadow-card mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-primary">Weekly Timetable</CardTitle>
                  <CardDescription>Your class schedule for {selectedBranch} Division {selectedDivision}</CardDescription>
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
                                slot.type === 'lab' 
                                  ? 'bg-green-50 border border-green-200' 
                                  : slot.type === 'library'
                                  ? 'bg-purple-50 border border-purple-200'
                                  : slot.type === 'project'
                                  ? 'bg-orange-50 border border-orange-200'
                                  : 'bg-blue-50 border border-blue-200'
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
                              <div className="flex justify-between items-center">
                                <Badge 
                                  variant={slot.type === 'lab' ? 'secondary' : 'outline'}
                                  className={`text-xs ${
                                    slot.type === 'lab' ? 'bg-green-100 text-green-800' :
                                    slot.type === 'library' ? 'bg-purple-100 text-purple-800' :
                                    slot.type === 'project' ? 'bg-orange-100 text-orange-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {slot.type}
                                </Badge>
                                {slot.batch && (
                                  <Badge variant="outline" className="text-xs">
                                    {slot.batch}
                                  </Badge>
                                )}
                              </div>
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
        )}

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
                <span className="font-medium text-primary">{timetableStats.totalClasses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Theory Hours:</span>
                <span className="font-medium text-blue-600">{timetableStats.theoryHours}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lab Hours:</span>
                <span className="font-medium text-green-600">{timetableStats.labHours}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Library Hours:</span>
                <span className="font-medium text-purple-600">{timetableStats.libraryHours}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Project Hours:</span>
                <span className="font-medium text-orange-600">{timetableStats.projectHours}</span>
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
