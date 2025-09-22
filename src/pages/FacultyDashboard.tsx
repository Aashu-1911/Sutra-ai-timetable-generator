import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Home, MessageSquare, Clock, Send, Settings, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { BranchSelection } from "@/components/ui/branch-selection";
import { AcademicCalendar } from "@/components/ui/academic-calendar";

const FacultyDashboard = () => {
  const [message, setMessage] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [showBranchSelection, setShowBranchSelection] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { toast } = useToast();

  const handleBranchSelection = (year: string, branch: string, division?: string) => {
    setSelectedYear(year);
    setSelectedBranch(branch);
    setSelectedDivision(division || "");
    setShowBranchSelection(false);
  };

  // Sample timetable data
  const weeklySchedule = [
    { day: "Monday", slots: [
      { time: "9:00-10:00", subject: "Mathematics", class: "B.Ed Sem 2", type: "theory" },
      { time: "10:00-11:00", subject: "Educational Psychology", class: "B.Ed Sem 4", type: "theory" },
      { time: "2:00-4:00", subject: "Teaching Practice", class: "B.Ed Sem 6", type: "practical" }
    ]},
    { day: "Tuesday", slots: [
      { time: "9:00-10:00", subject: "Mathematics", class: "M.Ed Sem 1", type: "theory" },
      { time: "11:00-12:00", subject: "Research Methodology", class: "M.Ed Sem 2", type: "theory" }
    ]},
    { day: "Wednesday", slots: [
      { time: "10:00-11:00", subject: "Educational Psychology", class: "B.Ed Sem 2", type: "theory" },
      { time: "2:00-4:00", subject: "Math Lab", class: "B.Ed Sem 4", type: "practical" }
    ]},
    { day: "Thursday", slots: [
      { time: "9:00-10:00", subject: "Mathematics", class: "B.Ed Sem 2", type: "theory" },
      { time: "11:00-12:00", subject: "Educational Statistics", class: "M.Ed Sem 1", type: "theory" }
    ]},
    { day: "Friday", slots: [
      { time: "9:00-10:00", subject: "Research Methodology", class: "M.Ed Sem 2", type: "theory" },
      { time: "2:00-4:00", subject: "Teaching Practice", class: "B.Ed Sem 6", type: "practical" }
    ]}
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      toast({
        title: "Message Sent",
        description: "Your availability message has been sent to admin.",
      });
      setMessage("");
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
              <Badge variant="secondary" className="bg-primary-light text-primary-foreground">
                Faculty Portal
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
          <h1 className="text-4xl font-bold text-primary mb-2">Faculty Dashboard</h1>
          <p className="text-muted-foreground">Welcome, Dr. Vaishali Wangikar - Data Science Department</p>
          {selectedBranch && (
            <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary">
              Year {selectedYear} - {selectedBranch}
            </Badge>
          )}
        </div>

        {/* Weekly Schedule */}
        <Card className="bg-card/50 backdrop-blur-sm shadow-card mb-8">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-primary">Weekly Schedule</CardTitle>
                <CardDescription>Your current timetable for this week</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 min-w-[800px]">
                {weeklySchedule.map((day) => (
                  <Card key={day.day} className="bg-accent/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-primary text-center">{day.day}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
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
                            <div className="text-foreground font-medium">{slot.subject}</div>
                            <div className="text-muted-foreground text-xs">{slot.class}</div>
                            <Badge 
                              variant={slot.type === 'practical' ? 'secondary' : 'outline'}
                              className="mt-2 text-xs"
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

        <div className="grid md:grid-cols-3 gap-6">
          {/* Timetable Management */}
          <Card className="bg-card/50 backdrop-blur-sm shadow-card">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary-light rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-primary">Timetable Management</CardTitle>
                  <CardDescription>Request changes to your timetable</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <Edit className="w-4 h-4 mr-2" />
                Request Schedule Change
              </Button>
              <Button variant="outline" className="w-full justify-start border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <Calendar className="w-4 h-4 mr-2" />
                Mark Unavailable Slots
              </Button>
            </CardContent>
          </Card>

          {/* Message Admin */}
          <Card className="bg-card/50 backdrop-blur-sm shadow-card">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-light to-primary-lighter rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-primary">Message Admin</CardTitle>
                  <CardDescription>Inform about unavailability or schedule changes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Type your message here... (e.g., Not available Monday 2-3 PM due to meeting)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px]"
              />
              <Button 
                onClick={handleSendMessage}
                className="w-full bg-primary hover:bg-primary-light"
                disabled={!message.trim()}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </CardContent>
          </Card>

          {/* Schedule Summary */}
          <Card className="bg-card/50 backdrop-blur-sm shadow-card">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-lighter to-secondary rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-primary">Schedule Summary</CardTitle>
                  <CardDescription>This week's overview</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">18</div>
                  <div className="text-sm text-muted-foreground">Total Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-light">12</div>
                  <div className="text-sm text-muted-foreground">Theory Classes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-lighter">6</div>
                  <div className="text-sm text-muted-foreground">Lab Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">5</div>
                  <div className="text-sm text-muted-foreground">Different Classes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <BranchSelection 
        open={showBranchSelection} 
        onOpenChange={setShowBranchSelection}
        userRole="faculty"
        onSelection={handleBranchSelection}
      />
      
      <AcademicCalendar open={calendarOpen} onOpenChange={setCalendarOpen} />
    </div>
  );
};

export default FacultyDashboard;