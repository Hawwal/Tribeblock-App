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


class AdminRouteBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: unknown) {
        console.error('Admin dashboard render failed', error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <main className="min-h-screen bg-background flex items-center justify-center px-4">
                    <section className="max-w-xl rounded-lg border border-border bg-card p-6 text-center">
                        <h1 className="text-2xl font-bold text-foreground mb-2">Admin Dashboard Could Not Load</h1>
                        <p className="text-muted-foreground mb-5">
                            Refresh the page. If this keeps happening, sign out and sign back in so your admin session refreshes.
                        </p>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="btn-primary px-5 py-3"
                        >
                            Reload Admin
                        </button>
                    </section>
                </main>
            );
        }

        return this.props.children;
    }
}

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
                <Route path="/admin" element={<AdminRouteBoundary><AdminDashboard /></AdminRouteBoundary>} />
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
