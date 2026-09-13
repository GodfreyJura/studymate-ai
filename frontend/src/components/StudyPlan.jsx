import { useMemo, useState, useEffect } from "react";

const parseDurationToMinutes = (str) => {
  if (!str || typeof str !== "string") return 0;

  const hoursMatch = /(\d+(?:\.\d+)?)\s*h/i.exec(str);
  const minutesMatch = /(\d+(?:\.\d+)?)\s*min/i.exec(str);
  const shortMinutesMatch = /(\d+(?:\.\d+)?)\s*m(?!in)/i.exec(str);

  const hours = hoursMatch ? parseFloat(hoursMatch[1]) * 60 : 0;
  const minutes = minutesMatch
    ? parseFloat(minutesMatch[1])
    : shortMinutesMatch
      ? parseFloat(shortMinutesMatch[1])
      : 0;

  return Math.round(hours + minutes);
};

function StudyPlanItem({
  item,
  index,
  completed,
  active,
  onStart,
  onComplete,
}) {
  const priority = (item.priority ?? "medium").toLowerCase();

  return (
    <article
      className={`study-plan-item ${priority} ${completed ? "completed" : ""} ${
        active ? "active" : ""
      }`}
    >
      <div className="study-plan-number">
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className={`study-marker ${priority}-marker`}></div>

      <div className="study-plan-info">
        <div className="study-plan-header">
          <div>
            <span className="study-plan-subject-label">
              {completed
                ? "COMPLETED SESSION"
                : active
                  ? "CURRENT SESSION"
                  : "STUDY SESSION"}
            </span>

            <h4>{item.subject}</h4>
          </div>

          <span className={`priority ${priority}`}>{item.priority}</span>
        </div>

        <p>{item.action}</p>

        <div className="study-plan-reason">
          <span>Why this is recommended</span>
          <p>{item.reason}</p>
        </div>

        <div className="study-session-actions">
          {!completed && !active && (
            <button
              className="primary-button"
              onClick={() => onStart(item.subject)}
            >
              Start session
            </button>
          )}

          {active && (
            <button
              className="primary-button"
              onClick={() => onComplete(item.subject)}
            >
              Complete session
            </button>
          )}

          {completed && (
            <span className="session-completed">Session completed</span>
          )}
        </div>
      </div>

      <div className="study-plan-duration">
        <span>TIME</span>
        <strong>{item.time}</strong>
      </div>
    </article>
  );
}

function StudyPlan({ data }) {
  const storageKey = `studymate-completed-${data.plan_id ?? "default"}`;

  const [activeSession, setActiveSession] = useState(null);

  // Lazy initializer: reads localStorage once, synchronously, before first
  // render — no effect needed for this, since we're not syncing with an
  // external system on every render, just computing an initial value.
  const [completedSessions, setCompletedSessions] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // This effect is correct as an effect: it syncs React state OUT to an
  // external system (localStorage) whenever completedSessions changes.
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(completedSessions));
  }, [completedSessions, storageKey]);

  const completedSet = useMemo(
    () => new Set(completedSessions),
    [completedSessions]
  );

  const totalMinutes = useMemo(
    () =>
      data.time_plan.reduce(
        (sum, item) => sum + parseDurationToMinutes(item.time),
        0
      ),
    [data.time_plan]
  );

  const totalSessions = data.time_plan.length;

  const completedCount = useMemo(
    () =>
      data.time_plan.filter((item) => completedSet.has(item.subject)).length,
    [data.time_plan, completedSet]
  );

  const progress = totalSessions
    ? Math.round((completedCount / totalSessions) * 100)
    : 0;

  const formatTotalTime = () => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  };

  const startSession = (subject) => {
    setActiveSession(subject);
  };

  const completeSession = (subject) => {
    setCompletedSessions((current) =>
      current.includes(subject) ? current : [...current, subject]
    );
    setActiveSession(null);
  };

  const startNextSession = () => {
    const nextSession = data.time_plan.find(
      (item) => !completedSet.has(item.subject)
    );

    if (nextSession) {
      setActiveSession(nextSession.subject);
    }
  };

  const nextSessionSubject = data.time_plan.find(
    (item) => !completedSet.has(item.subject)
  )?.subject;

  return (
    <section className="section page-section">
      <div className="study-plan-header-section">
        <div>
          <span className="section-label">PERSONALIZED PLAN</span>
          <h3>Today's Study Plan</h3>
          <p>
            StudyMate AI has created this plan based on your performance,
            difficulty and available study time.
          </p>
        </div>

        <div className="study-plan-total">
          <span>Total study time</span>
          <strong>{formatTotalTime()}</strong>
          <small>{data.study_hours} hours available</small>
        </div>
      </div>

      <div className="study-progress-card">
        <div className="study-progress-header">
          <div>
            <span className="section-label">DAILY PROGRESS</span>
            <h4>
              {completedCount} of {totalSessions} sessions completed
            </h4>
          </div>
          <strong>{progress}%</strong>
        </div>

        <div
          className="study-progress"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="study-progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="study-plan-list">
        {data.time_plan.map((item, index) => (
          <StudyPlanItem
            key={`${item.subject}-${index}`}
            item={item}
            index={index}
            completed={completedSet.has(item.subject)}
            active={activeSession === item.subject}
            onStart={startSession}
            onComplete={completeSession}
          />
        ))}
      </div>

      <div className="study-plan-footer">
        <div>
          <span className="section-label">STUDYMATE AI</span>
          <h4>
            {progress === 100
              ? "Excellent work. Today's plan is complete."
              : "Stay consistent with your plan"}
          </h4>
          <p>
            {progress === 100
              ? "You have completed all recommended study sessions for today."
              : "Follow your recommended study sessions and review your performance regularly to improve your learning progress."}
          </p>
        </div>

        {progress < 100 && !activeSession && nextSessionSubject && (
          <button className="primary-button" onClick={startNextSession}>
            Start next: {nextSessionSubject}
          </button>
        )}
      </div>
    </section>
  );
}

export default StudyPlan;