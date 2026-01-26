import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Play, CheckCircle, Lightbulb, 
  MessageCircle, Menu, X, Code, FileText, Settings, RotateCcw
} from 'lucide-react';
import { getCourseBySlug } from '@/lib/courseData';

const Learn: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [code, setCode] = useState(`// Welcome to the interactive code editor!
// Write your code here and click "Run Code" to execute

function greet(name) {
  return \`Hello, \${name}!\`;
}

// Try it out:
console.log(greet("World"));
`);
  const [output, setOutput] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<{ passed: boolean; message: string }[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [editorTheme, setEditorTheme] = useState<'dark' | 'light'>('dark');

  const course = getCourseBySlug(courseId || '');

  // Mock lesson data
  const currentLesson = {
    title: 'Variables and Data Types',
    module: 'Module 1: JavaScript Basics',
    lessonNumber: 2,
    totalLessons: 50,
    videoUrl: '',
    content: `
## Variables in JavaScript

Variables are containers for storing data values. In JavaScript, you can declare variables using \`let\`, \`const\`, or \`var\`.

### Using let

\`\`\`javascript
let message = "Hello";
message = "World"; // Can be reassigned
\`\`\`

### Using const

\`\`\`javascript
const PI = 3.14159;
// PI = 3; // Error! Cannot reassign const
\`\`\`

## Your Task

1. Declare a variable called \`userName\` using \`let\`
2. Assign your name to it
3. Log the greeting message to the console
    `,
    hints: [
      'Remember to use the let keyword to declare a variable.',
      'Variable names in JavaScript are case-sensitive.',
      'Use template literals (backticks) or string concatenation to create the greeting.',
    ],
  };

  const sidebarModules = [
    {
      title: 'Module 1: JavaScript Basics',
      lessons: [
        { id: '1', title: 'Introduction', completed: true, current: false },
        { id: '2', title: 'Variables and Data Types', completed: false, current: true },
        { id: '3', title: 'Operators', completed: false, current: false },
        { id: '4', title: 'Control Flow', completed: false, current: false },
        { id: '5', title: 'Quiz: Module 1', completed: false, current: false, type: 'quiz' },
      ],
    },
    {
      title: 'Module 2: Functions',
      lessons: [
        { id: '6', title: 'Function Basics', completed: false, current: false },
        { id: '7', title: 'Arrow Functions', completed: false, current: false },
        { id: '8', title: 'Parameters & Arguments', completed: false, current: false },
      ],
    },
  ];

  const runCode = () => {
    try {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args) => {
        logs.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '));
      };

      // eslint-disable-next-line no-eval
      eval(code);
      
      console.log = originalLog;
      setOutput(logs);

      // Mock test results
      const hasUserName = code.includes('let userName') || code.includes('let username');
      const hasAssignment = code.includes('=') && (code.includes('"') || code.includes("'") || code.includes('`'));
      const hasConsoleLog = code.includes('console.log');

      setTestResults([
        { passed: hasUserName, message: hasUserName ? 'Variable declared correctly' : 'Expected: Declare a variable called userName using let' },
        { passed: hasAssignment, message: hasAssignment ? 'Value assigned correctly' : 'Expected: Assign a string value to the variable' },
        { passed: hasConsoleLog, message: hasConsoleLog ? 'Output logged correctly' : 'Expected: Log the greeting to console' },
      ]);
    } catch (error) {
      setOutput([`Error: ${(error as Error).message}`]);
      setTestResults([]);
    }
  };

  const resetCode = () => {
    setCode(`// Write your code here
let userName = "";

// Create a greeting and log it
console.log();
`);
    setOutput([]);
    setTestResults([]);
  };

  const getHint = () => {
    if (hintLevel < currentLesson.hints.length) {
      setShowHint(true);
      setHintLevel(prev => Math.min(prev + 1, currentLesson.hints.length));
    }
  };

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Course not found</h1>
          <Link to="/courses" className="text-primary hover:underline">Back to courses</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to={`/course/${courseId}`} className="text-muted-foreground hover:text-foreground flex items-center gap-2">
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">Back to Course</span>
          </Link>
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-foreground">{currentLesson.title}</p>
          <p className="text-xs text-muted-foreground">Lesson {currentLesson.lessonNumber} of {currentLesson.totalLessons}</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <Settings size={20} className="text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="w-70 bg-card border-r border-border overflow-y-auto flex-shrink-0"
          >
            <div className="p-4">
              <h3 className="font-bold text-foreground mb-4">{course.title}</h3>
              
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold text-foreground">4%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '4%' }} />
                </div>
              </div>

              <div className="space-y-4">
                {sidebarModules.map((module, moduleIndex) => (
                  <div key={moduleIndex}>
                    <h4 className="text-sm font-semibold text-foreground mb-2">{module.title}</h4>
                    <div className="space-y-1">
                      {module.lessons.map((lesson) => (
                        <Link
                          key={lesson.id}
                          to={`/learn/${courseId}/${lesson.id}`}
                          className={`flex items-center gap-3 p-2 rounded-lg text-sm transition-colors ${
                            lesson.current
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {lesson.completed ? (
                            <CheckCircle size={16} className="text-green-500" />
                          ) : lesson.type === 'quiz' ? (
                            <FileText size={16} />
                          ) : (
                            <Play size={16} />
                          )}
                          <span className="flex-1 truncate">{lesson.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Instructions Panel */}
          <div className="lg:w-2/5 border-b lg:border-b-0 lg:border-r border-border overflow-y-auto">
            <div className="p-6">
              {/* Video Section */}
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl mb-6 flex items-center justify-center">
                <button className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                  <Play size={24} className="text-primary-foreground ml-1" />
                </button>
              </div>

              {/* Lesson Content */}
              <div className="prose prose-neutral prose-sm max-w-none">
                <h1 className="text-xl font-bold text-foreground mb-4">{currentLesson.title}</h1>
                <p className="text-muted-foreground text-sm mb-2">{currentLesson.module}</p>
                
                <div className="mt-6 space-y-4 text-foreground">
                  <h2 className="text-lg font-bold">Variables in JavaScript</h2>
                  <p className="text-muted-foreground">
                    Variables are containers for storing data values. In JavaScript, you can declare variables using <code className="bg-secondary px-1.5 py-0.5 rounded text-sm">let</code>, <code className="bg-secondary px-1.5 py-0.5 rounded text-sm">const</code>, or <code className="bg-secondary px-1.5 py-0.5 rounded text-sm">var</code>.
                  </p>

                  <div className="bg-secondary/50 rounded-lg p-4">
                    <p className="text-sm font-semibold mb-2">Using let:</p>
                    <pre className="bg-secondary rounded p-3 text-sm overflow-x-auto">
                      <code>{`let message = "Hello";
message = "World"; // Can be reassigned`}</code>
                    </pre>
                  </div>

                  <h3 className="text-base font-bold mt-6">Your Task</h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Declare a variable called <code className="bg-secondary px-1.5 py-0.5 rounded text-sm">userName</code> using <code className="bg-secondary px-1.5 py-0.5 rounded text-sm">let</code></li>
                    <li>Assign your name to it</li>
                    <li>Log a greeting message to the console</li>
                  </ol>
                </div>
              </div>

              {/* Hints Section */}
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    <Lightbulb size={20} className="text-yellow-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-yellow-800 mb-2">Hint {hintLevel}:</p>
                      <p className="text-yellow-700 text-sm">{currentLesson.hints[hintLevel - 1]}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={getHint}
                  disabled={hintLevel >= currentLesson.hints.length}
                  className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lightbulb size={16} />
                  Get Hint ({currentLesson.hints.length - hintLevel} left)
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary">
                  <MessageCircle size={16} />
                  Ask Community
                </button>
              </div>

              {/* Navigation */}
              <div className="mt-8 flex items-center justify-between">
                <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <ChevronLeft size={18} />
                  Previous
                </button>
                <button className="flex items-center gap-2 btn-primary text-sm px-4 py-2">
                  Next Lesson
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Code Editor Panel */}
          <div className="lg:w-3/5 flex flex-col overflow-hidden">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-border">
              <div className="flex items-center gap-2">
                <Code size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">script.js</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditorTheme(editorTheme === 'dark' ? 'light' : 'dark')}
                  className="p-1.5 hover:bg-secondary rounded text-muted-foreground"
                >
                  {editorTheme === 'dark' ? '☀️' : '🌙'}
                </button>
              </div>
            </div>

            {/* Code Editor */}
            <div className="flex-1 overflow-hidden">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`w-full h-full p-4 font-mono text-sm resize-none focus:outline-none ${
                  editorTheme === 'dark'
                    ? 'bg-slate-900 text-slate-100'
                    : 'bg-white text-slate-900'
                }`}
                spellCheck={false}
              />
            </div>

            {/* Editor Actions */}
            <div className="flex items-center gap-3 px-4 py-3 bg-secondary/50 border-t border-border">
              <button
                onClick={runCode}
                className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
              >
                <Play size={16} />
                Run Code
              </button>
              <button
                onClick={resetCode}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary"
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>

            {/* Console Output */}
            <div className="h-48 bg-slate-900 border-t border-border overflow-y-auto">
              <div className="p-2 border-b border-slate-700 text-slate-400 text-xs font-semibold">
                Console Output
              </div>
              <div className="p-3 font-mono text-sm">
                {output.length > 0 ? (
                  output.map((line, i) => (
                    <div key={i} className="text-slate-300 mb-1">
                      <span className="text-slate-500 mr-2">&gt;</span>
                      {line}
                    </div>
                  ))
                ) : (
                  <span className="text-slate-500">Run your code to see output here...</span>
                )}
              </div>

              {/* Test Results */}
              {testResults.length > 0 && (
                <div className="p-3 border-t border-slate-700">
                  <p className="text-slate-400 text-xs font-semibold mb-2">Test Results</p>
                  {testResults.map((result, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 text-sm mb-1 ${
                        result.passed ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {result.passed ? <CheckCircle size={14} /> : <X size={14} />}
                      {result.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Learn;