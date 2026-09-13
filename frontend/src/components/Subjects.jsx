function Subjects({ data }) {
  const subjects = data?.study_plan || [];

  return (
    <section className="section page-section">
      <div className="section-heading">
        <div>
          <span className="section-label">LEARNING</span>
          <h3>My Subjects</h3>
        </div>
      </div>

      <div className="subjects-grid">
        {subjects.map((subject) => {
          const subjectName = subject.subject.toLowerCase();

          const subjectClass = subjectName.includes("python")
            ? "python"
            : subjectName.includes("database")
              ? "database"
              : "cyber";

          const performance =
            subject.score >= 80
              ? "Excellent"
              : subject.score >= 70
                ? "Good"
                : subject.score >= 50
                  ? "Average"
                  : "Needs attention";

          const urgent = subject.priority === "High" ? " urgent" : "";

          return (
            <article
              className={`subject-card${urgent}`}
              key={subject.subject}
            >
              <div className="subject-top">
                <div className={`subject-icon ${subjectClass}`}>
                  {subjectClass === "python"
                    ? "Py"
                    : subjectClass === "database"
                      ? "DB"
                      : "CS"}
                </div>

                <span className={`priority ${subject.priority.toLowerCase()}`}>
                  {subject.priority}
                </span>
              </div>

              <h4>{subject.subject}</h4>

              <p>{subject.reason}</p>

              <div className="score-row">
                <strong>{subject.score}%</strong>
                <span>{performance}</span>
              </div>

              <div className="progress">
                <div
                  className={`progress-fill ${subjectClass}-fill`}
                  style={{ width: `${subject.score}%` }}
                ></div>
              </div>

              <div className="subject-action">
                <span>{subject.action}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default Subjects;