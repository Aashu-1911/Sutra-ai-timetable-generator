import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, MessageSquare, Plus, Eye, Edit, Home, Bell, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { AcademicCalendar } from "@/components/ui/academic-calendar";
import { DataImportService } from "@/utils/dataImportService";

const AdminDashboard = () => {
  const { toast } = useToast();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, faculty: "Dr. Smith", message: "Not available Monday 10-11 AM", time: "2 hours ago", status: "unread" },
    { id: 2, faculty: "Prof. Johnson", message: "Lab unavailable Friday afternoon", time: "5 hours ago", status: "read" },
    { id: 3, faculty: "Dr. Williams", message: "Requesting schedule change for Tuesday", time: "1 day ago", status: "unread" },
  ]);

  const handleMarkDone = (messageId: number) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, status: "resolved" as const }
        : msg
    ));
    
    const message = messages.find(m => m.id === messageId);
    toast({
      title: "Request Resolved",
      description: `Marked ${message?.faculty}'s request as done. Faculty has been notified.`,
    });
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await DataImportService.importFile(file);
      if (result.success) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${result.recordCount} records from ${file.name}`,
        });
      } else {
        toast({
          title: "Import Failed",
          description: result.error || "Failed to import data",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import Error",
        description: "An error occurred while importing the file",
        variant: "destructive",
      });
    }

    // Reset file input
    event.target.value = '';
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
              <Badge variant="secondary" className="bg-primary-foreground/10 text-primary-foreground">
                Admin Panel
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
          <h1 className="text-4xl font-bold text-primary mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage timetables and faculty communications</p>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Integrate Data */}
          <Card className="bg-card/50 backdrop-blur-sm shadow-card hover:shadow-elegant transition-all duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-primary">Integrate College Data</CardTitle>
                  <CardDescription>Import faculty, subjects and room data</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileImport}
                className="hidden"
                id="data-import"
              />
              <label htmlFor="data-import">
                <Button className="w-full justify-start bg-primary hover:bg-primary-light cursor-pointer" asChild>
                  <span>
                    <Plus className="w-4 h-4 mr-2" />
                    Import Data
                  </span>
                </Button>
              </label>
            </CardContent>
          </Card>
          {/* Generate Timetable */}
          <Card className="bg-card/50 backdrop-blur-sm shadow-card hover:shadow-elegant transition-all duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-primary">Generate Timetable</CardTitle>
                  <CardDescription>Create new academic schedules</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/admin/generate-timetable">
                <Button className="w-full justify-start bg-primary hover:bg-primary-light">
                  <Plus className="w-4 h-4 mr-2" />
                  Generate New Timetable
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <Eye className="w-4 h-4 mr-2" />
                View Existing Timetables
              </Button>
            </CardContent>
          </Card>

          {/* Faculty Inbox */}
          <Card className="bg-card/50 backdrop-blur-sm shadow-card hover:shadow-elegant transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-light to-primary-lighter rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-primary">Faculty Inbox</CardTitle>
                    <CardDescription>Messages from faculty members</CardDescription>
                  </div>
                </div>
                <Badge variant="destructive" className="bg-destructive">
                  {messages.filter(m => m.status === 'unread').length} New
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`p-3 rounded-lg border transition-colors ${
                      msg.status === 'unread' 
                        ? 'bg-accent border-primary/20' 
                        : msg.status === 'resolved'
                        ? 'bg-primary/5 border-primary/30'
                        : 'bg-muted/50 border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-primary">{msg.faculty}</span>
                        {msg.status === 'resolved' && (
                          <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{msg.time}</span>
                    </div>
                    <p className="text-sm text-foreground mb-2">{msg.message}</p>
                    {msg.status !== 'resolved' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleMarkDone(msg.id)}
                        className="bg-primary hover:bg-primary-light text-primary-foreground"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Mark Done
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/30 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Programs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">8</div>
              <p className="text-xs text-muted-foreground">B.Ed, M.Ed, FYUP, ITEP</p>
            </CardContent>
          </Card>
          <Card className="bg-card/30 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Active Faculty</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">45</div>
              <p className="text-xs text-muted-foreground">Across all departments</p>
            </CardContent>
          </Card>
          <Card className="bg-card/30 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">1,250</div>
              <p className="text-xs text-muted-foreground">Enrolled this semester</p>
            </CardContent>
          </Card>
          <Card className="bg-card/30 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Timetables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">12</div>
              <p className="text-xs text-muted-foreground">Generated this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-card/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-primary">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Button variant="outline" className="justify-start border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <Users className="w-4 h-4 mr-2" />
                Manage Faculty
              </Button>
              <Button 
                variant="outline" 
                className="justify-start border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => setCalendarOpen(true)}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Academic Calendar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <AcademicCalendar open={calendarOpen} onOpenChange={setCalendarOpen} />
    </div>
  );
};

export default AdminDashboard;