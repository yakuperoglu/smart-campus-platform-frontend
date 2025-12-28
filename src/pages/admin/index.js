import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AdminDashboard from '../../components/admin/AdminDashboard';

export default function AdminPage() {
    const router = useRouter();

    useEffect(() => {
        // Check if user is admin
        if (typeof window !== 'undefined') {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.role !== 'admin') {
                router.push('/dashboard');
            }
        }
    }, [router]);

    return (
        <>
            <Head>
                <title>Admin Console | Smart Campus</title>
            </Head>
            <div className="admin-page">
                <div className="page-header">
                    <h1>Admin Console</h1>
                    <p>Manage your campus platform</p>
                </div>

                {/* Quick Management Links */}
                <div className="management-cards">
                    <Link href="/admin/courses" className="mgmt-card courses">
                        <span className="card-icon">📚</span>
                        <div className="card-content">
                            <h3>Course Management</h3>
                            <p>Add, edit, delete courses and sections</p>
                        </div>
                    </Link>

                    <Link href="/admin/users" className="mgmt-card users">
                        <span className="card-icon">👥</span>
                        <div className="card-content">
                            <h3>User Management</h3>
                            <p>Manage students, faculty and admins</p>
                        </div>
                    </Link>

                    <Link href="/admin/scheduling" className="mgmt-card schedule">
                        <span className="card-icon">📅</span>
                        <div className="card-content">
                            <h3>Schedule Management</h3>
                            <p>Generate and manage class schedules</p>
                        </div>
                    </Link>

                    <Link href="/admin/events" className="mgmt-card events">
                        <span className="card-icon">🎉</span>
                        <div className="card-content">
                            <h3>Event Management</h3>
                            <p>Create and manage campus events</p>
                        </div>
                    </Link>

                    <Link href="/admin/menus" className="mgmt-card menus">
                        <span className="card-icon">🍽️</span>
                        <div className="card-content">
                            <h3>Menu Management</h3>
                            <p>Manage cafeteria menus</p>
                        </div>
                    </Link>

                    <Link href="/admin/departments" className="mgmt-card departments">
                        <span className="card-icon">🏛️</span>
                        <div className="card-content">
                            <h3>Department Management</h3>
                            <p>Add and manage departments</p>
                        </div>
                    </Link>

                    <Link href="/excuse-management" className="mgmt-card excuses">
                        <span className="card-icon">📝</span>
                        <div className="card-content">
                            <h3>Excuse Management</h3>
                            <p>Review and approve student excuses</p>
                        </div>
                    </Link>
                </div>

                <AdminDashboard />

                <style jsx global>{`
                    .admin-page {
                        padding: 2rem;
                        max-width: 1400px;
                        margin: 0 auto;
                    }
                    .page-header {
                        margin-bottom: 2rem;
                    }
                    .page-header h1 {
                        font-size: 2rem;
                        font-weight: 700;
                        color: #1a1a1a;
                        margin-bottom: 0.5rem;
                    }
                    .page-header p {
                        color: #666;
                        font-size: 1rem;
                    }
                    .management-cards {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                        gap: 1.5rem;
                        margin-bottom: 2rem;
                    }
                    .mgmt-card {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        padding: 1.5rem;
                        border-radius: 12px;
                        color: white;
                        text-decoration: none;
                        transition: transform 0.2s, box-shadow 0.2s;
                    }
                    .mgmt-card:hover {
                        transform: translateY(-4px);
                    }
                    .mgmt-card.courses {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        box-shadow: 0 4px 6px rgba(102, 126, 234, 0.25);
                    }
                    .mgmt-card.courses:hover {
                        box-shadow: 0 8px 15px rgba(102, 126, 234, 0.35);
                    }
                    .mgmt-card.users {
                        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
                        box-shadow: 0 4px 6px rgba(17, 153, 142, 0.25);
                    }
                    .mgmt-card.users:hover {
                        box-shadow: 0 8px 15px rgba(17, 153, 142, 0.35);
                    }
                    .mgmt-card.schedule {
                        background: linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%);
                        box-shadow: 0 4px 6px rgba(255, 65, 108, 0.25);
                    }
                    .mgmt-card.schedule:hover {
                        box-shadow: 0 8px 15px rgba(255, 65, 108, 0.35);
                    }
                    .mgmt-card.events {
                        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                        box-shadow: 0 4px 6px rgba(240, 147, 251, 0.25);
                    }
                    .mgmt-card.events:hover {
                        box-shadow: 0 8px 15px rgba(240, 147, 251, 0.35);
                    }
                    .mgmt-card.menus {
                        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                        box-shadow: 0 4px 6px rgba(79, 172, 254, 0.25);
                    }
                    .mgmt-card.menus:hover {
                        box-shadow: 0 8px 15px rgba(79, 172, 254, 0.35);
                    }
                    .mgmt-card.departments {
                        background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
                        box-shadow: 0 4px 6px rgba(250, 112, 154, 0.25);
                    }
                    .mgmt-card.departments:hover {
                        box-shadow: 0 8px 15px rgba(250, 112, 154, 0.35);
                    }
                    .mgmt-card.excuses {
                        background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
                        box-shadow: 0 4px 6px rgba(168, 237, 234, 0.25);
                        color: #333;
                    }
                    .mgmt-card.excuses:hover {
                        box-shadow: 0 8px 15px rgba(168, 237, 234, 0.35);
                    }
                    .mgmt-card.excuses h3 {
                        color: #333;
                    }
                    .card-icon {
                        font-size: 2.5rem;
                    }
                    .card-content h3 {
                        font-size: 1.1rem;
                        font-weight: 600;
                        margin-bottom: 0.25rem;
                        color: white;
                    }
                    .card-content p {
                        font-size: 0.875rem;
                        opacity: 0.9;
                        margin: 0;
                    }
                `}</style>
            </div>
        </>
    );
}
