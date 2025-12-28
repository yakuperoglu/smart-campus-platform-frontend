/**
 * About Page
 * Refactored for Minimal SaaS Aesthetic
 */

import Head from 'next/head';
import Link from 'next/link';
import { GraduationCap, Target, Users, Zap, ShieldCheck, ChevronRight, Globe, Heart } from 'lucide-react';

export default function About() {
  return (
    <>
      <Head>
        <title>About Us - Student Campus</title>
        <meta name="description" content="Learn more about Smart Campus. The integrated platform transforming university life." />
      </Head>

      <div className="min-h-screen bg-gray-50/50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">

        {/* Navigation Bar (Consistent with Landing Page) */}
        <header className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 transition-all">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer">
              <div className="bg-slate-900 text-white p-1.5 rounded-lg group-hover:scale-105 transition-transform">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900">Student Campus</span>
            </Link>

            <nav className="flex items-center gap-6">
              <Link href="/about" className="text-sm font-bold text-slate-900 transition-colors">
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
          <section className="relative overflow-hidden py-20 sm:py-28 bg-white border-b border-gray-100">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>

            <div className="max-w-4xl mx-auto px-6 relative text-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
                We are building the <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">future of education.</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                Smart Campus is an all-in-one platform designed to make university life more efficient, connected, and accessible for everyone.
              </p>
            </div>
          </section>

          {/* Mission & Vision Grid */}
          <section className="py-20 bg-gray-50/50">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold">
                    <Target className="h-3 w-3" /> Our Mission
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">Simplifying the complex ecosystem of campus life.</h2>
                  <p className="text-slate-500 text-lg leading-relaxed">
                    We believe that technology should be an enabler, not a barrier. By integrating academic management, attendance tracking, dining services, and campus events into one cohesive ecosystem, we empower students to focus on what really matters: learning.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
                      <Users className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">Community</h3>
                    <p className="text-sm text-slate-500">Bridging the gap between students and faculty.</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center translate-y-8">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4">
                      <Zap className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">Efficiency</h3>
                    <p className="text-sm text-slate-500">Saving hours of administrative work daily.</p>
                  </div>
                </div>
              </div>

              {/* Values */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: <Globe className="h-6 w-6" />,
                    title: "Accessible",
                    desc: "Available anywhere, anytime, on any device. Education has no boundaries."
                  },
                  {
                    icon: <ShieldCheck className="h-6 w-6" />,
                    title: "Secure",
                    desc: "Enterprise-grade security to protect sensitive student and faculty data."
                  },
                  {
                    icon: <Heart className="h-6 w-6" />,
                    title: "User-Centric",
                    desc: "Built with the end-user in mind, ensuring a delightful experience for all."
                  }
                ].map((value, i) => (
                  <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center mb-6 shadow-md">
                      {value.icon}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{value.title}</h3>
                    <p className="text-slate-500">{value.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 bg-white border-t border-gray-100">
            <div className="max-w-4xl mx-auto px-6 text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Ready to join the future?</h2>
              <div className="flex justify-center gap-4">
                <Link href="/register" className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
                  Get Started Now <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-12 pt-12 border-t border-gray-100">
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-4">Contact Us</p>
                <a href="mailto:support@smartcampus.com" className="text-2xl font-bold text-slate-900 hover:text-blue-600 transition-colors">
                  support@smartcampus.com
                </a>
              </div>
            </div>
          </section>

        </main>

        {/* Footer (Consistent with Landing Page) */}
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
