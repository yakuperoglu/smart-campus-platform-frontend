/**
 * My Tickets Page
 * 
 * View purchased/registered event tickets with QR codes.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import eventService from '../../services/eventService';
import FeedbackMessage from '../../components/FeedbackMessage';
import { Ticket, Calendar, MapPin, QrCode, ArrowRight, Download, Printer, Clock } from 'lucide-react';

export default function MyTicketsPage() {
    const router = useRouter();
    const { user, logout, loading: authLoading } = useAuth();

    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedTicket, setExpandedTicket] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user) {
            fetchRegistrations();
        }
    }, [user, authLoading]);

    const fetchRegistrations = async () => {
        try {
            setLoading(true);
            const response = await eventService.getMyRegistrations();
            setRegistrations(response.data || []);
        } catch (err) {
            console.error('Error fetching tickets:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout user={user} onLogout={logout}>
            <Head>
                <title>My Tickets - Smart Campus</title>
            </Head>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 animate-in slide-in-from-bottom-2 duration-500">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Tickets</h1>
                    <p className="text-gray-500 mt-1">Access your event passes and QR codes</p>
                </div>
                <div className="mt-4 md:mt-0">
                    <Link href="/events" className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors shadow-sm">
                        Browse Events <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500">Loading tickets...</p>
                </div>
            ) : registrations.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No tickets found</h3>
                    <p className="text-gray-500 mb-6">You haven't registered for any events yet.</p>
                    <Link href="/events" className="text-blue-600 font-bold hover:underline">
                        Browse Upcoming Events
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    {registrations.map(reg => {
                        const event = reg.event || {};
                        const isPast = new Date(event.date) < new Date();

                        return (
                            <div key={reg.id} className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row ${isPast ? 'opacity-75 grayscale' : ''}`}>
                                {/* Date Strip */}
                                <div className="bg-slate-900 text-white p-6 md:w-32 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-800">
                                    <span className="text-xs font-bold uppercase tracking-wider opacity-70">{new Date(event.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                                    <span className="text-3xl font-bold">{new Date(event.date).getDate()}</span>
                                    <span className="text-xs opacity-70">{new Date(event.date).getFullYear()}</span>
                                </div>

                                {/* Ticket Content */}
                                <div className="flex-1 p-6 flex flex-col justify-center">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
                                        {isPast && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-bold">EXPIRED</span>}
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" /> {event.time}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" /> {event.location}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-auto">
                                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 font-mono">
                                            ID: {reg.id.substring(0, 8)}...
                                        </span>
                                        {event.price > 0 && (
                                            <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100">
                                                PAID {event.price}₺
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Ticket Action / QR */}
                                <div className="p-6 border-t md:border-t-0 md:border-l border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-3">
                                    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                                        <QRCodeSVG value={reg.qr_code || reg.id} size={80} level="M" />
                                    </div>
                                    <button
                                        onClick={() => setExpandedTicket(reg)}
                                        className="text-sm font-bold text-slate-900 hover:text-blue-600 flex items-center gap-1"
                                    >
                                        <QrCode className="h-4 w-4" /> Expand QR
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal for Expanded QR */}
            {expandedTicket && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setExpandedTicket(null)}
                >
                    <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl transform scale-100 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="bg-slate-900 p-6 text-white text-center">
                            <h3 className="font-bold text-lg">{expandedTicket.event?.title}</h3>
                            <p className="text-slate-400 text-sm mt-1">{new Date(expandedTicket.event?.date).toDateString()} • {expandedTicket.event?.time}</p>
                        </div>

                        <div className="p-8 flex flex-col items-center">
                            <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-gray-300 mb-6">
                                <QRCodeSVG
                                    value={expandedTicket.qr_code || expandedTicket.id}
                                    size={200}
                                    level="H"
                                />
                            </div>

                            <div className="text-center mb-6">
                                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Ticket Holder</p>
                                <p className="font-bold text-gray-900 text-lg">{user.first_name} {user.last_name}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full">
                                <button className="flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-bold text-sm transition-colors">
                                    <Download className="h-4 w-4" /> Save
                                </button>
                                <button className="flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-colors">
                                    <Printer className="h-4 w-4" /> Print
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
