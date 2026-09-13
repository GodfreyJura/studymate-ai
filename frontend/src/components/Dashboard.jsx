import { useEffect, useState } from "react";
import Subjects from "./Subjects";
import { getInsight } from "../api";

function Dashboard({ data }) {
  const averageScore =
    data.study_plan.length > 0
      ? Math.round(
          data.study_plan.reduce(
            (total, subject) => total + subject.score,
            0
          ) / data.study_plan.length
        )
      : 0;

  return (
    <>
      <AIInsightCard data={data} />

      <section className="welcome-card">
        <div>
          <span className="welcome-label">YOUR LEARNING OVERVIEW</span>
          <h3>Stay consistent. Keep improving.</h3>
          <p>
            StudyMate AI is analyzing your learning progress and helping you
            focus on what matters most.
          </p>
        </div>

        <div className="welcome-decoration">
          <span>AI</span>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          title="Total Subjects"
          value={data.total_subjects}
          description="Currently studying"
          icon="▣"
        />
        <StatCard
          title="Study Time"
          value={`${data.study_hours} hrs`}
          description="Available today"
          icon="◷"
        />
        <StatCard
          title="Study Load"
          value={data.study_load}
          description="Manageable workload"
          icon="◈"
        />
        <StatCard
          title="Average Score"
          value={`${averageScore}%`}
          description="Across all subjects"
          icon="★"
        />
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <span className="section-label">PERFORMANCE</span>
            <h3>Your Subjects</h3>
          </div>
        </div>

        <Subjects data={data} />
      </section>

      <section className="bottom-grid">
        <RecommendationCard data={data} />
        <StudyPlanCard data={data} />
      </section>
    </>
  );
}

function AIInsightCard({ data }) {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const result = await getInsight(data);
        if (!ignore) setInsight(result.insight);
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [data]);

  return (
    <section className="ai-insight-card">
      <div className="card-title">
        <div className="ai-icon">✦</div>
        <div>
          <span className="section-label">STUDYMATE AI</span>
          <h3>AI Insight</h3>
        </div>
      </div>

      <div className="ai-insight-body">
        {loading && (
          <p className="ai-insight-loading">Analyzing your study data...</p>
        )}

        {!loading && error && (
          <p className="ai-insight-error">
            Couldn't reach the AI: {error}
          </p>
        )}

        {!loading && !error && insight && <p>{insight}</p>}
      </div>
    </section>
  );
}

function StatCard({ title, value, description, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span>{title}</span>
        <div className="stat-icon">{icon}</div>
      </div>

      <strong>{value}</strong>
      <small>{description}</small>
    </div>
  );
}

function RecommendationCard({ data }) {
  const weakestSubject = data.study_plan.reduce((weakest, subject) =>
    subject.score < weakest.score ? subject : weakest
  );

  return (
    <article className="recommendation-card">
      <div className="card-title">
        <div className="ai-icon">✦</div>

        <div>
          <span className="section-label">STUDYMATE AI</span>
          <h3>AI Recommendation</h3>
        </div>
      </div>

      <div className="recommendation-content">
        <span className="recommendation-badge">
          {weakestSubject.priority} priority
        </span>

        <h4>{weakestSubject.subject} needs attention.</h4>

        <p>
          Your score is <strong>{weakestSubject.score}%</strong>.{" "}
          {weakestSubject.action}
        </p>
      </div>

      <button className="primary-button">Start focused study →</button>
    </article>
  );
}

function StudyPlanCard({ data }) {
  return (
    <article className="today-card">
      <div className="card-title">
        <div>
          <span className="section-label">TODAY</span>
          <h3>Study Plan</h3>
        </div>

        <span className="time-total">{data.study_hours} hours</span>
      </div>

      {data.time_plan.map((item) => (
        <div className="study-item" key={item.subject}>
          <div
            className={`study-marker ${item.priority.toLowerCase()}-marker`}
          ></div>

          <div className="study-info">
            <strong>{item.subject}</strong>
            <span>{item.action}</span>
          </div>

          <strong>{item.time}</strong>
        </div>
      ))}
    </article>
  );
}

export default Dashboard;