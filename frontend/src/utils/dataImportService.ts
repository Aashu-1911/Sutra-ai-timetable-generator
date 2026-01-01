import { buildApiUrl, API_CONFIG } from '@/config/api';

interface ImportResult {
  success: boolean;
  error?: string;
  recordCount?: number;
  data?: any[];
  message?: string;
}

interface CollegeData {
  faculty?: any[];
  subjects?: any[];
  rooms?: any[];
  students?: any[];
  lastImported?: string;
}

export class DataImportService {
  private static API_BASE_URL = API_CONFIG.BASE_URL;

  // Main import method - now only handles backend uploads
  static async importFile(file: File): Promise<ImportResult> {
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv' || fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Send all files (CSV and Excel) to backend
        return await this.uploadToBackend(file);
      } else {
        return { success: false, error: 'Unsupported file format. Please use CSV or Excel files.' };
      }

    } catch (error) {
      console.error('Import error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Upload file to backend
  private static async uploadToBackend(file: File): Promise<ImportResult> {
    try {
      const formData = new FormData();
      formData.append('excelFile', file);

      const response = await fetch(`${this.API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Upload failed' };
      }

      return {
        success: true,
        recordCount: 0, // You can modify backend to return this if needed
        data: [], // You can modify backend to return parsed data if needed
        message: result.message
      };

    } catch (error) {
      console.error('Upload error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error occurred' 
      };
    }
  }

  // Get all uploaded files from backend
  public static async getUploadedFiles(): Promise<string[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/files`);
      const result = await response.json();
      
      if (result.success) {
        return result.files;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to get file list:', error);
      return [];
    }
  }

  // Delete uploaded file from backend
  public static async deleteFile(filename: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/files/${filename}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      
      return result.success;
    } catch (error) {
      console.error('Failed to delete file:', error);
      return false;
    }
  }

  // Get parsed data from specific file on backend
  public static async getFileData(filename: string): Promise<CollegeData | null> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/parse/${filename}`);
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to get file data:', error);
      return null;
    }
  }

  // Get faculty data from backend
  public static async getFaculty(): Promise<any[]> {
    try {
      const files = await this.getUploadedFiles();
      if (files.length > 0) {
        const data = await this.getFileData(files[0]); // Get from first file or specify which file
        return data?.faculty || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to get faculty data:', error);
      return [];
    }
  }

  // Get subjects data from backend
  public static async getSubjects(): Promise<any[]> {
    try {
      const files = await this.getUploadedFiles();
      if (files.length > 0) {
        const data = await this.getFileData(files[0]);
        return data?.subjects || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to get subjects data:', error);
      return [];
    }
  }

  // Get rooms data from backend
  public static async getRooms(): Promise<any[]> {
    try {
      const files = await this.getUploadedFiles();
      if (files.length > 0) {
        const data = await this.getFileData(files[0]);
        return data?.rooms || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to get rooms data:', error);
      return [];
    }
  }

  // Get students data from backend
  public static async getStudents(): Promise<any[]> {
    try {
      const files = await this.getUploadedFiles();
      if (files.length > 0) {
        const data = await this.getFileData(files[0]);
        return data?.students || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to get students data:', error);
      return [];
    }
  }

  // Clear all uploaded files from backend
  public static async clearData(): Promise<boolean> {
    try {
      const files = await this.getUploadedFiles();
      const deletePromises = files.map(file => this.deleteFile(file));
      const results = await Promise.all(deletePromises);
      return results.every(result => result === true);
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  }

    static async generateTimetable(params: {
    branch: string;
    division: string;
    year: string;
    theoryDuration?: number;
    labDuration?: number;
    shortBreaks?: number;
    longBreaks?: number;
  }): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Timetable generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate timetable'
      };
    }
  }

  // NEW: Get available branches and divisions
  static async getBranchesAndDivisions(): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/branches-divisions`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching branches/divisions:', error);
      return { success: false, error: 'Failed to fetch options' };
    }
  }

  // NEW: Get stored timetables
  static async getStoredTimetables(branch?: string, division?: string): Promise<any> {
    try {
      let url = `${this.API_BASE_URL}/api/timetables`;
      const params = new URLSearchParams();
      if (branch) params.append('branch', branch);
      if (division) params.append('division', division);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching timetables:', error);
      return { success: false, error: 'Failed to fetch timetables' };
    }
  }
}


