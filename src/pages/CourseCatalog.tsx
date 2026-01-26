import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Star, Clock, Users, Filter, Grid, List, CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SignUpModal from '@/components/SignUpModal';
import { courses, categories, type Course } from '@/lib/courseData';

const CourseCatalog: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get('category') ? [searchParams.get('category')!] : []
  );
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const filteredCourses = useMemo(() => {
    let result = [...courses];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        course =>
          course.title.toLowerCase().includes(query) ||
          course.description.toLowerCase().includes(query) ||
          course.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter(course => selectedCategories.includes(course.categorySlug));
    }

    // Level filter
    if (selectedLevel) {
      result = result.filter(course => course.level === selectedLevel);
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => b.students - a.students);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        result.sort((a, b) => b.id.localeCompare(a.id));
        break;
      case 'az':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'duration':
        result.sort((a, b) => parseInt(a.duration) - parseInt(b.duration));
        break;
    }

    return result;
  }, [searchQuery, selectedCategories, selectedLevel, sortBy]);

  const toggleCategory = (slug: string) => {
    setSelectedCategories(prev =>
      prev.includes(slug)
        ? prev.filter(c => c !== slug)
        : [...prev, slug]
    );
  };

  const CourseCard: React.FC<{ course: Course; index: number }> = ({ course, index }) => {
    if (viewMode === 'list') {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-card rounded-xl border border-border p-4 flex gap-4 card-hover"
        >
          <div className="w-32 h-24 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl">
              {course.categorySlug === 'blockchain' ? '⛓️' : 
               course.categorySlug === 'frontend' ? '🎨' : 
               course.categorySlug === 'backend' ? '⚙️' : 
               course.categorySlug === 'database' ? '🗄️' :
               course.categorySlug === 'mobile' ? '📱' :
               course.categorySlug === 'devops' ? '☁️' :
               course.categorySlug === 'data-science' ? '🤖' : '📚'}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link to={`/course/${course.slug}`}>
                  <h3 className="font-bold text-foreground hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                </Link>
                <p className="text-muted-foreground text-sm line-clamp-1 mt-1">
                  {course.description}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
                course.level === 'Beginner' ? 'bg-green-100 text-green-700' :
                course.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {course.level}
              </span>
            </div>
            
            <div className="flex items-center gap-6 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                <span className="font-medium text-foreground">{course.rating}</span>
                <span>({course.reviews.toLocaleString()})</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{course.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users size={14} />
                <span>{course.students.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <Link
            to={`/course/${course.slug}`}
            className="btn-primary text-sm px-4 py-2 self-center"
          >
            View Course
          </Link>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="course-card group"
      >
        <div className="relative h-36 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <span className="text-4xl">
            {course.categorySlug === 'blockchain' ? '⛓️' : 
             course.categorySlug === 'frontend' ? '🎨' : 
             course.categorySlug === 'backend' ? '⚙️' : 
             course.categorySlug === 'database' ? '🗄️' :
             course.categorySlug === 'mobile' ? '📱' :
             course.categorySlug === 'devops' ? '☁️' :
             course.categorySlug === 'data-science' ? '🤖' : '📚'}
          </span>
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

        <div className="p-4">
          <Link to={`/course/${course.slug}`}>
            <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-1">
              {course.title}
            </h3>
          </Link>
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
            {course.description}
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Star size={12} className="text-yellow-500 fill-yellow-500" />
              <span className="font-medium text-foreground">{course.rating}</span>
              <span>({course.reviews.toLocaleString()})</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{course.duration}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <Users size={12} />
            <span>{course.students.toLocaleString()} students</span>
          </div>

          <div className="space-y-1 mb-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle size={10} className="text-green-500" />
              <span>Interactive</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle size={10} className="text-green-500" />
              <span>{course.projects} Projects</span>
            </div>
          </div>

          <Link
            to={`/course/${course.slug}`}
            className="btn-primary w-full text-center text-sm py-2"
          >
            Start Free
          </Link>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onSignUpClick={() => setIsSignUpOpen(true)} />
      
      <main className="container mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
            Browse Our Courses
          </h1>
          <p className="text-muted-foreground text-lg">
            {courses.length} courses available with hands-on projects and interactive learning
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 px-4 py-2 border border-border rounded-lg"
            >
              <Filter size={18} />
              Filters
            </button>

            {/* Category Filters */}
            <div className={`${showFilters ? 'flex' : 'hidden'} md:flex flex-wrap gap-2`}>
              {categories.map(category => (
                <button
                  key={category.slug}
                  onClick={() => toggleCategory(category.slug)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    selectedCategories.includes(category.slug)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:border-primary hover:text-primary'
                  }`}
                >
                  {category.icon} {category.name}
                </button>
              ))}
            </div>

            {/* Level Filter */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
              <option value="az">A-Z</option>
              <option value="duration">Duration</option>
            </select>

            {/* View Toggle */}
            <div className="flex items-center border border-border rounded-lg overflow-hidden ml-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-muted-foreground mb-6">
          Showing {filteredCourses.length} courses
          {selectedCategories.length > 0 && ` in ${selectedCategories.length} categories`}
        </p>

        {/* Course Grid/List */}
        {filteredCourses.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? 'grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
            : 'space-y-4'
          }>
            {filteredCourses.map((course, index) => (
              <CourseCard key={course.id} course={course} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No courses found matching your criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategories([]);
                setSelectedLevel('');
              }}
              className="mt-4 text-primary hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </main>

      <Footer />
      <SignUpModal isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} />
    </div>
  );
};

export default CourseCatalog;