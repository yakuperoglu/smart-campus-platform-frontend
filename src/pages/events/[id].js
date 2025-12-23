/**

 * Event Detail Page

 * 

 * Full event details with registration and ticket modal.

    const { user, loading: authLoading } = useContext(AuthContext);



    const [event, setEvent] = useState(null);

    const [registration, setRegistration] = useState(null);

    const [walletBalance, setWalletBalance] = useState(0);

    const [loading, setLoading] = useState(true);

    const [registering, setRegistering] = useState(false);

    const [error, setError] = useState(null);

    const [success, setSuccess] = useState(null);

    const [showTicketModal, setShowTicketModal] = useState(false);



    useEffect(() => {

        if (id) {

            fetchEventData();

        }

    }, [id, user]);



    const fetchEventData = async () => {

        try {

            setLoading(true);

            const eventRes = await api.get(`/events/${id}`);

            setEvent(eventRes.data.data);



            if (user) {

                // Check registration status

                const regsRes = await api.get('/events/registrations');

                const myReg = (regsRes.data.data || []).find(r => r.event_id === id);

                setRegistration(myReg);



                // Get wallet balance for paid events

                if (eventRes.data.data?.is_paid) {

                    const balanceRes = await api.get('/wallet/balance').catch(() => ({ data: { data: { balance: 0 } } }));

                    setWalletBalance(balanceRes.data.data?.balance || 0);

                }

            }

        } catch (err) {

            console.error('Error fetching event:', err);

            setError('Failed to load event details');

        } finally {

            setLoading(false);

        }

    };



    const handleRegister = async () => {

        if (!user) {

            router.push('/login');

            return;

        }



        // Check balance for paid events

        if (event.is_paid && walletBalance < event.price) {

            setError(`Insufficient balance. You need ${event.price} TRY but have ${walletBalance.toFixed(2)} TRY.`);

            return;

        }



        try {

            setRegistering(true);

            setError(null);

            const response = await api.post(`/events/${id}/register`);

            const regData = response.data.data;



            setRegistration(regData.registration);



            if (regData.registration?.status === 'waitlisted') {

                setSuccess(`Added to waitlist! Position: ${regData.waitlist?.position || 'TBD'}`);

            } else {

                setSuccess('Successfully registered! Your ticket is ready.');

                setShowTicketModal(true);

            }



            // Refresh event data

            fetchEventData();

        } catch (err) {

            console.error('Registration error:', err);

            setError(err.response?.data?.message || 'Registration failed');

        } finally {

            setRegistering(false);

        }

    };



    const handleCancelRegistration = async () => {

        if (!confirm('Are you sure you want to cancel your registration?')) return;



        try {

            await api.delete(`/events/registrations/${registration.id}`);

            setRegistration(null);

            setSuccess('Registration cancelled');

            fetchEventData();

        } catch (err) {

            setError(err.response?.data?.message || 'Failed to cancel');

        }

    };



    const formatDate = (dateStr) => {

        return new Date(dateStr).toLocaleDateString('en-US', {

            weekday: 'long',

            year: 'numeric',

            month: 'long',

            day: 'numeric',

            hour: '2-digit',

            minute: '2-digit'

        });

    };



    const getCategoryData = (cat) => {

        const categories = {

            conference: { icon: '🎤', color: '#8B5CF6' },

            workshop: { icon: '🛠️', color: '#F59E0B' },

            seminar: { icon: '📚', color: '#3B82F6' },

            sports: { icon: '⚽', color: '#10B981' },

            social: { icon: '🎊', color: '#EC4899' },

            cultural: { icon: '🎭', color: '#6366F1' }

        };

        return categories[cat] || { icon: '🎉', color: '#8B5CF6' };

    };



    if (loading) {

        return (

            <>

                <Head><title>Event - Smart Campus</title></Head>

                <Navbar />

                <div style={styles.loadingContainer}>

                    <div style={styles.spinner}></div>

                    <p>Loading event...</p>

                </div>

            </>

        );

    }



    if (!event) {

        return (

            <>

                <Head><title>Event Not Found - Smart Campus</title></Head>

                <Navbar />

                <div style={styles.container}>

                    <div style={styles.notFound}>

                        <span style={styles.notFoundIcon}>🔍</span>

                        <h2>Event not found</h2>

                        <Link href="/events" style={styles.backBtn}>Back to Events</Link>

                    </div>

                </div>

            </>

        );

    }



    const catData = getCategoryData(event.category);

    const spotsLeft = event.capacity - (event.registered_count || 0);

    const isFull = spotsLeft <= 0;

    const isPast = new Date(event.date) < new Date();

    const isRegistered = registration && registration.status !== 'cancelled';

    const isWaitlisted = registration?.status === 'waitlisted';



    return (

        <>

            <Head>

                <title>{event.title} - Smart Campus</title>

            </Head>

            <Navbar />



            <div style={styles.container}>

                {/* Back Link */}

<Link href="/events" style={styles.backLink}>

    ← Back to Events

</Link>



{/* Alerts */ }

{
    error && (

        <div style={styles.errorAlert}>

            <span>⚠️ {error}</span>

            <button onClick={() => setError(null)} style={styles.alertClose}>×</button>

        </div>

    )
}

{
    success && (

        <div style={styles.successAlert}>

            <span>✓ {success}</span>

            <button onClick={() => setSuccess(null)} style={styles.alertClose}>×</button>

        </div>

    )
}



<div style={styles.content}>

    {/* Main Content */}

    <div style={styles.mainCol}>

        {/* Header Image */}

        <div style={{

            ...styles.headerImage,

            backgroundImage: event.image_url ? `url(${event.image_url})` : 'none',

            backgroundColor: event.image_url ? 'transparent' : catData.color

        }}>

            {!event.image_url && (

                <span style={styles.headerIcon}>{catData.icon}</span>

            )}

            {isPast && <span style={styles.pastBadge}>Event Ended</span>}

        </div>



        {/* Event Info */}

        <div style={styles.eventInfo}>

            <div style={styles.categoryTag}>

                {catData.icon} {event.category}

            </div>



            <h1 style={styles.eventTitle}>{event.title}</h1>



            <div style={styles.metaRow}>

                <div style={styles.metaItem}>

                    <span style={styles.metaIcon}>📅</span>

                    <span>{formatDate(event.date)}</span>

                </div>

                {event.end_date && (

                    <div style={styles.metaItem}>

                        <span style={styles.metaIcon}>🏁</span>

                        <span>Until {formatDate(event.end_date)}</span>

                    </div>

                )}

                <div style={styles.metaItem}>

                    <span style={styles.metaIcon}>📍</span>

                    <span>{event.location || 'To be announced'}</span>

                </div>

            </div>



            <div style={styles.description}>

                <h3 style={styles.sectionLabel}>About this event</h3>

                <p style={styles.descText}>{event.description || 'No description available.'}</p>

            </div>



            {/* Organizer */}

            {event.organizer && (

                <div style={styles.organizerSection}>

                    <h3 style={styles.sectionLabel}>Organized by</h3>

                    <p>{event.organizer}</p>

                </div>

            )}

        </div>

    </div>



    {/* Sidebar */}

    <div style={styles.sidebar}>

        <div style={styles.sidebarCard}>

            {/* Price */}

            <div style={styles.priceSection}>

                <span style={styles.priceLabel}>

                    {event.is_paid ? 'Ticket Price' : 'Free Event'}

                </span>

                <span style={styles.priceAmount}>

                    {event.is_paid ? `${event.price} TRY` : 'FREE'}

                </span>

            </div>



            {/* Capacity */}

            <div style={styles.capacitySection}>

                <div style={styles.capacityBar}>

                    <div

                        style={{

                            ...styles.capacityFill,

                            width: `${Math.min((event.registered_count / event.capacity) * 100, 100)}%`,

                            backgroundColor: isFull ? '#EF4444' : catData.color

                        }}

                    ></div>

                </div>

                <div style={styles.capacityText}>

                    <span>{event.registered_count || 0} / {event.capacity}</span>

                    <span style={{ color: isFull ? '#EF4444' : '#10B981' }}>

                        {isFull ? 'Full' : `${spotsLeft} spots left`}

                    </span>

                </div>

            </div>



            {/* Balance Warning for Paid Events */}

            {event.is_paid && user && !isRegistered && (

                <div style={{

                    ...styles.balanceInfo,

                    backgroundColor: walletBalance >= event.price ? '#F0FDF4' : '#FEF2F2',

                    borderColor: walletBalance >= event.price ? '#BBF7D0' : '#FECACA'

                }}>

                    <span>Your balance: {walletBalance.toFixed(2)} TRY</span>

                    {walletBalance < event.price && (

                        <Link href="/wallet" style={styles.topUpLink}>Top up →</Link>

                    )}

                </div>

            )}



            {/* Action Buttons */}

            {!isPast && (

                <div style={styles.actionSection}>

                    {isRegistered ? (

                        <>

                            <button

                                onClick={() => setShowTicketModal(true)}

                                style={styles.ticketBtn}

                            >

                                🎫 View My Ticket

                            </button>

                            <button

                                onClick={handleCancelRegistration}

                                style={styles.cancelBtn}

                            >

                                Cancel Registration

                            </button>

                            {isWaitlisted && (

                                <p style={styles.waitlistNote}>

                                    ⏳ You're on the waitlist. We'll notify you if a spot opens up.

                                </p>

                            )}

                        </>

                    ) : (

                        <button

                            onClick={handleRegister}

                            disabled={registering || (event.is_paid && walletBalance < event.price)}

                            style={{

                                ...styles.registerBtn,

                                opacity: (registering || (event.is_paid && walletBalance < event.price)) ? 0.6 : 1

                            }}

                        >

                            {registering ? 'Processing...' : isFull ? 'Join Waitlist' : 'Register Now'}

                        </button>

                    )}

                </div>

            )}



            {isPast && (

                <div style={styles.pastNote}>

                    This event has already ended.

                </div>

            )}

        </div>

    </div>

</div>

            </div >



    {/* Ticket Modal */ }

{
    showTicketModal && registration && (

        <div style={styles.modalOverlay} onClick={() => setShowTicketModal(false)}>

            <div style={styles.ticketModal} onClick={e => e.stopPropagation()}>

                <div style={styles.ticketHeader}>

                    <div style={{ ...styles.ticketBrand, backgroundColor: catData.color }}>

                        <span>{catData.icon}</span>

                        <span>Smart Campus</span>

                    </div>

                    <button style={styles.modalClose} onClick={() => setShowTicketModal(false)}>×</button>

                </div>



                <div style={styles.ticketBody}>

                    <h2 style={styles.ticketTitle}>{event.title}</h2>



                    <div style={styles.ticketMeta}>

                        <div style={styles.ticketMetaItem}>

                            <span style={styles.ticketLabel}>Date</span>

                            <span style={styles.ticketValue}>{formatDate(event.date)}</span>

                        </div>

                        <div style={styles.ticketMetaItem}>

                            <span style={styles.ticketLabel}>Location</span>

                            <span style={styles.ticketValue}>{event.location || 'TBA'}</span>

                        </div>

                        <div style={styles.ticketMetaItem}>

                            <span style={styles.ticketLabel}>Attendee</span>

                            <span style={styles.ticketValue}>{user?.first_name} {user?.last_name}</span>

                        </div>

                    </div>



                    <div style={styles.qrSection}>

                        {registration.qr_code ? (

                            <QRCodeSVG

                                value={registration.qr_code}

                                size={200}

                                level="H"

                                includeMargin={true}

                            />

                        ) : (

                            <div style={styles.noQr}>QR code will be available soon</div>

                        )}

                    </div>



                    <p style={styles.ticketHint}>Show this QR code at the entrance</p>



                    <div style={styles.ticketStatus}>

                        <span style={{

                            ...styles.statusBadge,

                            backgroundColor: registration.status === 'waitlisted' ? '#FEF3C7' : '#D1FAE5',

                            color: registration.status === 'waitlisted' ? '#92400E' : '#065F46'

                        }}>

                            {registration.status === 'waitlisted' ? '⏳ Waitlisted' : '✓ Confirmed'}

                        </span>

                    </div>

                </div>

            </div>

        </div>

    )
}



<style jsx global>{`

        @keyframes spin {

          0% { transform: rotate(0deg); }

          100% { transform: rotate(360deg); }

        }

      `}</style>

        </>

    );

}



const styles = {

    container: {

        maxWidth: '1100px',

        margin: '0 auto',

        padding: '24px',

        fontFamily: 'system-ui, -apple-system, sans-serif'

    },

    loadingContainer: {

        display: 'flex',

        flexDirection: 'column',

        alignItems: 'center',

        justifyContent: 'center',

        height: '60vh',

        color: '#6B7280'

    },

    spinner: {

        width: '40px',

        height: '40px',

        border: '3px solid #E5E7EB',

        borderTop: '3px solid #8B5CF6',

        borderRadius: '50%',

        animation: 'spin 1s linear infinite',

        marginBottom: '16px'

    },

    notFound: {

        textAlign: 'center',

        padding: '80px 20px'

    },

    notFoundIcon: {

        fontSize: '64px',

        display: 'block',

        marginBottom: '16px'

    },

    backBtn: {

        display: 'inline-block',

        marginTop: '16px',

        padding: '12px 24px',

        backgroundColor: '#8B5CF6',

        color: 'white',

        borderRadius: '10px',

        textDecoration: 'none'

    },

    backLink: {

        display: 'inline-flex',

        alignItems: 'center',

        color: '#6B7280',

        textDecoration: 'none',

        fontSize: '14px',

        marginBottom: '20px'

    },

    errorAlert: {

        backgroundColor: '#FEF2F2',

        border: '1px solid #FECACA',

        color: '#DC2626',

        padding: '12px 16px',

        borderRadius: '10px',

        marginBottom: '16px',

        display: 'flex',

        justifyContent: 'space-between'

    },

    successAlert: {

        backgroundColor: '#F0FDF4',

        border: '1px solid #BBF7D0',

        color: '#16A34A',

        padding: '12px 16px',

        borderRadius: '10px',

        marginBottom: '16px',

        display: 'flex',

        justifyContent: 'space-between'

    },

    alertClose: {

        background: 'none',

        border: 'none',

        fontSize: '18px',

        cursor: 'pointer'

    },

    content: {

        display: 'grid',

        gridTemplateColumns: '1fr 360px',

        gap: '32px',

        alignItems: 'start'

    },

    mainCol: {},

    headerImage: {

        height: '300px',

        borderRadius: '20px',

        backgroundSize: 'cover',

        backgroundPosition: 'center',

        display: 'flex',

        alignItems: 'center',

        justifyContent: 'center',

        position: 'relative',

        marginBottom: '24px'

    },

    headerIcon: {

        fontSize: '80px'

    },

    pastBadge: {

        position: 'absolute',

        top: '20px',

        right: '20px',

        padding: '8px 16px',

        backgroundColor: 'rgba(0,0,0,0.7)',

        color: 'white',

        borderRadius: '8px',

        fontWeight: '600'

    },

    eventInfo: {},

    categoryTag: {

        display: 'inline-block',

        padding: '6px 12px',

        backgroundColor: '#F3F4F6',

        borderRadius: '6px',

        fontSize: '13px',

        fontWeight: '600',

        color: '#8B5CF6',

        marginBottom: '12px',

        textTransform: 'capitalize'

    },

    eventTitle: {

        fontSize: '32px',

        fontWeight: '700',

        color: '#111827',

        marginBottom: '20px',

        lineHeight: '1.2'

    },

    metaRow: {

        display: 'flex',

        flexDirection: 'column',

        gap: '12px',

        marginBottom: '32px'

    },

    metaItem: {

        display: 'flex',

        alignItems: 'center',

        gap: '10px',

        fontSize: '15px',

        color: '#374151'

    },

    metaIcon: {

        fontSize: '18px'

    },

    description: {

        marginBottom: '32px'

    },

    sectionLabel: {

        fontSize: '16px',

        fontWeight: '600',

        color: '#111827',

        marginBottom: '12px'

    },

    descText: {

        fontSize: '15px',

        lineHeight: '1.7',

        color: '#4B5563',

        whiteSpace: 'pre-wrap'

    },

    organizerSection: {

        padding: '16px',

        backgroundColor: '#F9FAFB',

        borderRadius: '12px'

    },

    sidebar: {

        position: 'sticky',

        top: '24px'

    },

    sidebarCard: {

        backgroundColor: 'white',

        borderRadius: '20px',

        padding: '24px',

        boxShadow: '0 8px 24px rgba(0,0,0,0.08)'

    },

    priceSection: {

        textAlign: 'center',

        marginBottom: '24px'

    },

    priceLabel: {

        display: 'block',

        fontSize: '13px',

        color: '#6B7280',

        marginBottom: '4px'

    },

    priceAmount: {

        fontSize: '32px',

        fontWeight: '700',

        color: '#111827'

    },

    capacitySection: {

        marginBottom: '20px'

    },

    capacityBar: {

        height: '8px',

        backgroundColor: '#E5E7EB',

        borderRadius: '4px',

        overflow: 'hidden',

        marginBottom: '8px'

    },

    capacityFill: {

        height: '100%',

        borderRadius: '4px',

        transition: 'width 0.3s'

    },

    capacityText: {

        display: 'flex',

        justifyContent: 'space-between',

        fontSize: '13px',

        color: '#6B7280'

    },

    balanceInfo: {

        padding: '12px',

        borderRadius: '10px',

        border: '1px solid',

        marginBottom: '20px',

        display: 'flex',

        justifyContent: 'space-between',

        alignItems: 'center',

        fontSize: '14px'

    },

    topUpLink: {

        color: '#3B82F6',

        fontWeight: '600',

        textDecoration: 'none'

    },

    actionSection: {

        display: 'flex',

        flexDirection: 'column',

        gap: '12px'

    },

    registerBtn: {

        width: '100%',

        padding: '16px',

        backgroundColor: '#8B5CF6',

        color: 'white',

        border: 'none',

        borderRadius: '12px',

        fontSize: '16px',

        fontWeight: '600',

        cursor: 'pointer'

    },

    ticketBtn: {

        width: '100%',

        padding: '16px',

        backgroundColor: '#10B981',

        color: 'white',

        border: 'none',

        borderRadius: '12px',

        fontSize: '16px',

        fontWeight: '600',

        cursor: 'pointer'

    },

    cancelBtn: {

        width: '100%',

        padding: '12px',

        backgroundColor: '#FEF2F2',

        color: '#DC2626',

        border: 'none',

        borderRadius: '10px',

        fontSize: '14px',

        fontWeight: '500',

        cursor: 'pointer'

    },

    waitlistNote: {

        fontSize: '13px',

        color: '#92400E',

        textAlign: 'center',

        padding: '12px',

        backgroundColor: '#FEF3C7',

        borderRadius: '8px'

    },

    pastNote: {

        textAlign: 'center',

        padding: '16px',

        color: '#6B7280',

        backgroundColor: '#F3F4F6',

        borderRadius: '10px'

    },

    // Ticket Modal

    modalOverlay: {

        position: 'fixed',

        top: 0,

        left: 0,

        right: 0,

        bottom: 0,

        backgroundColor: 'rgba(0,0,0,0.7)',

        display: 'flex',

        alignItems: 'center',

        justifyContent: 'center',

        zIndex: 1000,

        padding: '20px'

    },

    ticketModal: {

        backgroundColor: 'white',

        borderRadius: '24px',

        width: '100%',

        maxWidth: '380px',

        overflow: 'hidden'

    },

    ticketHeader: {

        display: 'flex',

        justifyContent: 'space-between',

        alignItems: 'center',

        padding: '16px 20px'

    },

    ticketBrand: {

        display: 'flex',

        alignItems: 'center',

        gap: '8px',

        padding: '8px 14px',

        borderRadius: '8px',

        color: 'white',

        fontWeight: '600',

        fontSize: '14px'

    },

    modalClose: {

        background: 'none',

        border: 'none',

        fontSize: '28px',

        color: '#9CA3AF',

        cursor: 'pointer'

    },

    ticketBody: {

        padding: '0 24px 24px',

        textAlign: 'center'

    },

    ticketTitle: {

        fontSize: '20px',

        fontWeight: '700',

        color: '#111827',

        marginBottom: '20px'

    },

    ticketMeta: {

        display: 'flex',

        flexDirection: 'column',

        gap: '12px',

        marginBottom: '24px',

        textAlign: 'left'

    },

    ticketMetaItem: {

        display: 'flex',

        justifyContent: 'space-between'

    },

    ticketLabel: {

        fontSize: '13px',

        color: '#6B7280'

    },

    ticketValue: {

        fontSize: '13px',

        fontWeight: '500',

        color: '#111827'

    },

    qrSection: {

        display: 'flex',

        justifyContent: 'center',

        padding: '16px',

        backgroundColor: '#F9FAFB',

        borderRadius: '16px',

        marginBottom: '16px'

    },

    noQr: {

        padding: '40px',

        color: '#9CA3AF'

    },

    ticketHint: {

        fontSize: '14px',

        color: '#6B7280',

        marginBottom: '16px'

    },

    ticketStatus: {

        display: 'flex',

        justifyContent: 'center'

    },

    statusBadge: {

        padding: '8px 16px',

        borderRadius: '8px',

        fontSize: '14px',

        fontWeight: '600'

    }

};

// Force SSR to prevent static generation errors
export async function getServerSideProps() {
    return { props: {} };
}
