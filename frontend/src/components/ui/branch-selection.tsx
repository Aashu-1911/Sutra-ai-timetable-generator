import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BranchSelectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: "student" | "faculty";
  onSelection: (year: string, branch: string, division?: string) => void;
}

const years = ["1", "2", "3", "4"];

const branches = [
  "Computer Engineering",
  "Information Technology", 
  "Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Data Science"
];

const divisions = ["A", "B", "C", "D"];

export const BranchSelection = ({ open, onOpenChange, userRole, onSelection }: BranchSelectionProps) => {
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedDivision, setSelectedDivision] = useState<string>("");

  const handleProceed = () => {
    if (selectedYear && selectedBranch && (userRole === "faculty" || selectedDivision)) {
      onSelection(selectedYear, selectedBranch, selectedDivision);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary text-xl">
            {userRole === "student" ? "Student Portal" : "Faculty Portal"}
          </DialogTitle>
        </DialogHeader>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Your Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Year
              </label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      Year {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Branch/Department
              </label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {userRole === "student" && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Division
                </label>
                <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select division" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map((division) => (
                      <SelectItem key={division} value={division}>
                        Division {division}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button 
              onClick={handleProceed}
              disabled={!selectedYear || !selectedBranch || (userRole === "student" && !selectedDivision)}
              className="w-full bg-primary hover:bg-primary-light"
            >
              Proceed to Dashboard
            </Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};