import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Star, Clock, Users, CheckCircle, Lock, Award, 
  BookOpen, Code, FileText, ChevronDown, ChevronUp,
  ArrowLeft, ClipboardCheck
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SignUpModal from '@/components/SignUpModal';
import { getCourseBySlug, type Course } from '@/lib/courseData';
import { loadCourseWithFallback, type ApiCourse } from '@/lib/api';
import { enrollInCourse, fetchCourseAccess, getSession, type CourseAccessReport } from '@/lib/auth';

type CurriculumLesson = {
  title: string;
  duration: string;
  type: string;
  completed: boolean;
  preview?: boolean;
};

type CurriculumModule = {
  title: string;
  lessons: CurriculumLesson[];
};

const fallbackCurriculum = (course: Course): CurriculumModule[] => [
  {
    title: `Module 1: ${course.title} Basics`,
    lessons: [
      { title: 'Lesson Brief', duration: '15 min', type: 'reading', completed: true, preview: true },
      { title: 'Getting Started', duration: '12 min', type: 'interactive', completed: true },
      { title: 'Core Concepts', duration: '20 min', type: 'reading', completed: false },
      { title: 'IDE Practice', duration: '25 min', type: 'code', completed: false },
      { title: 'Module Quiz', duration: '10 min', type: 'quiz', completed: false },
    ],
  },
  {
    title: 'Module 2: Build and Assessment',
    lessons: [
      { title: 'Coding Exercise', duration: '30 min', type: 'code', completed: false },
      { title: 'Guided Build Project', duration: '45 min', type: 'project', completed: false },
      { title: 'Final Assessment', duration: '30 min', type: 'quiz', completed: false },
    ],
  },
];

const generateCurriculum = (course: ApiCourse): CurriculumModule[] => {
  if (!course.modules?.length) {
    return fallbackCurriculum(course);
  }

  return course.modules.map((module) => ({
    title: module.title,
    lessons: [
      ...module.lessons.map((lesson, lessonIndex) => ({
        title: lesson.title,
        duration: `${lesson.estimatedMinutes} min`,
        type: lesson.exercises.length > 0 ? 'code' : lesson.quizzes.length > 0 ? 'quiz' : 'reading',
        completed: lessonIndex < 1,
        preview: lesson.visibility === 'FREE',
      })),
      ...module.projects.map((project) => ({
        title: project.title,
        duration: '60 min',
        type: 'project',
        completed: false,
        preview: project.visibility === 'FREE',
      })),
    ],
  }));
};

const getStarPercentage = (stars: number): number => {
  if (stars === 5) return 70;
  if (stars === 4) return 20;
  if (stars === 3) return 7;
  if (stars === 2) return 2;
  return 1;
};

const CourseDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [accessReport, setAccessReport] = useState<CourseAccessReport | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews' | 'instructor'>('overview');
  const [expandedModules, setExpandedModules] = useState<number[]>([0]);
  const [course, setCourse] = useState<ApiCourse | undefined>(() => getCourseBySlug(slug || ''));
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (!slug) {
      setIsLoadingCourse(false);
      return undefined;
    }

    loadCourseWithFallback(slug)
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
  }, [slug]);

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

  if (!course && !isLoadingCourse) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Course not found</h1>
          <Link to="/courses" className="text-primary hover:underline">
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading course from backend...</p>
      </div>
    );
  }

  const curriculum = generateCurriculum(course);
  const totalLessons = curriculum.reduce((acc, mod) => acc + mod.lessons.length, 0);
  const completedLessons = curriculum.reduce(
    (acc, mod) => acc + mod.lessons.filter(l => l.completed).length, 0
  );
  const progressPercent = Math.round((completedLessons / totalLessons) * 100);

  const toggleModule = (index: number) => {
    setExpandedModules(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'reading': return <BookOpen size={14} />;
      case 'interactive': return <ClipboardCheck size={14} />;
      case 'code': return <Code size={14} />;
      case 'quiz': return <FileText size={14} />;
      case 'project': return <BookOpen size={14} />;
      default: return <BookOpen size={14} />;
    }
  };

  const handleStartLearning = async () => {
    setEnrollmentError('');

    if (!getSession()) {
      setIsSignUpOpen(true);
      return;
    }

    if (accessReport && !accessReport.course.allowed) {
      setEnrollmentError(`This course requires ${accessReport.course.requiredTier}. Choose a plan to continue.`);
      return;
    }

    setIsEnrolling(true);

    try {
      await enrollInCourse(course.id);
      navigate(`/learn/${course.slug}`);
    } catch (error) {
      setEnrollmentError(error instanceof Error ? error.message : 'Unable to enroll in this course.');
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onSignUpClick={() => setIsSignUpOpen(true)} />

      <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <Link to="/courses" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft size={18} />
            Back to courses
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  course.level === 'Beginner' ? 'bg-green-100 text-green-700' :
                  course.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {course.level}
                </span>
                <span className="text-muted-foreground text-sm">{course.category}</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
                {course.title}
              </h1>
              <p className="text-muted-foreground text-lg mb-6">
                {course.description}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold text-foreground">{course.rating}</span>
                  <span className="text-muted-foreground">({course.reviews.toLocaleString()} reviews)</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users size={18} />
                  <span>{course.students.toLocaleString()} students</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock size={18} />
                  <span>{course.duration}</span>
                </div>
              </div>

              <div className="mt-4 text-sm text-muted-foreground">
                Created by <span className="text-primary font-medium">{course.instructor}</span>
                {isLoadingCourse && <span className="ml-2">Syncing backend data...</span>}
              </div>
            </div>

            <div className="lg:row-span-2">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card sticky top-24">
                <div className="relative min-h-40 bg-gradient-to-br from-primary/15 to-accent/15 rounded-xl mb-6 p-5 flex flex-col justify-between">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Text-first interactive course</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Learn by reading, practicing in the IDE, taking quizzes, and building projects.
                    </p>
                  </div>
                </div>

                {progressPercent > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold text-foreground">{progressPercent}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleStartLearning}
                  disabled={isEnrolling}
                  className="btn-primary w-full py-3 text-base mb-4"
                >
                  {isEnrolling ? 'Opening course...' : progressPercent > 0 ? 'Continue Learning' : 'Enroll Now - Start Free'}
                </button>

                {enrollmentError && (
                  <p className="text-sm text-destructive text-center mb-4">{enrollmentError}</p>
                )}

                {accessReport && !accessReport.course.allowed && (
                  <Link to="/#pricing" className="payment-cta w-full justify-center mb-4">
                    Upgrade to {accessReport.course.requiredTier}
                  </Link>
                )}

                <p className="text-center text-muted-foreground text-sm mb-6">
                  Free foundation lessons include IDE practice, quizzes, exams, and badges. Guided projects require Plus or Pro. NFT certificates require Pro.
                </p>

                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">This course includes:</h4>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <BookOpen size={16} className="text-primary" />
                    <span>{course.lessons} text and interactive lessons</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Code size={16} className="text-primary" />
                    <span>In-app IDE practice exercises</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <BookOpen size={16} className="text-primary" />
                    <span>{course.projects} hands-on projects</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <FileText size={16} className="text-primary" />
                    <span>Quizzes and assessments</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Award size={16} className="text-primary" />
                    <span>Pro NFT certificate</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border sticky top-16 bg-background z-10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex gap-8">
            {(['overview', 'curriculum', 'reviews', 'instructor'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 font-medium capitalize border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl">
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-2xl font-bold text-foreground mb-6">What You'll Learn</h2>
                <div className="grid md:grid-cols-2 gap-4 mb-10">
                  {course.topics.map(topic => (
                    <div key={topic} className="flex items-start gap-3">
                      <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{topic}</span>
                    </div>
                  ))}
                </div>

                <h2 className="text-2xl font-bold text-foreground mb-6">Prerequisites</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-10">
                  <li>Basic understanding of programming concepts</li>
                  <li>Familiarity with web development fundamentals</li>
                  <li>A computer with internet access</li>
                </ul>

                <h2 className="text-2xl font-bold text-foreground mb-6">Course Description</h2>
                <div className="prose prose-neutral max-w-none">
                  <p className="text-muted-foreground mb-4">
                    {course.description} This comprehensive course is designed to take you from beginner to proficient, 
                    with guided reading, interactive checkpoints, coding exercises, and real-world examples throughout.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    You'll learn through text lessons, interactive coding exercises, quizzes, 
                    cheatsheets, and practical projects that reinforce your understanding. Each module builds upon the previous one, 
                    ensuring a smooth learning progression.
                  </p>
                  <p className="text-muted-foreground">
                    Upon completion, you'll receive a blockchain-verified NFT certificate that proves your skills 
                    and can be shared with potential employers.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'curriculum' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Course Curriculum</h2>
                  <span className="text-muted-foreground text-sm">
                    {totalLessons} lessons - {course.duration}
                  </span>
                </div>

                <div className="space-y-4">
                  {curriculum.map((module, moduleIndex) => (
                    <div key={moduleIndex} className="border border-border rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleModule(moduleIndex)}
                        className="w-full p-4 flex items-center justify-between bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                            {moduleIndex + 1}
                          </span>
                          <div className="text-left">
                            <h3 className="font-semibold text-foreground">{module.title}</h3>
                            <p className="text-muted-foreground text-sm">{module.lessons.length} lessons</p>
                          </div>
                        </div>
                        {expandedModules.includes(moduleIndex) ? (
                          <ChevronUp size={20} className="text-muted-foreground" />
                        ) : (
                          <ChevronDown size={20} className="text-muted-foreground" />
                        )}
                      </button>

                      {expandedModules.includes(moduleIndex) && (
                        <div className="divide-y divide-border">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <div
                              key={lessonIndex}
                              className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {lesson.completed ? (
                                  <CheckCircle size={18} className="text-green-500" />
                                ) : lesson.preview ? (
                                  <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                                    {getLessonIcon(lesson.type)}
                                  </div>
                                ) : (
                                  <Lock size={18} className="text-muted-foreground" />
                                )}
                                <div>
                                  <p className={`font-medium ${lesson.completed ? 'text-muted-foreground' : 'text-foreground'}`}>
                                    {lesson.title}
                                  </p>
                                  <p className="text-muted-foreground text-xs capitalize">{lesson.type}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-muted-foreground text-sm">{lesson.duration}</span>
                                {lesson.preview && (
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                    Preview
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-2xl font-bold text-foreground mb-6">Student Reviews</h2>
                
                <div className="flex items-center gap-8 mb-8 p-6 bg-secondary/30 rounded-xl">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-foreground mb-2">{course.rating}</div>
                    <div className="flex gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < Math.floor(course.rating) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}
                        />
                      ))}
                    </div>
                    <p className="text-muted-foreground text-sm">{course.reviews.toLocaleString()} reviews</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map(stars => (
                      <div key={stars} className="flex items-center gap-3">
                        <span className="text-sm w-8">{stars} star</span>
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-yellow-500 rounded-full"
                            style={{ width: `${getStarPercentage(stars)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  {[
                    { name: 'John D.', rating: 5, text: 'Excellent course! The projects really helped solidify my understanding.' },
                    { name: 'Sarah M.', rating: 5, text: 'Best course I have taken. The instructor explains concepts clearly.' },
                    { name: 'Mike R.', rating: 4, text: 'Great content and very practical. Would recommend to anyone starting out.' },
                  ].map((review, i) => (
                    <div key={i} className="border-b border-border pb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                          {review.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{review.name}</p>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-muted-foreground">{review.text}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'instructor' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-2xl font-bold text-foreground mb-6">Your Instructor</h2>
                
                <div className="flex items-start gap-6 mb-8">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-3xl font-bold text-primary">
                    {course.instructor.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-1">{course.instructor}</h3>
                    <p className="text-primary mb-3">Senior Developer and Instructor</p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>4.8 Instructor Rating</span>
                      <span>50,000+ Students</span>
                      <span>12 Courses</span>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4">
                  {course.instructor} is a seasoned developer with over 10 years of experience in the tech industry. 
                  They have worked with leading companies and have a passion for teaching and helping others succeed.
                </p>
                <p className="text-muted-foreground">
                  Their teaching approach focuses on practical, hands-on learning that prepares students 
                  for real-world challenges. Join thousands of students who have transformed their careers 
                  through their courses.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      <Footer />
      <SignUpModal isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} />
    </div>
  );
};

export default CourseDetail;
