// Import necessary modules using ES module syntax
import express from 'express';
import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises'; // Import the file system module
import 'dotenv/config'; // Loads .env file
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from 'multer'; // Add multer for file uploads
import cors from 'cors'; // Add this line

// --- Setup ---

// Recreate __dirname for ES modules, which is not available by default
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const port = 3000;

// Add CORS middleware BEFORE other middleware
app.use(cors({
    origin: [
        'http://localhost:3000', 
        'http://localhost:8080', 
        'http://localhost:3001', 
        'http://localhost:5173', 
        'http://localhost:4200',
        'http://192.168.171.70:8080',  // Add your actual frontend URL
        'http://192.168.171.70:*',     // Allow any port on this IP
        /^http:\/\/192\.168\.171\.\d+:\d+$/  // Allow any IP in your network range
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (if any, e.g., CSS)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Multer Configuration for File Upload ---

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');

// Create uploads directory if it doesn't exist
const ensureUploadsDir = async () => {
    try {
        await fs.access(uploadsDir);
    } catch {
        await fs.mkdir(uploadsDir, { recursive: true });
        console.log('Created uploads directory');
    }
};

// Initialize uploads directory
await ensureUploadsDir();

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Files will be saved in uploads folder
    },
    filename: function (req, file, cb) {
        // Keep original filename
        cb(null, file.originalname);
    }
});

// File filter to allow CSV and Excel files
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error('Only Excel files (.xlsx, .xls) and CSV files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// --- Helper Functions ---

// Helper function to detect data type
function detectDataType(sample) {
    const keys = Object.keys(sample).map(k => k.toLowerCase());
    
    if (keys.some(k => k.includes('teacher') || k.includes('faculty') || k.includes('instructor'))) {
        return 'faculty';
    } else if (keys.some(k => k.includes('subject') || k.includes('course'))) {
        return 'subjects';
    } else if (keys.some(k => k.includes('room') || k.includes('classroom') || k.includes('venue'))) {
        return 'rooms';
    } else {
        return 'students';
    }
}

// Helper function to parse CSV file
async function parseCSVFile(filePath) {
    const csvContent = await fs.readFile(filePath, 'utf-8');
    const lines = csvContent.trim().split('\n');
    
    if (lines.length < 2) {
        throw new Error('CSV file must have at least a header and one data row');
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            data.push(row);
        }
    }
    
    return data;
}

function ensureProperCourseDistribution(parsedTable, allData) {
    console.log('=== TIMETABLE GENERATION DEBUG ===');
    console.log('Original rows from Gemini:', parsedTable.rows.length);
    
    // ALWAYS create a new timetable from scratch to ensure it works
    console.log('Creating guaranteed complete timetable...');
    
    const theorySubjects = allData.theoryCourses.slice(0, 5).map(c => c['Course name'] || c.Course);
    const labSubjects = allData.labCourses.slice(0, 5).map(c => c['Course name'] || c.Course);
    const facultyList = allData.faculty.slice(0, 10);
    const venueList = allData.venues.slice(0, 10).map(v => v['Room Number'] || v.room);
    
    console.log('Available data:');
    console.log('Theory subjects:', theorySubjects);
    console.log('Lab subjects:', labSubjects);
    console.log('Faculty count:', facultyList.length);
    console.log('Venues:', venueList);
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = ['9:00-10:00', '10:00-11:00', '11:00-12:00', '2:00-3:00', '3:00-4:00', '4:00-5:00'];
    
    const newRows = [];
    
    // Create systematic schedule: 2 theory lectures per subject + 1 lab per subject
    const schedulePattern = [];
    
    // Add each theory subject twice (2 lectures per week)
    theorySubjects.forEach(subject => {
        schedulePattern.push({ subject, type: 'theory' });
        schedulePattern.push({ subject, type: 'theory' });
    });
    
    // Add each lab subject once
    labSubjects.forEach(subject => {
        schedulePattern.push({ subject, type: 'lab' });
    });
    
    console.log('Schedule pattern created with', schedulePattern.length, 'entries');
    
    // Fill the timetable systematically
    let patternIndex = 0;
    
    days.forEach((day, dayIndex) => {
        console.log(`\nGenerating ${day}:`);
        
        timeSlots.forEach((time, timeIndex) => {
            if (patternIndex < schedulePattern.length) {
                const entry = schedulePattern[patternIndex];
                
                // Find appropriate faculty for this subject
                const matchingFaculty = facultyList.find(f => 
                    f.Course && f.Course.toLowerCase().includes(entry.subject.toLowerCase().split(' ')[0])
                );
                
                const faculty = matchingFaculty ? matchingFaculty.Name : facultyList[patternIndex % facultyList.length]?.Name || 'Faculty Member';
                
                // Select appropriate venue
                let venue;
                if (entry.type === 'lab' || entry.subject.includes('LAB')) {
                    venue = venueList.find(v => v.includes('Lab') || v.includes('lab')) || 'Lab-1';
                } else {
                    venue = venueList[(patternIndex % (venueList.length - 2))] || 'Room-101';
                }
                
                newRows.push([
                    day,
                    time,
                    `${allData.branch} Div${allData.division}`,
                    entry.subject,
                    faculty,
                    venue
                ]);
                
                console.log(`  ${time}: ${entry.subject} (${entry.type}) - ${faculty} - ${venue}`);
                patternIndex++;
            }
        });
    });
    
    // Add mandatory Library and Project sessions
    console.log('\nAdding mandatory sessions:');
    
    // Library sessions
    newRows.push([
        'Tuesday', '2:00-3:00', 'All Batches', 'LIBRARY SESSION', 'Library Staff', 'Library'
    ]);
    newRows.push([
        'Thursday', '4:00-5:00', 'All Batches', 'LIBRARY SESSION', 'Library Staff', 'Library'
    ]);
    console.log('  Added 2 Library sessions');
    
    // Project sessions
    newRows.push([
        'Wednesday', '3:00-4:00', 'All Batches', 'PROJECT WORK', 'Project Guide', 'Project Lab'
    ]);
    newRows.push([
        'Friday', '2:00-3:00', 'All Batches', 'PROJECT WORK', 'Project Guide', 'Project Lab'
    ]);
    console.log('  Added 2 Project sessions');
    
    // Saturday classes (lighter schedule)
    newRows.push([
        'Saturday', '9:00-10:00', `${allData.branch} Div${allData.division}`, theorySubjects[0], facultyList[0]?.Name || 'Faculty', venueList[0] || 'Room-101'
    ]);
    newRows.push([
        'Saturday', '10:00-11:00', `${allData.branch} Div${allData.division}`, theorySubjects[1], facultyList[1]?.Name || 'Faculty', venueList[1] || 'Room-102'
    ]);
    console.log('  Added 2 Saturday classes');
    
    // Sunday holiday
    newRows.push([
        'Sunday', '-', '-', 'HOLIDAY', '-', '-'
    ]);
    console.log('  Added Sunday holiday');
    
    // Replace the parsed table with our guaranteed complete timetable
    parsedTable.rows = newRows;
    
    console.log(`\n✅ GUARANTEED TIMETABLE CREATED:`);
    console.log(`   Total entries: ${newRows.length}`);
    console.log(`   Theory sessions: ${newRows.filter(row => row[3] && !row[3].includes('LAB') && !row[3].includes('LIBRARY') && !row[3].includes('PROJECT') && row[3] !== 'HOLIDAY').length}`);
    console.log(`   Lab sessions: ${newRows.filter(row => row[3] && row[3].includes('LAB')).length}`);
    console.log(`   Library sessions: ${newRows.filter(row => row[3] && row[3].includes('LIBRARY')).length}`);
    console.log(`   Project sessions: ${newRows.filter(row => row[3] && row[3].includes('PROJECT')).length}`);
    console.log('===================================');
    
    return parsedTable;
}

// --- Helper Functions ---

// ... existing helper functions ...

// Reliable Timetable Generator (no AI dependency)
// Smart Randomized Timetable Generator with Academic Rules
// Simple & Bulletproof Timetable Generator
function generateReliableTimetable(allData) {
    console.log('🔧 Creating guaranteed timetable...');
    
    // Extract data safely
    const theorySubjects = (allData.theoryCourses || []).slice(0, 5).map(c => c['Course name'] || c.Course).filter(Boolean);
    const labSubjects = (allData.labCourses || []).slice(0, 5).map(c => c['Course name'] || c.Course).filter(Boolean);
    const facultyList = (allData.faculty || []).slice(0, 10);
    const venueList = (allData.venues || []).slice(0, 10).map(v => v['Room Number'] || v.room).filter(Boolean);
    
    // Fallbacks to ensure we always have data
    const safeTheory = theorySubjects.length > 0 ? theorySubjects : ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'English'];
    const safeLab = labSubjects.length > 0 ? labSubjects : ['Programming Lab', 'Data Structures Lab', 'Network Lab'];
    const safeFaculty = facultyList.length > 0 ? facultyList.map(f => f.Name || f.name).filter(Boolean) : ['Dr. Smith', 'Prof. Johnson', 'Dr. Williams', 'Prof. Brown', 'Dr. Davis'];
    const safeVenues = venueList.length > 0 ? venueList : ['Room-101', 'Room-102', 'Room-103', 'Lab-A', 'Lab-B'];
    
    console.log('Using data:', {
        theory: safeTheory.length,
        lab: safeLab.length, 
        faculty: safeFaculty.length,
        venues: safeVenues.length
    });
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeSlots = ['9:00-10:00', '10:00-11:00', '11:00-12:00', '2:00-3:00', '3:00-4:00', '4:00-5:00'];
    const batchName = `${allData.branch} Div${allData.division}`;
    
    // Create academic sessions with EXACT rules
    const sessions = [];
    
    // Rule 1: Each theory subject gets exactly 2 lectures
    safeTheory.forEach(subject => {
        sessions.push({ subject, type: 'theory' });
        sessions.push({ subject, type: 'theory' });
    });
    
    // Rule 2: Each lab subject gets exactly 1 lab
    safeLab.forEach(subject => {
        sessions.push({ subject, type: 'lab' });
    });
    
    console.log(`Created ${sessions.length} academic sessions`);
    
    // Simple randomization using timestamp-based seed
    const seed = Date.now();
    function seededRandom(index) {
        const x = Math.sin(seed + index * 12.9898) * 43758.5453;
        return x - Math.floor(x);
    }
    
    // Shuffle sessions using seeded random
    for (let i = sessions.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(i) * (i + 1));
        [sessions[i], sessions[j]] = [sessions[j], sessions[i]];
    }
    
    // Prevent consecutive same subjects
    for (let i = 0; i < sessions.length - 1; i++) {
        if (sessions[i].subject === sessions[i + 1].subject) {
            // Find a different subject to swap with
            for (let j = i + 2; j < sessions.length; j++) {
                if (sessions[j].subject !== sessions[i].subject) {
                    [sessions[i + 1], sessions[j]] = [sessions[j], sessions[i + 1]];
                    break;
                }
            }
        }
    }
    
    // Create timetable entries systematically
    const timetableEntries = [];
    let sessionIndex = 0;
    
    days.forEach((day, dayIndex) => {
        const slotsForDay = day === 'Saturday' ? 3 : 6; // Saturday is lighter
        
        for (let slotIndex = 0; slotIndex < slotsForDay && slotIndex < timeSlots.length; slotIndex++) {
            const time = timeSlots[slotIndex];
            
            if (sessionIndex < sessions.length) {
                const session = sessions[sessionIndex];
                
                // Assign faculty (rotate through list)
                const faculty = safeFaculty[sessionIndex % safeFaculty.length];
                
                // Assign venue (labs for lab sessions, rooms for theory)
                let venue;
                if (session.type === 'lab') {
                    const labVenues = safeVenues.filter(v => v.toLowerCase().includes('lab'));
                    venue = labVenues.length > 0 ? labVenues[sessionIndex % labVenues.length] : 'Lab-1';
                } else {
                    const roomVenues = safeVenues.filter(v => v.toLowerCase().includes('room') || !v.toLowerCase().includes('lab'));
                    venue = roomVenues.length > 0 ? roomVenues[sessionIndex % roomVenues.length] : 'Room-101';
                }
                
                timetableEntries.push([
                    day,
                    time,
                    batchName,
                    session.subject,
                    faculty,
                    venue
                ]);
                
                sessionIndex++;
            }
        }
    });
    
    // Add MANDATORY sessions by replacing some existing ones
    const mandatoryReplacements = [
        { day: 'Tuesday', time: '2:00-3:00', course: 'LIBRARY SESSION', faculty: 'Library Staff', venue: 'Library' },
        { day: 'Thursday', time: '4:00-5:00', course: 'LIBRARY SESSION', faculty: 'Library Staff', venue: 'Library' },
        { day: 'Wednesday', time: '3:00-4:00', course: 'PROJECT WORK', faculty: 'Project Guide', venue: 'Project Lab' },
        { day: 'Friday', time: '2:00-3:00', course: 'PROJECT WORK', faculty: 'Project Guide', venue: 'Project Lab' }
    ];
    
    mandatoryReplacements.forEach(replacement => {
        const existingIndex = timetableEntries.findIndex(entry => 
            entry[0] === replacement.day && entry[1] === replacement.time
        );
        
        if (existingIndex >= 0) {
            timetableEntries[existingIndex] = [
                replacement.day,
                replacement.time,
                'All Batches',
                replacement.course,
                replacement.faculty,
                replacement.venue
            ];
        } else {
            timetableEntries.push([
                replacement.day,
                replacement.time,
                'All Batches',
                replacement.course,
                replacement.faculty,
                replacement.venue
            ]);
        }
    });
    
    // Add Sunday holiday
    timetableEntries.push(['Sunday', '-', '-', 'HOLIDAY', '-', '-']);
    
    // Sort entries by day and time for consistency
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeOrder = ['9:00-10:00', '10:00-11:00', '11:00-12:00', '2:00-3:00', '3:00-4:00', '4:00-5:00', '-'];
    
    timetableEntries.sort((a, b) => {
        const dayDiff = dayOrder.indexOf(a[0]) - dayOrder.indexOf(b[0]);
        if (dayDiff !== 0) return dayDiff;
        return timeOrder.indexOf(a[1]) - timeOrder.indexOf(b[1]);
    });
    
    console.log(`✅ Generated ${timetableEntries.length} timetable entries`);
    console.log('Entry breakdown:', {
        theory: timetableEntries.filter(e => e[3] && !e[3].includes('LAB') && !e[3].includes('LIBRARY') && !e[3].includes('PROJECT') && e[3] !== 'HOLIDAY').length,
        lab: timetableEntries.filter(e => e[3] && e[3].includes('LAB')).length,
        library: timetableEntries.filter(e => e[3] && e[3].includes('LIBRARY')).length,
        project: timetableEntries.filter(e => e[3] && e[3].includes('PROJECT')).length,
        total: timetableEntries.length
    });
    
    return {
        headers: ['Day', 'Time', 'Class/Batch', 'Course Name', 'Faculty', 'Venue'],
        rows: timetableEntries
    };
}




// --- Routes ---

// GET route for the home page
app.get('/', (req, res) => {
    res.render('index');
});

// POST route to handle file upload
app.post('/upload', upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'Please select a file to upload.' 
            });
        }

        const filePath = req.file.path;
        const fileName = req.file.filename;
        const fileExtension = path.extname(fileName).toLowerCase();

        // Handle different file types
        if (fileExtension === '.csv') {
            // For CSV files, verify they can be parsed
            try {
                const csvData = await parseCSVFile(filePath);
                if (csvData.length === 0) {
                    await fs.unlink(filePath);
                    return res.status(400).json({
                        success: false,
                        error: 'CSV file contains no data.'
                    });
                }
            } catch (csvError) {
                await fs.unlink(filePath);
                return res.status(400).json({
                    success: false,
                    error: `Invalid CSV file: ${csvError.message}`
                });
            }
        } else {
            // For Excel files, verify structure
            try {
                const workbook = xlsx.readFile(filePath);
                const sheetNames = workbook.SheetNames;
                
                if (sheetNames.length === 0) {
                    await fs.unlink(filePath);
                    return res.status(400).json({
                        success: false,
                        error: 'Excel file contains no sheets.'
                    });
                }
                
                // For DS*_Dataset.xlsx files, check required sheets
                if (fileName.match(/^DS\d+_Dataset\.xlsx$/)) {
                    const requiredSheets = ['Theory Courses', 'Lab Courses', 'Faculty', 'Load Dist', 'Batch Details', 'Venue'];
                    const missingSheets = requiredSheets.filter(sheet => !sheetNames.includes(sheet));
                    
                    if (missingSheets.length > 0) {
                        await fs.unlink(filePath);
                        return res.status(400).json({
                            success: false,
                            error: `Missing required sheets: ${missingSheets.join(', ')}`
                        });
                    }
                }
                
            } catch (excelError) {
                await fs.unlink(filePath);
                return res.status(400).json({
                    success: false,
                    error: 'Invalid Excel file format or corrupted file.'
                });
            }
        }

        res.json({
            success: true,
            message: `File '${fileName}' uploaded successfully to backend!`,
            fileName: fileName,
            filePath: filePath,
            fileType: fileExtension.substring(1).toUpperCase()
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'An error occurred during file upload.'
        });
    }
});

// GET route to list uploaded files
app.get('/files', async (req, res) => {
    try {
        const files = await fs.readdir(uploadsDir);
        const dataFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.xlsx', '.xls', '.csv'].includes(ext);
        });
        
        // Get file stats for additional info
        const fileDetails = await Promise.all(
            dataFiles.map(async (file) => {
                const filePath = path.join(uploadsDir, file);
                const stats = await fs.stat(filePath);
                return {
                    name: file,
                    size: stats.size,
                    uploadDate: stats.mtime,
                    type: path.extname(file).substring(1).toUpperCase()
                };
            })
        );
        
        res.json({
            success: true,
            files: dataFiles,
            fileDetails: fileDetails
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve file list.'
        });
    }
});

// GET route to get available branches and divisions from uploaded data
app.get('/api/branches-divisions', async (req, res) => {
    try {
        const uploadsPath = path.join(__dirname, 'uploads');
        const allFiles = await fs.readdir(uploadsPath);
        
        const excelFiles = allFiles.filter(file => 
            (file.endsWith('.xlsx') || file.endsWith('.xls')) && 
            !file.startsWith('timetable_') // Exclude generated timetable files
        );
        
        console.log('Found Excel files:', excelFiles);
        
        if (excelFiles.length === 0) {
            return res.json({
                success: true,
                data: { branches: [], divisions: [], message: 'No Excel files uploaded yet' }
            });
        }
        
        const branchesSet = new Set();
        const divisionsSet = new Set();
        
        // Try to extract from filename first (DS1_Dataset.xlsx pattern)
        excelFiles.forEach(file => {
            const match = file.match(/^([A-Za-z]+)(\d+)_Dataset\.(xlsx|xls)$/);
            if (match) {
                const branch = match[1]; // e.g., "DS"
                const division = match[2]; // e.g., "1"
                branchesSet.add(branch);
                divisionsSet.add(division);
                console.log(`Extracted from filename ${file}: Branch=${branch}, Division=${division}`);
            }
        });
        
        // If no data from filenames, try reading Excel content
        if (branchesSet.size === 0 || divisionsSet.size === 0) {
            const filePath = path.join(uploadsPath, excelFiles[0]);
            const workbook = xlsx.readFile(filePath);
            
            // Check multiple sheets for branch/division data
            const sheetsToCheck = ['Theory Courses', 'Lab Courses', 'Faculty', 'Batch Details'];
            
            for (const sheetName of sheetsToCheck) {
                if (workbook.Sheets[sheetName]) {
                    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
                    console.log(`Checking sheet ${sheetName}, found ${data.length} rows`);
                    
                    data.forEach(row => {
                        const branch = row.Branch || row.branch || row.BRANCH;
                        const division = row.Division || row.division || row.DIVISION || row.Div;
                        
                        if (branch) {
                            branchesSet.add(branch.toString());
                            console.log(`Found branch in data: ${branch}`);
                        }
                        if (division) {
                            divisionsSet.add(division.toString());
                            console.log(`Found division in data: ${division}`);
                        }
                    });
                }
            }
        }
        
        const branches = Array.from(branchesSet).sort();
        const divisions = Array.from(divisionsSet).sort();
        
        console.log('Final branches:', branches);
        console.log('Final divisions:', divisions);
        
        res.json({
            success: true,
            data: {
                branches,
                divisions,
                availableFiles: excelFiles,
                debug: {
                    totalFiles: excelFiles.length,
                    branchesFound: branches.length,
                    divisionsFound: divisions.length
                }
            }
        });
        
    } catch (error) {
        console.error('Error fetching branches/divisions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch available branches and divisions: ' + error.message
        });
    }
});

// GET route to retrieve stored timetables
app.get('/api/timetables', async (req, res) => {
    try {
        const { branch, division } = req.query;
        const uploadsPath = path.join(__dirname, 'uploads');
        
        console.log('=== TIMETABLES API DEBUG ===');
        console.log('Query params:', { branch, division });
        console.log('Uploads path:', uploadsPath);
        
        const allFiles = await fs.readdir(uploadsPath);
        console.log('All files in uploads:', allFiles);
        
        // Find timetable files
        let timetableFiles = allFiles.filter(file => 
            file.startsWith('timetable_') && file.endsWith('.json')
        );
        console.log('Timetable files found:', timetableFiles);
        
        // Filter by branch/division if specified
        if (branch || division) {
            const originalCount = timetableFiles.length;
            timetableFiles = timetableFiles.filter(file => {
                const matchesBranch = !branch || file.toLowerCase().includes(branch.toLowerCase());
                const matchesDivision = !division || file.includes(division.toString());
                console.log(`File ${file}: branch match=${matchesBranch}, division match=${matchesDivision}`);
                return matchesBranch && matchesDivision;
            });
            console.log(`Filtered from ${originalCount} to ${timetableFiles.length} files`);
        }
        
        const timetables = [];
        
        for (const file of timetableFiles) {
            try {
                const filePath = path.join(uploadsPath, file);
                console.log(`Reading file: ${filePath}`);
                const content = await fs.readFile(filePath, 'utf-8');
                const timetableData = JSON.parse(content);
                
                console.log(`File ${file} contains:`, {
                    branch: timetableData.branch,
                    division: timetableData.division,
                    hasRows: !!timetableData.timetable?.rows?.length
                });
                
                timetables.push({
                    filename: file,
                    ...timetableData
                });
            } catch (readError) {
                console.error(`Could not read timetable file ${file}:`, readError.message);
            }
        }
        
        // Sort by generation date (newest first)
        timetables.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
        
        console.log(`Returning ${timetables.length} timetables`);
        console.log('===========================');
        
        res.json({
            success: true,
            data: timetables
        });
        
    } catch (error) {
        console.error('Error fetching timetables:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch timetables: ' + error.message
        });
    }
});


// GET route to parse and return data from a specific file
app.get('/parse/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(uploadsDir, filename);
        
        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({
                success: false,
                error: 'File not found.'
            });
        }
        
        const fileExtension = path.extname(filename).toLowerCase();
        let parsedData = {};
        
        if (fileExtension === '.csv') {
            // Parse CSV file
            const csvData = await parseCSVFile(filePath);
            if (csvData.length > 0) {
                const dataType = detectDataType(csvData[0]);
                parsedData[dataType] = csvData;
            }
        } else {
            // Parse Excel file
            const workbook = xlsx.readFile(filePath);
            const sheetNames = workbook.SheetNames;
            
            // Helper function to safely read a sheet
            const getSheetData = (sheetName) => {
                const sheet = workbook.Sheets[sheetName];
                if (!sheet) return [];
                return xlsx.utils.sheet_to_json(sheet);
            };
            
            // Parse common sheet names and map to standard format
            if (sheetNames.includes('Theory Courses')) {
                parsedData.subjects = getSheetData('Theory Courses');
            }
            if (sheetNames.includes('Lab Courses')) {
                if (!parsedData.subjects) parsedData.subjects = [];
                parsedData.subjects = [...parsedData.subjects, ...getSheetData('Lab Courses')];
            }
            if (sheetNames.includes('Faculty')) {
                parsedData.faculty = getSheetData('Faculty');
            }
            if (sheetNames.includes('Venue')) {
                parsedData.rooms = getSheetData('Venue');
            }
            if (sheetNames.includes('Batch Details')) {
                parsedData.students = getSheetData('Batch Details');
            }
            
            // If no standard sheets found, try to detect data type from first sheet
            if (Object.keys(parsedData).length === 0 && sheetNames.length > 0) {
                const firstSheetData = getSheetData(sheetNames[0]);
                if (firstSheetData.length > 0) {
                    const dataType = detectDataType(firstSheetData[0]);
                    parsedData[dataType] = firstSheetData;
                }
            }
        }
        
        res.json({
            success: true,
            data: parsedData,
            filename: filename
        });
        
    } catch (error) {
        console.error('Parse error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to parse file.'
        });
    }
});

// DELETE route to remove uploaded files
app.delete('/files/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(uploadsDir, filename);
        
        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({
                success: false,
                error: 'File not found.'
            });
        }
        
        // Delete the file
        await fs.unlink(filePath);
        
        res.json({
            success: true,
            message: `File '${filename}' deleted successfully.`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete file.'
        });
    }
});

// POST route to generate timetable for specific branch/division
app.post('/generate', async (req, res) => {
    try {
        const { branch, division, year, theoryDuration, labDuration, shortBreaks, longBreaks } = req.body;
        
        console.log('Generate request received:', { branch, division, year });
        
        const uploadsPath = path.join(__dirname, 'uploads');
        const allFiles = await fs.readdir(uploadsPath);

        let filePath = null;

        // Method 1: Look for specific branch-division file (like DS1_Dataset.xlsx)
        const specificFile = allFiles.find(file => {
            const fileName = file.toLowerCase();
            return (
                fileName.includes(branch?.toLowerCase() || '') && 
                fileName.includes(division?.toLowerCase() || '') &&
                (fileName.endsWith('.xlsx') || fileName.endsWith('.xls'))
            );
        });

        if (specificFile) {
            filePath = path.join(uploadsPath, specificFile);
            console.log(`Found specific file: ${specificFile}`);
        } else {
            // Method 2: Look for any Excel file and filter data from it
            const excelFiles = allFiles.filter(file => 
                (file.endsWith('.xlsx') || file.endsWith('.xls')) && 
                !file.startsWith('timetable_')
            );
            
            if (excelFiles.length === 0) {
                throw new Error("No Excel files found in uploads folder. Please upload data first.");
            }
            
            // Use the first Excel file and filter data from it
            filePath = path.join(uploadsPath, excelFiles[0]);
            console.log(`Using file: ${excelFiles[0]} and will filter data`);
        }

        // Read and parse the Excel file
        const workbook = xlsx.readFile(filePath);
        console.log('Available sheets:', workbook.SheetNames);

        // Helper function to safely read a sheet
        const getSheetData = (sheetName) => {
            const sheet = workbook.Sheets[sheetName];
            if (!sheet) {
                console.log(`Sheet ${sheetName} not found`);
                return [];
            }
            return xlsx.utils.sheet_to_json(sheet);
        };

        // Extract data from sheets
        let theoryCourses = getSheetData('Theory Courses');
        let labCourses = getSheetData('Lab Courses');
        let faculty = getSheetData('Faculty');
        let loadDist = getSheetData('Load Dist');
        let batches = getSheetData('Batch Details');
        let venues = getSheetData('Venue');

        // Filter data by branch and division if they exist in the data
        if (branch && division) {
            const filterByBranchDiv = (data) => {
                return data.filter(item => {
                    const itemBranch = item.Branch || item.branch || '';
                    const itemDivision = item.Division || item.division || '';
                    
                    return (
                        itemBranch.toString().toLowerCase().includes(branch.toLowerCase()) &&
                        itemDivision.toString().toLowerCase().includes(division.toLowerCase())
                    );
                });
            };

            theoryCourses = filterByBranchDiv(theoryCourses);
            labCourses = filterByBranchDiv(labCourses);
            faculty = filterByBranchDiv(faculty);
            loadDist = filterByBranchDiv(loadDist);
            batches = filterByBranchDiv(batches);
            // Venues are usually shared, so don't filter them
        }

        console.log(`Filtered data counts:`, {
            theoryCourses: theoryCourses.length,
            labCourses: labCourses.length,
            faculty: faculty.length,
            batches: batches.length
        });

        if (theoryCourses.length === 0 && labCourses.length === 0) {
            throw new Error(`No data found for branch: ${branch}, division: ${division}. Please check your data.`);
        }

        // Prepare data for timetable generation
        const timetableData = {
            theoryCourses: theoryCourses.map(course => ({ ...course, division: division })),
            labCourses: labCourses.map(course => ({ ...course, division: division })),
            faculty: faculty.map(f => ({ ...f, division: division })),
            loadDist: loadDist.map(load => ({ ...load, division: division })),
            venues: venues,
            batches: batches.map(batch => ({ ...batch, division: division })),
            divisionCount: 1,
            branch: branch,
            division: division,
            constraints: {
                theoryDuration: theoryDuration || 60,
                labDuration: labDuration || 120,
                shortBreaks: shortBreaks || 2,
                longBreaks: longBreaks || 1
            }
        };

        // Generate the timetable using Gemini AI
        // Generate the timetable using Gemini AI
        // Generate timetable using reliable algorithm (bypass Gemini)
console.log('=== RELIABLE TIMETABLE GENERATION ===');
console.log(`Generating for ${branch} Division ${division}`);

const parsedTable = generateReliableTimetable(timetableData);

console.log(`Generated ${parsedTable.rows.length} timetable entries`);
console.log('=====================================');



        // Store the generated timetable (optional - for future retrieval)
        const timetableFile = `timetable_${branch}_${division}_${Date.now()}.json`;
        const timetableData_store = {
            branch,
            division,
            year,
            generatedAt: new Date().toISOString(),
            timetable: parsedTable
        };
        
        try {
            await fs.writeFile(
                path.join(uploadsPath, timetableFile), 
                JSON.stringify(timetableData_store, null, 2)
            );
            console.log(`Timetable saved as: ${timetableFile}`);
        } catch (saveError) {
            console.log('Could not save timetable file:', saveError.message);
        }

        // Return JSON response instead of rendering (for API usage)
        res.json({
            success: true,
            data: {
                branch,
                division,
                year,
                timetable: parsedTable,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Timetable generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'An unknown error occurred during timetable generation.'
        });
    }
});

// --- AI and Helper Functions ---

/**
 * Generates a combined timetable for multiple divisions using the Gemini API.
 * @param {object} allData - An object containing combined and tagged data for all divisions.
 * @returns {Promise<string>} - The generated timetable as a Markdown string.
 */
async function generateTimetableWithGemini(allData) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
        throw new Error("GEMINI_API_KEY is not set in the .env file.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Extract actual data dynamically
    const theorySubjects = allData.theoryCourses.slice(0, 5).map(c => c['Course name'] || c.Course);
    const labSubjects = allData.labCourses.slice(0, 5).map(c => c['Course name'] || c.Course);
    const facultyList = allData.faculty.slice(0, 10);
    const venueList = allData.venues.slice(0, 10).map(v => v['Room Number'] || v.room);

    const prompt = `
        URGENT: Generate a COMPLETE timetable with EXACTLY 30+ entries for ${allData.branch} Division ${allData.division}.

        YOU MUST GENERATE AT LEAST 30 ROWS IN THE TABLE.

        SUBJECTS TO USE (each theory subject MUST appear 2 times):
        ${theorySubjects.map((subject, i) => `${i+1}. ${subject} (2 times)`).join('\n')}

        LAB SUBJECTS TO USE (each lab subject MUST appear 1 time):
        ${labSubjects.map((subject, i) => `${i+1}. ${subject} (1 time)`).join('\n')}

        FACULTY TO USE:
        ${facultyList.map(f => `- ${f.Name} (teaches ${f.Course})`).join('\n')}

        VENUES TO USE: ${venueList.join(', ')}

        TIME SLOTS TO FILL:
        Monday: 9:00-10:00, 10:00-11:00, 11:00-12:00, 2:00-3:00, 3:00-4:00, 4:00-5:00 (6 slots)
        Tuesday: 9:00-10:00, 10:00-11:00, 11:00-12:00, 2:00-3:00, 3:00-4:00, 4:00-5:00 (6 slots)
        Wednesday: 9:00-10:00, 10:00-11:00, 11:00-12:00, 2:00-3:00, 3:00-4:00, 4:00-5:00 (6 slots)
        Thursday: 9:00-10:00, 10:00-11:00, 11:00-12:00, 2:00-3:00, 3:00-4:00, 4:00-5:00 (6 slots)
        Friday: 9:00-10:00, 10:00-11:00, 11:00-12:00, 2:00-3:00, 3:00-4:00, 4:00-5:00 (6 slots)
        Total: 30 slots to fill

        EXAMPLE OF WHAT YOU MUST GENERATE:

        | Day | Time | Class/Batch | Course Name | Faculty | Venue |
        |-----|------|-------------|-------------|---------|-------|
        | Monday | 9:00-10:00 | ${allData.branch} Div${allData.division} | ${theorySubjects[0]} | ${facultyList[0]?.Name} | ${venueList[0]} |
        | Monday | 10:00-11:00 | ${allData.branch} Div${allData.division} | ${theorySubjects[1]} | ${facultyList[1]?.Name} | ${venueList[1]} |
        | Monday | 11:00-12:00 | ${allData.branch} Div${allData.division} | ${theorySubjects[2]} | ${facultyList[2]?.Name} | ${venueList[2]} |
        | Monday | 2:00-3:00 | ${allData.branch} Div${allData.division} | ${labSubjects[0]} | ${facultyList[0]?.Name} | ${venueList[3]} |
        | Monday | 3:00-4:00 | ${allData.branch} Div${allData.division} | ${theorySubjects[3]} | ${facultyList[3]?.Name} | ${venueList[0]} |
        | Monday | 4:00-5:00 | ${allData.branch} Div${allData.division} | ${theorySubjects[4]} | ${facultyList[4]?.Name} | ${venueList[1]} |
        | Tuesday | 9:00-10:00 | ${allData.branch} Div${allData.division} | ${theorySubjects[0]} | ${facultyList[0]?.Name} | ${venueList[2]} |
        | Tuesday | 10:00-11:00 | ${allData.branch} Div${allData.division} | ${theorySubjects[1]} | ${facultyList[1]?.Name} | ${venueList[3]} |
        | Tuesday | 11:00-12:00 | ${allData.branch} Div${allData.division} | ${labSubjects[1]} | ${facultyList[1]?.Name} | ${venueList[4]} |
        | Tuesday | 2:00-3:00 | All Batches | LIBRARY SESSION | Library Staff | Library |
        | Tuesday | 3:00-4:00 | ${allData.branch} Div${allData.division} | ${theorySubjects[2]} | ${facultyList[2]?.Name} | ${venueList[0]} |
        | Tuesday | 4:00-5:00 | ${allData.branch} Div${allData.division} | ${theorySubjects[3]} | ${facultyList[3]?.Name} | ${venueList[1]} |

        CONTINUE THIS PATTERN FOR WEDNESDAY, THURSDAY, AND FRIDAY!

        CRITICAL REQUIREMENTS:
        1. Generate EXACTLY 30+ rows (6 per day × 5 days)
        2. Fill ALL time slots, not just first slot of each day
        3. Each theory subject appears exactly 2 times total
        4. Each lab subject appears exactly 1 time total
        5. Add 2 Library sessions and 2 Project sessions
        6. Do NOT leave most slots empty

        START GENERATING THE COMPLETE TABLE NOW:
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const generatedText = response.text();
        
        // Count actual rows generated
        const tableRows = generatedText.split('\n').filter(line => 
            line.includes('|') && !line.includes('---') && !line.includes('Day')
        );
        
        console.log(`Generated ${tableRows.length} actual table rows`);
        console.log('Generated text length:', generatedText.length);
        
        if (tableRows.length < 15) {
            console.warn('WARNING: Generated too few rows, will use fallback');
        }
        
        return generatedText;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get a response from the AI model.");
    }
}


/**
 * Parses a Markdown table string into a structured object, ensuring all rows have a consistent number of columns.
 * @param {string} markdown - The Markdown table string.
 * @returns {{headers: string[], rows: string[][]}} - An object with headers and rows.
 */
function parseMarkdownTable(markdown) {
    if (!markdown) return { headers: [], rows: [] };

    // Filter out lines that don't look like table rows (must contain '|') or are the markdown separator '---'
    const lines = markdown.trim().split('\n').filter(line => line.includes('|') && !line.includes('---'));
    
    if (lines.length < 1) return { headers: [], rows: [] };

    // The first line is always the header. Get column names and the required number of columns.
    const headers = lines[0].split('|').slice(1, -1).map(h => h.trim()).filter(Boolean);
    const numColumns = headers.length;
    
    // Process the rest of the lines as data rows
    let rows = lines.slice(1).map(line => 
        line.split('|').slice(1, -1).map(cell => cell.trim())
    );

    // Filter out any leftover separator-like rows (e.g., a row of '-----------')
    rows = rows.filter(row => row.some(cell => !cell.startsWith('---')));

    // CRITICAL FIX: Ensure every row has the same number of columns as the header.
    // Pad any short rows with empty strings. This prevents a broken table layout.
    const consistentRows = rows.map(row => {
        const newRow = [...row];
        while (newRow.length < numColumns) {
            newRow.push(''); // Add empty cells to match header count
        }
        // Also handle rows that might be too long, though less common
        return newRow.slice(0, numColumns);
    });

    return { headers, rows: consistentRows };
}

// --- Error Handling Middleware ---
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File size too large. Maximum size is 10MB.'
            });
        }
    }
    
    res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
    });
});

// --- Server Start ---
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    console.log(`Uploads directory: ${uploadsDir}`);
});