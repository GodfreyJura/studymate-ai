function QuizPerformance({ data }) {
  const subjects = data.study_plan || [];

  const averageScore =
    subjects.length > 0
      ? Math.round(
          subjects.reduce((total, subject) => total + subject.score, 0) /
            subjects.length
        )
      : 0;

  const getPerformance = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Average";
    return "Needs attention";
  };

  const getPerformanceClass = (score) => {
    if (score >= 80) return "excellent";
    if (score >= 70) return "good";
    if (score >= 50) return "average";
    return "needs-attention";
  };

  const strongestSubject =
    subjects.length > 0
      ? subjects.reduce((strongest, subject) =>
          subject.score > strongest.score ? subject : strongest
        )
      : null;

  const weakestSubject =
    subjects.length > 0
      ? subjects.reduce((weakest, subject) =>
          subject.score < weakest.score ? subject : weakest
        )
      : null;

  return (
    <section className="section page-section">
      <div className="section-heading">
        <div>
          <span className="section-label">ASSESSMENT</span>
          <h3>Quiz Performance</h3>
        </div>
      </div>

      <div className="quiz-overview">
        <div className="quiz-average-card">
          <span className="quiz-card-label">OVERALL AVERAGE</span>

          <strong>{averageScore}%</strong>

          <p>
            Your average performance across all subjects.
          </p>

          <div className="quiz-progress">
            <div
              className="quiz-progress-fill"
              style={{ width: `${averageScore}%` }}
            ></div>
          </div>
        </div>

        <div className="quiz-highlight-card">
          <span className="quiz-card-label">STRONGEST SUBJECT</span>

          <h4>
            {strongestSubject
              ? strongestSubject.subject
              : "No data available"}
          </h4>

          <strong>
            {strongestSubject ? `${strongestSubject.score}%` : "--"}
          </strong>

          <p>
            {strongestSubject
              ? getPerformance(strongestSubject.score)
              : "Complete a quiz to see your performance."}
          </p>
        </div>

        <div className="quiz-highlight-card">
          <span className="quiz-card-label">FOCUS AREA</span>

          <h4>
            {weakestSubject
              ? weakestSubject.subject
              : "No data available"}
          </h4>

          <strong>
            {weakestSubject ? `${weakestSubject.score}%` : "--"}
          </strong>

          <p>
            {weakestSubject
              ? "Requires more attention"
              : "Complete a quiz to identify focus areas."}
          </p>
        </div>
      </div>

      <div className="quiz-performance-grid">
        {subjects.map((subject) => {
          const performance = getPerformance(subject.score);
          const performanceClass = getPerformanceClass(subject.score);

          return (
            <article
              className="quiz-subject-card"
              key={subject.subject}
            >
              <div className="quiz-subject-header">
                <div>
                  <span className="section-label">SUBJECT</span>
                  <h4>{subject.subject}</h4>
                </div>

                <span
                  className={`quiz-status ${performanceClass}`}
                >
                  {performance}
                </span>
              </div>

              <div className="quiz-score">
                <strong>{subject.score}%</strong>
                <span>Quiz score</span>
              </div>

              <div className="quiz-progress">
                <div
                  className={`quiz-progress-fill ${performanceClass}`}
                  style={{ width: `${subject.score}%` }}
                ></div>
              </div>

              <p>{subject.action}</p>
            </article>
          );
        })}
      </div>

      <article className="recommendation-card performance-summary">
        <div className="card-title">
          <div className="ai-icon">✦</div>

          <div>
            <span className="section-label">STUDYMATE AI</span>
            <h3>Performance Analysis</h3>
          </div>
        </div>

        <div className="recommendation-content">
          <span className="recommendation-badge">
            AI INSIGHT
          </span>

          <h4>
            {weakestSubject
              ? `${weakestSubject.subject} should be your next focus.`
              : "Keep completing quizzes to build your profile."}
          </h4>

          <p>
            {data.subject_recommendation ||
              "StudyMate AI will analyze your quiz results and recommend where to focus your study time."}
          </p>
        </div>
      </article>
    </section>
  );
}

export default QuizPerformance;