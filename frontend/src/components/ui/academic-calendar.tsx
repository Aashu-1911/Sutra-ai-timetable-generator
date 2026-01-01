import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AcademicCalendarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AcademicCalendar = ({ open, onOpenChange }: AcademicCalendarProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary text-xl">Academic Calendar 2025-2026</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
          <img 
            src="/lovable-uploads/5f64ef30-06db-4002-99f4-c79ff8a83cda.png" 
            alt="Academic Calendar" 
            className="w-full h-auto max-w-3xl rounded-lg shadow-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};