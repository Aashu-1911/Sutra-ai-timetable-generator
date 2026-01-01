
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Home, Plus, Eye, Edit, ArrowLeft, Zap, Download } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { DataImportService } from "@/utils/DataImportService";

interface TimetableData {
  headers: string[];
  rows: string[][];
}

const TimetableGenerator = () => {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [theoryLectureTime, setTheoryLectureTime] = useState("");
  const [labTime, setLabTime] = useState("");
  const [shortBreaks, setShortBreaks] = useState("");
  const [longBreaks, setLongBreaks] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTimetable, setGeneratedTimetable] = useState<TimetableData | null>(null);
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  const [availableDivisions, setAvailableDivisions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const years = [
    { value: "1", label: "First Year" },
    { value: "2", label: "Second Year" },
    { value: "3", label: "Third Year" },
    { value: "4", label: "Fourth Year" }
  ];

  const theoryTimes = [
    { value: "45", label: "45 minutes" },
    { value: "50", label: "50 minutes" },
    { value: "55", label: "55 minutes" },
    { value: "60", label: "60 minutes" }
  ];

  const labTimes = [
    { value: "90", label: "90 minutes" },
    { value: "110", label: "110 minutes" },
    { value: "120", label: "120 minutes" },
    { value: "180", label: "180 minutes" }
  ];

  const breakOptions = [
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" }
  ];

  // Load available branches and divisions on component mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setIsLoading(true);
        const result = await DataImportService.getBranchesAndDivisions();
        if (result.success) {
          setAvailableBranches(result.data.branches || []);
          setAvailableDivisions(result.data.divisions || []);
        } else {
          toast({
            title: "Warning",
            description: "Could not load available options. Please upload data first.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error loading options:', error);
        toast({
          title: "Error",
          description: "Failed to load available options.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadOptions();
  }, [toast]);

const handleGenerateTimetable = async () => {
  if (!selectedYear || !selectedBranch || !selectedDivision || !theoryLectureTime || !labTime || !shortBreaks || !longBreaks) {
    toast({
      title: "Complete Form Required",
      description: "Please fill all fields to generate timetable.",
      variant: "destructive"
    });
    return;
  }

  setIsGenerating(true);
  console.log('🎯 Starting timetable generation with params:', {
    year: selectedYear,
    branch: selectedBranch,
    division: selectedDivision,
    theoryDuration: parseInt(theoryLectureTime),
    labDuration: parseInt(labTime),
    shortBreaks: parseInt(shortBreaks),
    longBreaks: parseInt(longBreaks)
  });
  
  try {
    const params = {
      year: selectedYear,
      branch: selectedBranch,
      division: selectedDivision,
      theoryDuration: parseInt(theoryLectureTime),
      labDuration: parseInt(labTime),
      shortBreaks: parseInt(shortBreaks),
      longBreaks: parseInt(longBreaks)
    };

    console.log('🔄 Calling DataImportService.generateTimetable...');
    const result = await DataImportService.generateTimetable(params);
    console.log('✅ Generation result:', result);
    
    if (result.success) {
      setGeneratedTimetable(result.data.timetable);
      toast({
        title: "Timetable Generated Successfully!",
        description: `Complete timetable created for ${selectedBranch} Division ${selectedDivision} with ${result.data.timetable?.rows?.length || 0} entries.`,
      });
      
      // Auto-navigate to view the timetable
      setTimeout(() => {
        navigate(`/timetable-view?branch=${selectedBranch}&division=${selectedDivision}`);
      }, 2000);
      
    } else {
      throw new Error(result.error || 'Generation failed');
    }
  } catch (error) {
    console.error('❌ Timetable generation error:', error);
    toast({
      title: "Generation Failed",
      description: error.message || "An error occurred while generating the timetable.",
      variant: "destructive"
    });
  } finally {
    setIsGenerating(false);
  }
};


  const handleViewExisting = async () => {
    if (!selectedBranch || !selectedDivision) {
      toast({
        title: "Selection Required",
        description: "Please select both branch and division to view timetables.",
        variant: "destructive"
      });
      return;
    }

    navigate(`/timetable-view?branch=${selectedBranch}&division=${selectedDivision}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent via-secondary to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading available options...</p>
        </div>
      </div>
    );
  }

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
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Admin
                </Button>
              </Link>
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
          <h1 className="text-4xl font-bold text-primary mb-2">Timetable Generator</h1>
          <p className="text-muted-foreground">Create optimized, NEP 2020 compliant timetables with AI</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Selection Panel */}
          <Card className="bg-card/50 backdrop-blur-sm shadow-card">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-primary">Generate New Timetable</CardTitle>
                  <CardDescription>Select branch and division to create AI-optimized schedule</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-primary mb-2 block">Select Year</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-primary mb-2 block">Select Branch</label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBranches.length > 0 ? (
                      availableBranches.map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-data" disabled>No branches available - Upload data first</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-primary mb-2 block">Select Division</label>
                <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a division" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDivisions.length > 0 ? (
                      availableDivisions.map((division) => (
                        <SelectItem key={division} value={division}>
                          Division {division}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-data" disabled>No divisions available - Upload data first</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-primary mb-2 block">Theory Lecture Time</label>
                  <Select value={theoryLectureTime} onValueChange={setTheoryLectureTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {theoryTimes.map((time) => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-primary mb-2 block">Lab Time</label>
                  <Select value={labTime} onValueChange={setLabTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {labTimes.map((time) => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-primary mb-2 block">No. of Short Breaks</label>
                  <Select value={shortBreaks} onValueChange={setShortBreaks}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select count" />
                    </SelectTrigger>
                    <SelectContent>
                      {breakOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-primary mb-2 block">No. of Long Breaks</label>
                  <Select value={longBreaks} onValueChange={setLongBreaks}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select count" />
                    </SelectTrigger>
                    <SelectContent>
                      {breakOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col space-y-3 pt-4">
                <Button 
                  onClick={handleGenerateTimetable}
                  disabled={isGenerating || availableBranches.length === 0}
                  className="bg-primary hover:bg-primary-light"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                      Generating with AI...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Generate New Timetable
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={handleViewExisting}
                  disabled={availableBranches.length === 0}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Existing Timetables
                </Button>
                
                <Button 
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  disabled={availableBranches.length === 0}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modify Existing Timetable
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Features Panel - Keep existing */}
          <Card className="bg-card/50 backdrop-blur-sm shadow-card">
            <CardHeader>
              <CardTitle className="text-primary">AI-Powered Features</CardTitle>
              <CardDescription>Advanced timetable optimization capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    title: "Conflict Detection",
                    description: "Automatically prevents faculty and room scheduling conflicts",
                    status: "active"
                  },
                  {
                    title: "NEP 2020 Compliance",
                    description: "Ensures credit distribution aligns with new education policy",
                    status: "active"
                  },
                  {
                    title: "Workload Optimization",
                    description: "Balances faculty teaching hours and distribution",
                    status: "active"
                  },
                  {
                    title: "Data-Driven Scheduling",
                    description: "Uses your uploaded Excel data for accurate timetable generation",
                    status: "active"
                  }
                ].map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-accent/30">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-primary">{feature.title}</span>
                        <Badge 
                          variant={feature.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {feature.status === 'active' ? 'Active' : 'Coming Soon'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generated Timetable Display */}
        {generatedTimetable && (
          <Card className="bg-card/50 backdrop-blur-sm shadow-card mt-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-primary">Generated Timetable</CardTitle>
                <CardDescription>
                  {selectedBranch} - Division {selectedDivision} | Year {selectedYear}
                </CardDescription>
                <p className="text-xs text-muted-foreground mt-1">Generated: {new Date().toLocaleString()}</p>
              </div>
              <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {generatedTimetable.headers.map((header, index) => (
                        <th
                          key={index}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {generatedTimetable.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TimetableGenerator;
