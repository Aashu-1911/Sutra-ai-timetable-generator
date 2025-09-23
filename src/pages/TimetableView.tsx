import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Home, ArrowLeft, Download, Clock, Users, MapPin, Book, RefreshCw, AlertCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { DataImportService } from "@/utils/DataImportService";

interface StoredTimetable {
  filename: string;
  branch: string;
  division: string;
  year: string;
  generatedAt: string;
  timetable: {
    headers: string[];
    rows: string[][];
  };
}

interface TimetableRow {
  day: string;
  time: string;
  division?: string;
  classBatch: string;
  courseName: string;
  faculty: string;
  venue: string;
}

const TimetableView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [timetables, setTimetables] = useState<StoredTimetable[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<StoredTimetable | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  const [availableDivisions, setAvailableDivisions] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimetableRow | null>(null);
  const { toast } = useToast();

  const branch = searchParams.get('branch') || 'all';
  const division = searchParams.get('division') || 'all';

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (branch || division) {
      loadTimetables();
    }
  }, [branch, division]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Load available options
      const optionsResult = await DataImportService.getBranchesAndDivisions();
      if (optionsResult.success) {
        setAvailableBranches(optionsResult.data.branches || []);
        setAvailableDivisions(optionsResult.data.divisions || []);
      }

      // Load timetables
      await loadTimetables();
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTimetables = async () => {
    try {
      console.log('=== LOADING TIMETABLES ===');
      console.log('Branch:', branch, 'Division:', division);
      
      const result = await DataImportService.getStoredTimetables(branch || undefined, division || undefined);
      
      console.log('API Result:', result);
      
      if (result.success) {
        console.log('Timetables loaded:', result.data.length);
        console.log('First timetable:', result.data[0]);
        
        setTimetables(result.data);
        if (result.data.length > 0) {
          setSelectedTimetable(result.data[0]);
          console.log('Selected timetable:', result.data[0]);
        } else {
          setSelectedTimetable(null);
        }
      } else {
        console.error('API Error:', result.error);
        toast({
          title: "Error",
          description: result.error || "Failed to load timetables",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading timetables:', error);
      toast({
        title: "Error",
        description: "Failed to load timetables",
        variant: "destructive"
      });
    }
  };

  const handleBranchChange = (newBranch: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newBranch === "all") {
      params.delete('branch');
    } else {
      params.set('branch', newBranch);
    }
    setSearchParams(params);
  };

  const handleDivisionChange = (newDivision: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newDivision === "all") {
      params.delete('division');
    } else {
      params.set('division', newDivision);
    }
    setSearchParams(params);
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const parseSelectedTimetable = (): TimetableRow[] => {
  if (!selectedTimetable?.timetable?.rows) {
    console.log('❌ No timetable data found');
    return [];
  }
  
  console.log('🔍 PARSING DEBUG - Raw rows:', selectedTimetable.timetable.rows.length);
  
  let currentDay = ''; // Track the current day
  
  const parsed = selectedTimetable.timetable.rows.map((row, index) => {
    // Clean the day name (remove any markdown formatting)
    let cleanDay = (row[0] || '').replace(/\*\*/g, '').trim();
    
    // If day is empty, use the last known day
    if (!cleanDay && currentDay) {
      cleanDay = currentDay;
    } else if (cleanDay) {
      currentDay = cleanDay; // Update current day
    }
    
    const result = {
      day: cleanDay,
      time: row[1] || '',
      division: '',
      classBatch: row[2] || '',
      courseName: row[3] || '',
      faculty: row[4] || '',
      venue: row[5] || ''
    };
    
    // Debug first few entries
    if (index < 15) {
      console.log(`Row ${index}:`, row, '→', result);
    }
    
    return result;
  }).filter(row => {
    // Much more permissive filtering
    const hasValidContent = row.courseName && 
                           row.courseName.trim() !== '' && 
                           row.day && 
                           row.time;
    
    // Skip lunch entries and empty entries
    if (row.courseName === '**LUNCH**' || row.courseName === 'LUNCH' || row.time === '1:00-2:00') {
      console.log('🍽️ Filtering lunch:', row.day, row.time, row.courseName);
      return false;
    }
    
    // Skip completely empty entries
    if (!row.courseName || row.courseName.trim() === '') {
      console.log('❌ Filtering empty:', row);
      return false;
    }
    
    return hasValidContent;
  });
  
  console.log('✅ Parsed entries:', parsed.length);
  console.log('📊 Distribution by day:');
  days.forEach(day => {
    const dayEntries = parsed.filter(r => r.day === day);
    console.log(`   ${day}: ${dayEntries.length} entries`);
    if (dayEntries.length > 0) {
      console.log(`      Times: ${dayEntries.map(e => e.time).join(', ')}`);
      console.log(`      Courses: ${dayEntries.map(e => e.courseName).join(', ')}`);
    }
  });
  
  return parsed;
};


  const groupTimetableByDayAndTime = (timetableData: TimetableRow[]) => {
    const grouped: { [key: string]: { [key: string]: TimetableRow[] } } = {};
    
    timetableData.forEach(row => {
      if (!grouped[row.day]) {
        grouped[row.day] = {};
      }
      if (!grouped[row.day][row.time]) {
        grouped[row.day][row.time] = [];
      }
      grouped[row.day][row.time].push(row);
    });
    
    return grouped;
  };

  const timeSlots = [
    '9:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-1:00',
    '2:00-3:00', '3:00-4:00', '4:00-5:00'
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent via-secondary to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading timetables...</p>
        </div>
      </div>
    );
  }

  const timetableData = parseSelectedTimetable();
  const groupedTimetable = groupTimetableByDayAndTime(timetableData);

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
                <h1 className="text-2xl font-bold text-primary-foreground">Sutra.ai</h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={loadTimetables} variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Link to="/admin/generate-timetable">
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
        {/* Header Info and Filters */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-2">Timetable Viewer</h1>
              <p className="text-muted-foreground">View generated timetables by branch and division</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="px-3 py-1">
                <Clock className="w-4 h-4 mr-2" />
                9:00 AM - 5:00 PM
              </Badge>
              <Badge variant="secondary" className="px-3 py-1">
                <Book className="w-4 h-4 mr-2" />
                {timetables.length} Timetable(s) Available
              </Badge>
            </div>
          </div>

          {/* Filter Controls */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg text-primary">Filter Options</CardTitle>
              <CardDescription>Select branch and division to filter timetables</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-primary mb-2 block">Branch</label>
                  <Select value={branch} onValueChange={handleBranchChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {availableBranches.map((branchOption) => (
                        <SelectItem key={branchOption} value={branchOption}>
                          {branchOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-primary mb-2 block">Division</label>
                  <Select value={division} onValueChange={handleDivisionChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select division" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Divisions</SelectItem>
                      {availableDivisions.map((divisionOption) => (
                        <SelectItem key={divisionOption} value={divisionOption}>
                          Division {divisionOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {timetables.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-sm shadow-card">
            <CardContent className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-primary mb-2">No Timetables Found</h3>
              <p className="text-muted-foreground mb-4">
                {branch || division 
                  ? `No timetables have been generated for the selected filters yet.`
                  : "No timetables have been generated yet. Upload data and generate timetables first."
                }
              </p>
              <div className="space-x-2">
                <Link to="/admin">
                  <Button variant="outline">
                    Upload Data
                  </Button>
                </Link>
                <Link to="/admin/generate-timetable">
                  <Button className="bg-primary hover:bg-primary-light">
                    Generate Timetable
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Debug Info Card */}
            {selectedTimetable && (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="pt-4">
                  <div className="text-sm">
                    <strong>Debug Info:</strong> Parsed {timetableData.length} entries from {selectedTimetable.timetable.rows.length} raw rows
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timetable Selection */}
            {timetables.length > 1 && (
              <Card className="bg-card/50 backdrop-blur-sm shadow-card">
                <CardHeader>
                  <CardTitle className="text-primary">Available Timetables</CardTitle>
                  <CardDescription>Select a timetable to view</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {timetables.map((timetable, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg cursor-pointer transition-colors border-2 ${
                          selectedTimetable?.filename === timetable.filename
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card hover:bg-accent/50'
                        }`}
                        onClick={() => setSelectedTimetable(timetable)}
                      >
                        <div className="font-medium text-primary">
                          {timetable.branch} - Division {timetable.division}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Year: {timetable.year}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Generated: {new Date(timetable.generatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timetable Display */}
            {selectedTimetable && (
              <Card className="bg-card/50 backdrop-blur-sm shadow-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-primary">
                      {selectedTimetable.branch} - Division {selectedTimetable.division}
                    </CardTitle>
                    <CardDescription>
                      Year {selectedTimetable.year} | Generated: {new Date(selectedTimetable.generatedAt).toLocaleString()}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1400px]">
                      <thead className="bg-primary">
                        <tr>
                          <th className="p-4 text-primary-foreground font-semibold text-left w-32">Time</th>
                          {days.map((day) => (
                            <th key={day} className={`p-4 text-primary-foreground font-semibold text-center min-w-48 ${
                              day === 'Saturday' ? 'bg-blue-600' : day === 'Sunday' ? 'bg-red-600' : ''
                            }`}>
                              {day}
                              {day === 'Saturday' && <div className="text-xs opacity-75">Working Day</div>}
                              {day === 'Sunday' && <div className="text-xs opacity-75">Holiday</div>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {timeSlots.map((time) => (
                          <tr key={time} className="border-b border-border">
                            <td className="p-3 bg-muted/30 font-medium text-sm text-primary border-r">
                              <div className="text-center">
                                {time === '12:00-1:00' ? (
                                  <Badge variant="secondary" className="text-xs">
                                    LUNCH
                                  </Badge>
                                ) : (
                                  time
                                )}
                              </div>
                            </td>
                            {days.map((day) => {
                              // ENHANCED SLOT MATCHING - More flexible time matching
                              const daySlots = timetableData.filter(row => {
                                const dayMatch = row.day === day;
                                const timeMatch = row.time === time || 
                                                 row.time.trim() === time.trim() ||
                                                 row.time.replace(/\s/g, '') === time.replace(/\s/g, '');
                                
                                return dayMatch && timeMatch;
                              });
                              
                              // Debug logging for first few slots
                              if ((day === 'Monday' && time === '9:00-10:00') || daySlots.length > 0) {
                                console.log(`🔍 ${day} ${time}:`, {
                                  found: daySlots.length,
                                  allDayEntries: timetableData.filter(r => r.day === day).length,
                                  dayTimes: [...new Set(timetableData.filter(r => r.day === day).map(r => r.time))],
                                  lookingFor: time
                                });
                              }
                              
                              // Handle Sunday (Holiday)
                              if (day === 'Sunday') {
                                return (
                                  <td key={`${day}-${time}`} className="p-3 h-20">
                                    <div className="h-full bg-red-50 rounded border border-red-200 flex items-center justify-center">
                                      <span className="text-red-600 text-sm font-medium">HOLIDAY</span>
                                    </div>
                                  </td>
                                );
                              }
                              
                              // Handle Lunch Break
                              if (time === '12:00-1:00') {
                                return (
                                  <td key={`${day}-${time}`} className="p-3 h-20">
                                    <div className="h-full bg-orange-50 rounded border border-orange-200 flex items-center justify-center">
                                      <span className="text-orange-600 text-sm font-medium">LUNCH BREAK</span>
                                    </div>
                                  </td>
                                );
                              }
                              
                              // Handle Free Period
                              if (daySlots.length === 0) {
                                return (
                                  <td key={`${day}-${time}`} className="p-3 h-20">
                                    <div className={`h-full rounded border-2 border-dashed flex items-center justify-center ${
                                      day === 'Saturday' ? 'bg-blue-25 border-blue-200' : 'bg-gray-50 border-gray-200'
                                    }`}>
                                      <span className="text-gray-400 text-xs">Free Period</span>
                                    </div>
                                  </td>
                                );
                              }

                              // Show the session
                              const mainSlot = daySlots[0];
                              
                              // Determine session type and colors
                              const getSessionStyle = (courseName: string) => {
                                if (courseName.includes('LIBRARY')) {
                                  return 'bg-purple-50 border-purple-200 hover:bg-purple-100';
                                } else if (courseName.includes('PROJECT')) {
                                  return 'bg-orange-50 border-orange-200 hover:bg-orange-100';
                                } else if (courseName.includes('LAB')) {
                                  return 'bg-green-50 border-green-200 hover:bg-green-100';
                                } else {
                                  return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
                                }
                              };

                              const getSessionType = (courseName: string) => {
                                if (courseName.includes('LIBRARY')) return 'Library';
                                if (courseName.includes('PROJECT')) return 'Project';
                                if (courseName.includes('LAB')) return 'Lab';
                                return 'Theory';
                              };

                              const getSessionBadgeColor = (sessionType: string) => {
                                switch (sessionType) {
                                  case 'Lab': return 'bg-green-100 text-green-800';
                                  case 'Library': return 'bg-purple-100 text-purple-800';
                                  case 'Project': return 'bg-orange-100 text-orange-800';
                                  default: return 'bg-blue-100 text-blue-800';
                                }
                              };
                              
                              return (
                                <td key={`${day}-${time}`} className="p-3 h-20">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <div 
                                        className={`h-full p-3 rounded cursor-pointer transition-all duration-200 shadow-sm ${getSessionStyle(mainSlot.courseName)}`}
                                        onClick={() => setSelectedSlot(mainSlot)}
                                      >
                                        <div className="flex flex-col h-full justify-between">
                                          <div>
                                            <div className="font-semibold text-sm truncate">
                                              {mainSlot.courseName}
                                            </div>
                                            <div className="text-xs truncate opacity-75">
                                              {mainSlot.faculty}
                                            </div>
                                            <div className="text-xs truncate opacity-75">
                                              {mainSlot.venue}
                                            </div>
                                          </div>
                                          <div className="flex justify-between items-end">
                                            {mainSlot.classBatch && (
                                              <Badge className="text-xs bg-blue-100 text-blue-800 w-fit">
                                                {mainSlot.classBatch}
                                              </Badge>
                                            )}
                                            {daySlots.length > 1 && (
                                              <Badge className="text-xs bg-green-100 text-green-800 w-fit">
                                                +{daySlots.length - 1} more
                                              </Badge>
                                            )}
                                            <Badge className={`text-xs w-fit ${getSessionBadgeColor(getSessionType(mainSlot.courseName))}`}>
                                              {getSessionType(mainSlot.courseName)}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle className="flex items-center space-x-2">
                                          <Badge className={getSessionBadgeColor(getSessionType(mainSlot.courseName))}>
                                            {getSessionType(mainSlot.courseName)}
                                          </Badge>
                                          <span>{mainSlot.courseName}</span>
                                        </DialogTitle>
                                        <DialogDescription>
                                          {day} at {time}
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                              <Users className="w-4 h-4 text-muted-foreground" />
                                              <span className="text-sm font-medium">Faculty:</span>
                                            </div>
                                            <p className="text-sm pl-6">{mainSlot.faculty}</p>
                                          </div>
                                          <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                              <MapPin className="w-4 h-4 text-muted-foreground" />
                                              <span className="text-sm font-medium">Venue:</span>
                                            </div>
                                            <p className="text-sm pl-6">{mainSlot.venue}</p>
                                          </div>
                                        </div>
                                        
                                        {mainSlot.classBatch && (
                                          <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                              <Users className="w-4 h-4 text-muted-foreground" />
                                              <span className="text-sm font-medium">Class/Batch:</span>
                                            </div>
                                            <p className="text-sm pl-6">{mainSlot.classBatch}</p>
                                          </div>
                                        )}

                                        <div className="space-y-2">
                                          <div className="flex items-center space-x-2">
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">Schedule:</span>
                                          </div>
                                          <p className="text-sm pl-6">{day} | {time}</p>
                                        </div>

                                        {daySlots.length > 1 && (
                                          <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                              <Book className="w-4 h-4 text-muted-foreground" />
                                              <span className="text-sm font-medium">Multiple Sessions:</span>
                                            </div>
                                            <div className="pl-6 space-y-1">
                                              {daySlots.map((slot, index) => (
                                                <div key={index} className="text-sm">
                                                  {slot.courseName} - {slot.faculty} ({slot.classBatch})
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
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
            )}

            {/* Statistics */}
            {selectedTimetable && timetableData.length > 0 && (
              <Card className="bg-card/50 backdrop-blur-sm shadow-card">
                <CardHeader>
                  <CardTitle className="text-primary">Weekly Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-6 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {timetableData.filter(slot => slot.courseName && slot.courseName !== '').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {timetableData.filter(slot => slot.courseName && !slot.courseName.includes('LAB') && !slot.courseName.includes('LIBRARY') && !slot.courseName.includes('PROJECT') && slot.courseName !== 'HOLIDAY').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Theory Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {timetableData.filter(slot => slot.courseName && slot.courseName.includes('LAB')).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Lab Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {timetableData.filter(slot => slot.courseName && slot.courseName.includes('LIBRARY')).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Library Hours</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {timetableData.filter(slot => slot.courseName && slot.courseName.includes('PROJECT')).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Project Hours</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {new Set(timetableData.map(slot => slot.faculty).filter(faculty => faculty && faculty !== '')).size}
                      </div>
                      <div className="text-sm text-muted-foreground">Faculty Members</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimetableView;
