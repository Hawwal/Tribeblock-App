import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { getFeaturedCourses, learningPaths as fallbackLearningPaths, type Course } from '@/lib/courseData';
import { loadCareerPathsWithFallback, loadCoursesWithFallback, type ApiLearningPath } from '@/lib/api';

const CourseCard: React.FC<{ course: Course; index: number }> = ({ course, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="course-card group"
    >
      {/* Course Image Placeholder */}
      <div className="relative h-40 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
        <span className="text-4xl">{course.categorySlug === 'blockchain' ? '⛓️' : course.categorySlug === 'frontend' ? '🎨' : course.categorySlug === 'backend' ? '⚙️' : '📚'}</span>
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            course.level === 'Beginner' ? 'bg-green-100 text-green-700' :
            course.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {course.level}
          </span>
        </div>
      </div>

      {/* Course Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {course.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Star size={14} className="text-yellow-500 fill-yellow-500" />
            <span className="font-medium text-foreground">{course.rating}</span>
            <span>({course.reviews.toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{course.duration}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <Users size={14} />
          <span>{course.students.toLocaleString()} students</span>
        </div>

        {/* Features */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle size={12} className="text-green-500" />
            <span>Text lessons and IDE practice</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle size={12} className="text-green-500" />
            <span>Quizzes and coding exercises</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle size={12} className="text-green-500" />
            <span>{course.projects} Plus/Pro build projects</span>
          </div>
        </div>

        <Link
          to={`/course/${course.slug}`}
          className="btn-primary w-full text-center text-sm py-2.5"
        >
          Start Free
        </Link>
      </div>
    </motion.div>
  );
};

const Courses: React.FC = () => {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>(getFeaturedCourses().slice(0, 6));
  const [learningPaths, setLearningPaths] = useState<ApiLearningPath[]>(fallbackLearningPaths);

  useEffect(() => {
    let isMounted = true;

    Promise.all([loadCoursesWithFallback(), loadCareerPathsWithFallback()]).then(([loadedCourses, loadedPaths]) => {
      if (!isMounted) return;

      setFeaturedCourses(loadedCourses.filter((course) => course.featured).slice(0, 6));
      setLearningPaths(loadedPaths);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="section-padding" id="courses">
      <div className="container mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
            Start Learning Today
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Start with free foundational programming courses, then move into full career paths with guided projects on Plus or Pro
          </p>
        </motion.div>

        {/* Featured Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {featuredCourses.map((course, index) => (
            <CourseCard key={course.id} course={course} index={index} />
          ))}
        </div>

        {/* View All Courses Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
          >
            Browse Career Path Catalog
            <ArrowRight size={18} />
          </Link>
        </motion.div>

        {/* Learning Paths */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
            Recommended Learning Paths
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            {learningPaths.map((path, index) => (
              <motion.div
                key={path.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6 card-hover"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">
                    {path.id === 'blockchain-developer' ? '⛓️' : path.id === 'fullstack-web' ? '🌐' : '📊'}
                  </span>
                  <h4 className="text-lg font-bold text-foreground">{path.title}</h4>
                </div>
                <p className="text-muted-foreground text-sm mb-4">{path.description}</p>
                
                <div className="space-y-2 mb-4">
                  {path.courses.slice(0, 4).map((courseSlug, i) => (
                    <div key={courseSlug} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold">
                        {i + 1}
                      </span>
                      <span className="capitalize">{courseSlug.replace(/-/g, ' ')}</span>
                    </div>
                  ))}
                  {path.courses.length > 4 && (
                    <div className="text-sm text-muted-foreground pl-7">
                      + {path.courses.length - 4} more courses
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>{path.duration}</span>
                  <span>{path.level}</span>
                </div>

                <Link
                  to="/courses"
                  className="btn-primary w-full text-center text-sm py-2.5"
                >
                  View Path Courses
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Courses;
