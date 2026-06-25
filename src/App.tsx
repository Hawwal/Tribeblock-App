import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';

// Pages
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import Accelerator from './pages/Accelerator';
import CourseCatalog from './pages/CourseCatalog';
import CourseDetail from './pages/CourseDetail';
import Learn from './pages/Learn';
import StudentDashboard from './pages/StudentDashboard';
import AuthCallback from './pages/AuthCallback';
import Contributors from './pages/Contributors';
import Rewards from './pages/Rewards';
import AdminDashboard from './pages/AdminDashboard';
import CertificateVerification from './pages/CertificateVerification';

const App = () => {
    const location = useLocation();

    React.useEffect(() => {
        if (!location.hash) return;

        const target = document.querySelector(location.hash);
        window.setTimeout(() => {
            target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    }, [location.pathname, location.hash]);

    return (
        <>
            <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/accelerator" element={<Accelerator />} />
                <Route path="/courses" element={<CourseCatalog />} />
                <Route path="/course/:slug" element={<CourseDetail />} />
                <Route path="/dashboard" element={<StudentDashboard />} />
                <Route path="/contributors" element={<Contributors />} />
                <Route path="/rewards" element={<Rewards />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/certificates/:certificateNumber" element={<CertificateVerification />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/learn/:courseId/:lessonId" element={<Learn />} />
                <Route path="/learn/:courseId" element={<Learn />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
        </>
    );
};

export default App;
