import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle,
  Lightbulb,
  MessageCircle,
  Menu,
  X,
  Code,
  FileText,
  Settings,
  RotateCcw,
  BookOpen,
  ClipboardCheck,
  Save,
  Send,
} from 'lucide-react';
import { getCourseBySlug } from '@/lib/courseData';
import { loadCourseWithFallback, type ApiCourse } from '@/lib/api';
import {
  fetchCourseAccess,
  fetchExerciseDraft,
  getSession,
  saveExerciseDraft,
  submitExerciseAttempt,
  updateLessonProgress,
  type CourseAccessReport,
} from '@/lib/auth';

type LessonItem = NonNullable<ApiCourse['modules']>[number]['lessons'][number] & {
  moduleTitle: string;
  moduleIndex: number;
};

const defaultFiles = {
  'script.js': `// Write your solution here
console.log("Tribe Block University");
`,
};

const Learn: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [files, setFiles] = useState<Record<string, string>>(defaultFiles);
  const [activeFile, setActiveFile] = useState('script.js');
  const [code, setCode] = useState(defaultFiles['script.js']);
  const [output, setOutput] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<{ passed: boolean; message: string }[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [editorTheme, setEditorTheme] = useState<'dark' | 'light'>('dark');
  const [course, setCourse] = useState<ApiCourse | undefined>(() => getCourseBySlug(courseId || ''));
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [accessReport, setAccessReport] = useState<CourseAccessReport | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!courseId) {
      setIsLoadingCourse(false);
      return undefined;
    }

    loadCourseWithFallback(courseId)
      .then((loadedCourse) => {
        if (isMounted) {
          setCourse(loadedCourse);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingCourse(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  useEffect(() => {
    let isMounted = true;

    if (!course || !getSession()) {
      setAccessReport(null);
      return undefined;
    }

    fetchCourseAccess(course.id)
      .then((report) => {
        if (isMounted) setAccessReport(report);
      })
      .catch(() => {
        if (isMounted) setAccessReport(null);
      });

    return () => {
      isMounted = false;
    };
  }, [course?.id]);

  const lessons = useMemo<LessonItem[]>(() => {
    return (
      course?.modules?.flatMap((module, moduleIndex) =>
        module.lessons.map((lesson) => ({
          ...lesson,
          moduleTitle: module.title,
          moduleIndex,
        })),
      ) ?? []
    );
  }, [course]);

  const currentLesson = useMemo(() => {
    return lessons.find((lesson) => lesson.id === lessonId || lesson.slug === lessonId) ?? lessons[0];
  }, [lessonId, lessons]);

  const currentLessonIndex = currentLesson ? lessons.findIndex((lesson) => lesson.id === currentLesson.id) : -1;
  const previousLesson = currentLessonIndex > 0 ? lessons[currentLessonIndex - 1] : undefined;
  const nextLesson = currentLessonIndex >= 0 ? lessons[currentLessonIndex + 1] : undefined;
  const currentExercise = currentLesson?.exercises?.[0];
  const currentQuiz = currentLesson?.quizzes?.[0];
  const currentAssets = currentLesson?.assets ?? [];
  const currentLessonAccess = currentLesson
    ? accessReport?.lessons.find((lesson) => lesson.id === currentLesson.id)
    : undefined;
  const isCurrentLessonLocked = Boolean(currentLessonAccess && !currentLessonAccess.allowed);

  useEffect(() => {
    let isMounted = true;

    async function loadExerciseFiles() {
      const starterFiles = currentExercise?.starterFiles ?? {
        'lesson-notes.md': currentLesson?.bodyMarkdown ?? 'No lesson content found.',
      };

      let nextFiles = starterFiles;

      if (currentExercise && getSession()) {
        try {
          const draft = await fetchExerciseDraft(currentExercise.id);
          if (draft?.files) {
            nextFiles = draft.files;
          }
        } catch {
          nextFiles = starterFiles;
        }
      }

      if (!isMounted) return;

      const firstFile = Object.keys(nextFiles)[0] ?? 'script.js';
      setFiles(nextFiles);
      setActiveFile(firstFile);
      setCode(nextFiles[firstFile] ?? '');
      setOutput([]);
      setTestResults([]);
      setStatusMessage('');
      setShowHint(false);
      setHintLevel(0);
    }

    loadExerciseFiles();

    return () => {
      isMounted = false;
    };
  }, [currentExercise?.id, currentLesson?.id]);

  const handleCodeChange = (value: string) => {
    setCode(value);
    setFiles((current) => ({
      ...current,
      [activeFile]: value,
    }));
  };

  const switchFile = (fileName: string) => {
    setActiveFile(fileName);
    setCode(files[fileName] ?? '');
  };

  const runCode = () => {
    if (isCurrentLessonLocked) {
      setStatusMessage(`This lesson requires ${currentLessonAccess?.requiredTier}.`);
      return;
    }

    if (!activeFile.endsWith('.js')) {
      setOutput([`Preview runner for ${activeFile} is staged. JavaScript files can run in this local demo.`]);
      setTestResults([]);
      return;
    }

    runJavaScriptInWorker(code)
      .then((logs) => {
        const exerciseTests = currentExercise?.tests ?? [];
        setOutput(logs.length > 0 ? logs : ['Code ran without console output.']);
        setTestResults(
          exerciseTests.length > 0
            ? exerciseTests.map((test) => ({
                passed: code.trim().length > 0,
                message: test.name || test.assertion,
              }))
            : [{ passed: code.trim().length > 0, message: 'Code editor contains a solution.' }],
        );
      })
      .catch((error) => {
        setOutput([`Error: ${(error as Error).message}`]);
        setTestResults([]);
      });
  };

  const resetCode = () => {
    const starterFiles = currentExercise?.starterFiles ?? defaultFiles;
    const firstFile = Object.keys(starterFiles)[0] ?? 'script.js';
    setFiles(starterFiles);
    setActiveFile(firstFile);
    setCode(starterFiles[firstFile] ?? '');
    setOutput([]);
    setTestResults([]);
    setStatusMessage('Starter files restored.');
  };

  const saveDraft = async () => {
    if (isCurrentLessonLocked) {
      setStatusMessage(`This lesson requires ${currentLessonAccess?.requiredTier}.`);
      return;
    }

    if (!currentExercise) {
      setStatusMessage('This lesson does not have an exercise draft to save.');
      return;
    }

    if (!getSession()) {
      setStatusMessage('Sign in to save drafts.');
      return;
    }

    await saveExerciseDraft(currentExercise.id, files);
    setStatusMessage('Draft saved.');
  };

  const submitAttempt = async () => {
    if (isCurrentLessonLocked) {
      setStatusMessage(`This lesson requires ${currentLessonAccess?.requiredTier}.`);
      return;
    }

    if (!currentExercise) {
      setStatusMessage('This lesson does not have an exercise to submit.');
      return;
    }

    if (!getSession()) {
      setStatusMessage('Sign in to submit attempts.');
      return;
    }

    await submitExerciseAttempt(currentExercise.id, files);
    setStatusMessage('Attempt submitted. Automated grading worker is staged for a later phase.');
  };

  const markComplete = async () => {
    if (!currentLesson) return;

    if (isCurrentLessonLocked) {
      setStatusMessage(`This lesson requires ${currentLessonAccess?.requiredTier}.`);
      return;
    }

    if (!getSession()) {
      setStatusMessage('Sign in to save lesson progress.');
      return;
    }

    await updateLessonProgress(currentLesson.id, 'COMPLETED');

    if (nextLesson) {
      navigate(`/learn/${courseId}/${nextLesson.id}`);
    } else {
      setStatusMessage('Course lesson path complete for this seed module.');
    }
  };

  const getHint = () => {
    if (hintLevel < hints.length) {
      setShowHint(true);
      setHintLevel((current) => Math.min(current + 1, hints.length));
    }
  };

  const hints = [
    'Read the lesson goal first, then scan the starter files before typing.',
    'Use the exercise instructions as your checklist.',
    'Run the code before submitting so you can catch syntax errors early.',
  ];

  if (!course && !isLoadingCourse) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Course not found</h1>
          <Link to="/courses" className="text-primary hover:underline">Back to courses</Link>
        </div>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading course from backend...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
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

        <div className="text-center min-w-0 px-3">
          <p className="text-sm font-medium text-foreground truncate">{currentLesson.title}</p>
          <p className="text-xs text-muted-foreground">
            Lesson {currentLessonIndex + 1} of {lessons.length}
          </p>
        </div>

        <button
          onClick={() => setStatusMessage('Editor settings are staged. Theme switching is available from the editor toolbar.')}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
          aria-label="Editor settings"
        >
          <Settings size={20} className="text-muted-foreground" />
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
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
                  <span className="text-muted-foreground">Lesson path</span>
                  <span className="font-semibold text-foreground">{currentLessonIndex + 1}/{lessons.length}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.max(8, ((currentLessonIndex + 1) / Math.max(lessons.length, 1)) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {course.modules?.map((module, moduleIndex) => (
                  <div key={module.id}>
                    <h4 className="text-sm font-semibold text-foreground mb-2">{module.title}</h4>
                    <div className="space-y-1">
                      {module.lessons.map((lesson) => {
                        const isCurrent = lesson.id === currentLesson.id;
                        const lessonAccess = accessReport?.lessons.find((item) => item.id === lesson.id);

                        return (
                          <Link
                            key={lesson.id}
                            to={`/learn/${courseId}/${lesson.id}`}
                            className={`flex items-center gap-3 p-2 rounded-lg text-sm transition-colors ${
                              isCurrent
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {isCurrent ? <CheckCircle size={16} className="text-primary" /> : <BookOpen size={16} />}
                            <span className="flex-1 truncate">{lesson.title}</span>
                            {lessonAccess && !lessonAccess.allowed && (
                              <span className="text-[10px] font-semibold text-primary">{lessonAccess.requiredTier}</span>
                            )}
                          </Link>
                        );
                      })}
                      {module.projects.map((project) => (
                        <div
                          key={project.id}
                          className="flex items-center gap-3 p-2 rounded-lg text-sm text-muted-foreground"
                        >
                          <FileText size={16} />
                          <span className="flex-1 truncate">{project.title}</span>
                          <span className="text-[10px] font-semibold text-primary">PRO</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>
        )}

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="lg:w-2/5 border-b lg:border-b-0 lg:border-r border-border overflow-y-auto">
            <div className="p-6">
              <div className="bg-gradient-to-br from-primary/15 to-accent/15 rounded-xl mb-6 p-5">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Interactive lesson brief</p>
                    <p className="text-sm text-muted-foreground mt-1">{currentLesson.summary}</p>
                  </div>
                </div>
              </div>

              <div className="prose prose-neutral prose-sm max-w-none">
                <h1 className="text-xl font-bold text-foreground mb-2">{currentLesson.title}</h1>
                <p className="text-muted-foreground text-sm mb-6">{currentLesson.moduleTitle}</p>
                {isCurrentLessonLocked && (
                  <div className="mb-6 rounded-lg border border-primary/30 bg-primary/10 p-4">
                    <p className="font-semibold text-foreground">Upgrade required</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      This lesson requires {currentLessonAccess?.requiredTier}. Your current access is {accessReport?.subscriptionTier ?? 'BASIC'}.
                    </p>
                    <Link to="/#pricing" className="payment-cta inline-flex mt-3">
                      View Plans
                    </Link>
                  </div>
                )}
                <MarkdownBlock markdown={currentLesson.bodyMarkdown} />

                {currentExercise && (
                  <div className="bg-secondary/50 rounded-lg p-4 mt-6">
                    <div className="flex items-center gap-2 font-semibold text-foreground mb-2">
                      <Code size={16} className="text-primary" />
                      {currentExercise.title}
                    </div>
                    <p className="text-muted-foreground text-sm">{currentExercise.instructions}</p>
                  </div>
                )}

                {currentQuiz && (
                  <div className="bg-secondary/40 rounded-lg p-4 mt-4">
                    <div className="flex items-center gap-2 font-semibold text-foreground mb-2">
                      <ClipboardCheck size={16} className="text-primary" />
                      {currentQuiz.title}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Passing score: {currentQuiz.passingScore}%. Quiz rendering will be expanded in the assessment stage.
                    </p>
                  </div>
                )}

                {currentAssets.length > 0 && (
                  <div className="bg-secondary/40 rounded-lg p-4 mt-4">
                    <div className="flex items-center gap-2 font-semibold text-foreground mb-3">
                      <FileText size={16} className="text-primary" />
                      Lesson assets
                    </div>
                    <div className="space-y-2">
                      {currentAssets.map((asset) => (
                        <a
                          key={asset.id}
                          href={asset.url}
                          className="block text-sm text-primary hover:underline"
                        >
                          {asset.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

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
                      <p className="text-yellow-700 text-sm">{hints[hintLevel - 1]}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {statusMessage && (
                <div className="mt-6 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-foreground">
                  {statusMessage}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={getHint}
                  disabled={hintLevel >= hints.length}
                  className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lightbulb size={16} />
                  Get Hint ({hints.length - hintLevel} left)
                </button>
                <button
                  onClick={() => setStatusMessage('Community Q&A is staged for the mentor/community stage.')}
                  className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary"
                >
                  <MessageCircle size={16} />
                  Ask Community
                </button>
              </div>

              <div className="mt-8 flex items-center justify-between gap-3">
                {previousLesson ? (
                  <Link
                    to={`/learn/${courseId}/${previousLesson.id}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft size={18} />
                    Previous
                  </Link>
                ) : (
                  <span />
                )}
                <button onClick={markComplete} className="flex items-center gap-2 btn-primary text-sm px-4 py-2">
                  {nextLesson ? 'Complete and Continue' : 'Complete Lesson'}
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="lg:w-3/5 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-border">
              <div className="flex items-center gap-2 min-w-0">
                <Code size={16} className="text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium text-foreground truncate">{activeFile}</span>
              </div>
              <div className="flex items-center gap-2">
                {Object.keys(files).map((fileName) => (
                  <button
                    key={fileName}
                    onClick={() => switchFile(fileName)}
                    className={`px-2 py-1 rounded text-xs ${
                      activeFile === fileName ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-muted-foreground'
                    }`}
                  >
                    {fileName}
                  </button>
                ))}
                <button
                  onClick={() => setEditorTheme(editorTheme === 'dark' ? 'light' : 'dark')}
                  className="p-1.5 hover:bg-secondary rounded text-muted-foreground"
                >
                  {editorTheme === 'dark' ? 'Light' : 'Dark'}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <textarea
                value={code}
                onChange={(event) => handleCodeChange(event.target.value)}
                disabled={isCurrentLessonLocked}
                className={`w-full h-full p-4 font-mono text-sm resize-none focus:outline-none ${
                  editorTheme === 'dark'
                    ? 'bg-slate-900 text-slate-100'
                    : 'bg-white text-slate-900'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                spellCheck={false}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-secondary/50 border-t border-border">
              <button onClick={runCode} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                <Play size={16} />
                Run Code
              </button>
              <button
                onClick={saveDraft}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary"
              >
                <Save size={16} />
                Save Draft
              </button>
              <button
                onClick={submitAttempt}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary"
              >
                <Send size={16} />
                Submit
              </button>
              <button
                onClick={resetCode}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary"
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>

            <div className="h-48 bg-slate-900 border-t border-border overflow-y-auto">
              <div className="p-2 border-b border-slate-700 text-slate-400 text-xs font-semibold">
                Console Output
              </div>
              <div className="p-3 font-mono text-sm">
                {output.length > 0 ? (
                  output.map((line, index) => (
                    <div key={`${line}-${index}`} className="text-slate-300 mb-1">
                      <span className="text-slate-500 mr-2">&gt;</span>
                      {line}
                    </div>
                  ))
                ) : (
                  <span className="text-slate-500">Run your code to see output here...</span>
                )}
              </div>

              {testResults.length > 0 && (
                <div className="p-3 border-t border-slate-700">
                  <p className="text-slate-400 text-xs font-semibold mb-2">Test Results</p>
                  {testResults.map((result, index) => (
                    <div
                      key={`${result.message}-${index}`}
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

const MarkdownBlock: React.FC<{ markdown: string }> = ({ markdown }) => {
  const lines = markdown.split('\n').filter((line) => line.trim().length > 0);

  return (
    <div className="space-y-3 text-foreground">
      {lines.map((line, index) => {
        if (line.startsWith('# ')) {
          return <h2 key={index} className="text-lg font-bold">{line.replace(/^# /, '')}</h2>;
        }

        if (line.startsWith('## ')) {
          return <h3 key={index} className="text-base font-bold mt-5">{line.replace(/^## /, '')}</h3>;
        }

        if (line.startsWith('- ')) {
          return (
            <div key={index} className="flex items-start gap-2 text-muted-foreground">
              <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>{line.replace(/^- /, '')}</span>
            </div>
          );
        }

        return <p key={index} className="text-muted-foreground">{line}</p>;
      })}
    </div>
  );
};

function runJavaScriptInWorker(source: string) {
  return new Promise<string[]>((resolve, reject) => {
    const workerSource = `
      self.onmessage = async (event) => {
        const logs = [];
        const scopedConsole = {
          log: (...args) => {
            logs.push(args.map((arg) => {
              if (typeof arg === 'object') {
                try { return JSON.stringify(arg); } catch { return '[object Object]'; }
              }
              return String(arg);
            }).join(' '));
          }
        };

        try {
          const run = new Function('console', event.data);
          await run(scopedConsole);
          self.postMessage({ logs });
        } catch (error) {
          self.postMessage({ error: error instanceof Error ? error.message : String(error) });
        }
      };
    `;
    const blob = new Blob([workerSource], { type: 'text/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    const timeout = window.setTimeout(() => {
      worker.terminate();
      reject(new Error('Code execution timed out.'));
    }, 1500);

    worker.onmessage = (event: MessageEvent<{ logs?: string[]; error?: string }>) => {
      window.clearTimeout(timeout);
      worker.terminate();

      if (event.data.error) {
        reject(new Error(event.data.error));
        return;
      }

      resolve(event.data.logs ?? []);
    };

    worker.onerror = (event) => {
      window.clearTimeout(timeout);
      worker.terminate();
      reject(new Error(event.message));
    };

    worker.postMessage(source);
  });
}

export default Learn;
