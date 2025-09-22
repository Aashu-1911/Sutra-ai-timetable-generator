import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Home, ArrowLeft, Download, Clock, Users, MapPin, Book } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { generateTimetable, formatTimeSlot, getSlotColor, getTypeColor } from "@/utils/timetableGenerator";
import { teachers, timeSlots, type TimetableSlot, type DaySchedule } from "@/data/timetableData";

const TimetableView = () => {
  const [searchParams] = useSearchParams();
  const [timetable, setTimetable] = useState<DaySchedule[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null);
  
  const branch = searchParams.get('branch') || 'computer-eng';
  const division = searchParams.get('division') || 'div-a';
  
  const branches = [
    { value: "computer-eng", label: "Computer Engineering" },
    { value: "computer-software", label: "Computer Engineering (Software)" },
    { value: "aiml", label: "AIML (Artificial Intelligence & Machine Learning)" },
    { value: "ds", label: "DS (Data Science)" },
    { value: "entc", label: "ENTC (Electronics & Telecommunication)" },
    { value: "it", label: "IT (Information Technology)" },
    { value: "mechanical", label: "Mechanical Engineering" },
    { value: "chemical", label: "Chemical Engineering" },
    { value: "civil", label: "Civil Engineering" }
  ];
  
  const divisions = [
    { value: "div-a", label: "Division A" },
    { value: "div-b", label: "Division B" },
    { value: "div-c", label: "Division C" }
  ];

  useEffect(() => {
    const generatedTimetable = generateTimetable(branch, division);
    setTimetable(generatedTimetable);
  }, [branch, division]);

  const getBranchLabel = () => branches.find(b => b.value === branch)?.label || 'Computer Engineering';
  const getDivisionLabel = () => divisions.find(d => d.value === division)?.label || 'Division A';

  const getTeacherDetails = (teacherShort: string, courseShort: string) => {
    return teachers.find(t => t.shortForm === teacherShort && t.courseShort === courseShort);
  };

  const classSlots = timeSlots.filter(slot => slot.type === 'class');

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent via-secondary to-muted">
      {/* Header */}
      <header className="bg-primary shadow-elegant">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-primary-foreground">Timetable AI</h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/timetable-generator">
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Generator
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Header Info */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-2">Weekly Timetable</h1>
              <div className="flex items-center space-x-4 text-muted-foreground">
                <span className="text-lg">{getBranchLabel()}</span>
                <span>•</span>
                <span className="text-lg">{getDivisionLabel()}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="px-3 py-1">
                <Clock className="w-4 h-4 mr-2" />
                8:30 AM - 4:50 PM
              </Badge>
              <Badge variant="secondary" className="px-3 py-1">
                <Book className="w-4 h-4 mr-2" />
                {classSlots.length} Slots/Day
              </Badge>
            </div>
          </div>
        </div>

        {/* Legend */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-primary">Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm">Theory (55 min)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm">Lab (110 min)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-sm">Library</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-sm">Project</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timetable Grid */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-primary">
                  <tr>
                    <th className="p-4 text-primary-foreground font-semibold text-left w-24">Time</th>
                    {timetable.map((day) => (
                      <th key={day.day} className="p-4 text-primary-foreground font-semibold text-center min-w-48">
                        {day.day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {classSlots.map((timeSlot, timeIndex) => (
                    <tr key={timeSlot.id} className="border-b border-border">
                      <td className="p-2 bg-muted/30 font-medium text-sm text-primary border-r">
                        <div className="text-center">
                          <div>{timeSlot.startTime}</div>
                          <div className="text-xs text-muted-foreground">to</div>
                          <div>{timeSlot.endTime}</div>
                        </div>
                      </td>
                      {timetable.map((day) => {
                        const slot = day.slots[timeIndex];
                        if (!slot) {
                          return (
                            <td key={`${day.day}-${timeIndex}`} className="p-2 h-20">
                              <div className="h-full bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">Free</span>
                              </div>
                            </td>
                          );
                        }
                        
                        return (
                          <td key={`${day.day}-${timeIndex}`} className="p-2 h-20">
                            <Dialog>
                              <DialogTrigger asChild>
                                <div 
                                  className={`h-full p-2 rounded cursor-pointer transition-all duration-200 ${getSlotColor(slot.type)} shadow-sm`}
                                  onClick={() => setSelectedSlot(slot)}
                                >
                                  <div className="flex flex-col h-full justify-between">
                                    <div>
                                      <div className="font-semibold text-sm">{slot.teacher} - {slot.course}</div>
                                      <div className="text-xs text-muted-foreground mt-1">{slot.room}</div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                      <Badge className={`text-xs px-2 py-0.5 ${getTypeColor(slot.type)}`}>
                                        {slot.type}
                                      </Badge>
                                      {slot.batches && (
                                        <div className="flex space-x-1">
                                          {slot.batches.slice(0, 2).map((batch) => (
                                            <span key={batch} className="text-xs bg-white/50 px-1 rounded">
                                              {batch}
                                            </span>
                                          ))}
                                          {slot.batches.length > 2 && (
                                            <span className="text-xs bg-white/50 px-1 rounded">+{slot.batches.length - 2}</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="flex items-center space-x-2">
                                    <Badge className={getTypeColor(slot.type)}>{slot.type}</Badge>
                                    <span>{slot.course}</span>
                                  </DialogTitle>
                                  <DialogDescription>
                                    Detailed information about this session
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <Users className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Faculty:</span>
                                      </div>
                                      <p className="text-sm pl-6">
                                        {getTeacherDetails(slot.teacher, slot.course)?.name || 'Unknown Faculty'}
                                      </p>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Room:</span>
                                      </div>
                                      <p className="text-sm pl-6">{slot.room}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <Clock className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-sm font-medium">Duration:</span>
                                    </div>
                                    <p className="text-sm pl-6">
                                      {slot.type === 'LAB' ? '110 minutes (2 slots)' : '55 minutes (1 slot)'}
                                    </p>
                                  </div>

                                  {slot.batches && (
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <Users className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Batches:</span>
                                      </div>
                                      <div className="pl-6 flex flex-wrap gap-2">
                                        {slot.batches.map((batch) => (
                                          <Badge key={batch} variant="outline" className="text-xs">
                                            {batch}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <Book className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-sm font-medium">Full Course Name:</span>
                                    </div>
                                    <p className="text-sm pl-6">
                                      {getTeacherDetails(slot.teacher, slot.course)?.course || slot.course}
                                    </p>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-primary">Weekly Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {timetable.reduce((acc, day) => acc + day.slots.filter(slot => slot?.type === 'TH').length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Theory Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {timetable.reduce((acc, day) => acc + day.slots.filter(slot => slot?.type === 'LAB').length, 0) / 2}
                </div>
                <div className="text-sm text-muted-foreground">Lab Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {timetable.reduce((acc, day) => acc + day.slots.filter(slot => slot?.type === 'LIBRARY').length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Library Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {timetable.reduce((acc, day) => acc + day.slots.filter(slot => slot?.type === 'PROJECT').length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Project Hours</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TimetableView;