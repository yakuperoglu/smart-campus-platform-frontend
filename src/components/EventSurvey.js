
import React, { useState, useEffect } from 'react';
import eventService from '../services/eventService';

export default function EventSurvey({ eventId, user }) {
    const [survey, setSurvey] = useState(null);
    const [response, setResponse] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        if (eventId && user) {
            fetchSurveyData();
        }
    }, [eventId, user]);

    const fetchSurveyData = async () => {
        try {
            setLoading(true);

            // Parallel fetch: survey structure and user's response
            const [surveyRes, responseRes] = await Promise.all([
                eventService.getSurvey(eventId).catch(() => null),
                eventService.getSurveyResponse(eventId).catch(() => null)
            ]);

            // Check if survey exists
            // getSurvey returns the survey object directly or nested? 
            // Assuming service returns `response.data` which is `{ data: survey }`
            // Let's assume the service handles the response unwrapping or returns the axios response.
            // Based on service code:
            // getSurvey: (eventId) => api.get(...)
            // So we get axios response.

            const surveyData = surveyRes?.data?.data;
            const responseData = responseRes?.data?.data;

            setSurvey(surveyData);
            setResponse(responseData);

            if (responseData) {
                setAnswers(responseData.answers || {});
            }

        } catch (err) {
            console.error('Error fetching survey:', err);
            // Don't show error if survey just doesn't exist (404)
            if (err.response?.status !== 404) {
                setError('Failed to load survey');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!survey) return;

        // Validation
        const missing = survey.questions.filter(q => q.required && !answers[q.id]);
        if (missing.length > 0) {
            setError(`Please answer all required questions: ${missing.map(q => q.text).join(', ')}`);
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            await eventService.submitSurvey(eventId, { answers });

            setSuccess('Thank you for your feedback!');
            fetchSurveyData(); // Refresh to show read-only view
        } catch (err) {
            console.error('Survey submission error:', err);
            setError(err.response?.data?.message || 'Failed to submit survey');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="survey-loading">Loading survey...</div>;
    if (!survey) return null; // No survey for this event

    const isReadOnly = !!response;

    return (
        <div className="event-survey-container">
            <h3>📝 {survey.title}</h3>
            <p className="survey-desc">{survey.description}</p>

            {success && <div className="survey-alert success">{success}</div>}
            {error && <div className="survey-alert error">{error}</div>}

            <form onSubmit={handleSubmit}>
                {survey.questions.map((q, idx) => (
                    <div key={q.id} className="survey-question">
                        <label className="question-label">
                            <span className="q-number">{idx + 1}.</span> {q.text}
                            {q.required && <span className="required">*</span>}
                        </label>

                        {q.type === 'text' && (
                            <textarea
                                className="survey-input text-input"
                                value={answers[q.id] || ''}
                                onChange={(e) => handleInputChange(q.id, e.target.value)}
                                disabled={isReadOnly}
                                rows={3}
                                placeholder="Your answer..."
                            />
                        )}

                        {q.type === 'rating' && (
                            <div className="rating-input">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <label key={star} className={`rating-star ${answers[q.id] >= star ? 'active' : ''}`}>
                                        <input
                                            type="radio"
                                            name={q.id}
                                            value={star}
                                            checked={answers[q.id] === star}
                                            onChange={() => handleInputChange(q.id, star)}
                                            disabled={isReadOnly}
                                        />
                                        ★
                                    </label>
                                ))}
                            </div>
                        )}

                        {q.type === 'multiple_choice' && (
                            <div className="mc-input">
                                {q.options.map((opt, optIdx) => (
                                    <label key={optIdx} className="mc-option">
                                        <input
                                            type="radio"
                                            name={q.id}
                                            value={opt}
                                            checked={answers[q.id] === opt}
                                            onChange={(e) => handleInputChange(q.id, e.target.value)}
                                            disabled={isReadOnly}
                                        />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {!isReadOnly && (
                    <button type="submit" className="submit-btn" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                )}
                {isReadOnly && (
                    <div className="survey-submitted-msg">
                        ✓ You have already submitted this survey.
                    </div>
                )}
            </form>

            <style jsx>{`
                .event-survey-container {
                    background: #fff;
                    padding: 24px;
                    border-radius: 16px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    margin-top: 32px;
                }
                .survey-desc {
                    color: #6B7280;
                    margin-bottom: 24px;
                }
                .survey-question {
                    margin-bottom: 24px;
                }
                .question-label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 12px;
                    color: #374151;
                }
                .required {
                    color: #EF4444;
                    margin-left: 4px;
                }
                .survey-input {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #D1D5DB;
                    border-radius: 8px;
                    font-family: inherit;
                }
                .submit-btn {
                    background: #8B5CF6;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .submit-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                .survey-alert {
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                }
                .success {
                    background: #DEF7EC;
                    color: #03543F;
                }
                .error {
                    background: #FDE8E8;
                    color: #9B1C1C;
                }
                .rating-input {
                    display: flex;
                    gap: 8px;
                }
                .rating-star {
                    cursor: pointer;
                    font-size: 24px;
                    color: #D1D5DB;
                    transition: color 0.2s;
                }
                .rating-star.active {
                    color: #F59E0B;
                }
                .rating-star input {
                    display: none;
                }
                .mc-option {
                    display: block;
                    margin-bottom: 8px;
                    cursor: pointer;
                }
                .mc-option input {
                    margin-right: 8px;
                }
                .survey-submitted-msg {
                    color: #10B981;
                    font-weight: 600;
                    text-align: center;
                    padding: 12px;
                    background: #D1FAE5;
                    border-radius: 8px;
                }
            `}</style>
        </div>
    );
}
