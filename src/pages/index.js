/**
 * Landing Page - Welcome page for Smart Campus Platform
 * Refactored for Minimal SaaS Aesthetic
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import { BookOpen, MapPin, Coffee, Calendar, ChevronRight, GraduationCap, ShieldCheck, Zap } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-slate-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Student Campus - All-in-One Campus Life</title>
        <meta name="description" content="Manage your entire campus life from a single platform. Academics, attendance, dining, and events at your fingertips." />
      </Head>

      <div className="min-h-screen bg-gray-50/50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">

        {/* Navigation Bar */}
        <header className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 transition-all">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="bg-slate-900 text-white p-1.5 rounded-lg group-hover:scale-105 transition-transform">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900">Student Campus</span>
            </div>

            <nav className="flex items-center gap-6">
              <Link href="/about" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors hidden sm:block">
                About
              </Link>
              <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
              <Link href="/login" className="text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-sm font-bold rounded-lg transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5">
                Get Started
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-grow pt-16">

          {/* Hero Section */}
          <section className="relative overflow-hidden py-24 sm:py-32 bg-white">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

            <div className="max-w-4xl mx-auto px-6 relative text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                New: Spring Semester Registration Open
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-slate-900 tracking-tight mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                Campus life, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">simplified.</span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-500 mb-10 leading-relaxed max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                Manage classes, track attendance, reserve meals, and discover events.
                One platform for your entire academic journey.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                <Link href="/register" className="px-8 py-4 bg-slate-900 hover:bg-black text-white text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
                  Get Started <ChevronRight className="h-4 w-4" />
                </Link>
                <Link href="/login" className="px-8 py-4 bg-white border border-gray-200 text-slate-700 hover:text-slate-900 hover:border-gray-300 text-base font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center">
                  Sign in to account
                </Link>
              </div>

              {/* Trust/Social Proof */}
              <div className="mt-16 pt-8 border-t border-gray-100 animate-in fade-in duration-1000 delay-500">
                <p className="text-sm text-gray-400 font-medium mb-4">TRUSTED BY STUDENTS FROM</p>
                <div className="flex justify-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                  {/* Placeholders for university logos */}
                  <div className="text-xl font-serif font-bold">University</div>
                  <div className="text-xl font-sans font-black tracking-tighter">TECH</div>
                  <div className="text-xl font-mono font-bold">INSTITUTE</div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section className="py-24 bg-gray-50/50">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to succeed</h2>
                <p className="text-slate-500 text-lg">Powerful tools designed to help you focus on what matters most: your education.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  {
                    icon: <BookOpen className="h-6 w-6" />,
                    title: "Academic Hub",
                    desc: "View your schedule, manage course registrations, and track grades in real-time.",
                    color: "bg-blue-50 text-blue-600"
                  },
                  {
                    icon: <MapPin className="h-6 w-6" />,
                    title: "Smart Attendance",
                    desc: "Check in to classes automatically using GPS location services. No more paper sheets.",
                    color: "bg-green-50 text-green-600"
                  },
                  {
                    icon: <Coffee className="h-6 w-6" />,
                    title: "Dining Services",
                    desc: "Browse weekly menus, reserve meals in advance, and manage your dining wallet.",
                    color: "bg-orange-50 text-orange-600"
                  },
                  {
                    icon: <Calendar className="h-6 w-6" />,
                    title: "Campus Events",
                    desc: "Discover workshops, social gatherings, and club activities happening around you.",
                    color: "bg-purple-50 text-purple-600"
                  }
                ].map((feature, i) => (
                  <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 group">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-500 leading-relaxed text-sm">
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How It Works (Steps) */}
          <section className="py-24 bg-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">How it works</h2>
                  <p className="text-slate-500">Get started in minutes.</p>
                </div>
                <Link href="/register" className="text-blue-600 font-bold hover:text-blue-700 flex items-center gap-1 group">
                  Create account <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    step: "01",
                    title: "Create Profile",
                    desc: "Sign up with your student email and verify your identity.",
                    icon: <ShieldCheck className="h-5 w-5" />
                  },
                  {
                    step: "02",
                    title: "Connect",
                    desc: "Sync your courses and set up your wallet for payments.",
                    icon: <Zap className="h-5 w-5" />
                  },
                  {
                    step: "03",
                    title: "Experience",
                    desc: "Start using smart features for attendance and dining.",
                    icon: <GraduationCap className="h-5 w-5" />
                  }
                ].map((item, i) => (
                  <div key={i} className="relative p-8 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="absolute top-8 right-8 text-6xl font-black text-gray-200 opacity-40 select-none">
                      {item.step}
                    </div>
                    <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-slate-900 mb-6 relative z-10">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 relative z-10">{item.title}</h3>
                    <p className="text-slate-500 text-sm relative z-10">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </main>

        {/* Footer */}
        <footer className="bg-slate-900 py-12 text-slate-400 text-sm border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="bg-slate-800 p-1.5 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-white text-lg tracking-tight">Student Campus</span>
              </div>

              <div className="flex gap-8 font-medium">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Support</a>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-800 text-center md:text-left">
              <p>&copy; {new Date().getFullYear()} Smart Campus Platform. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
