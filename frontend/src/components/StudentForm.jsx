import { useState } from "react";

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const emptySubject = () => ({
  name: "",
  difficulty: "Medium",
  score: 50,
});

function StudentForm({ onSubmit, onCancel, initialData }) {
  const [name, setName] = useState(initialData?.name || "");
  const [role, setRole] = useState(initialData?.role || "Student");
  const [studyHours, setStudyHours] = useState(
    initialData?.study_hours ?? 3
  );
  const [hasDeadlines, setHasDeadlines] = useState(
    initialData?.has_deadlines ?? false
  );
  const [subjects, setSubjects] = useState(
    initialData?.subjects?.length
      ? initialData.subjects.map((s) => ({
          name: s.name,
          difficulty: s.difficulty,
          score: s.score,
        }))
      : [emptySubject()]
  );

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateSubject = (index, field, value) => {
    setSubjects((current) =>
      current.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const addSubject = () => {
    setSubjects((current) => [...current, emptySubject()]);
  };

  const removeSubject = (index) => {
    setSubjects((current) => {
      if (current.length === 1) return current; // keep at least 1
      return current.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    const cleanedSubjects = subjects
      .map((s) => ({
        name: s.name.trim(),
        difficulty: s.difficulty,
        score: Number(s.score),
      }))
      .filter((s) => s.name.length > 0);

    if (cleanedSubjects.length === 0) {
      setError("Add at least one subject with a name.");
      return;
    }

    for (const s of cleanedSubjects) {
      if (Number.isNaN(s.score) || s.score < 0 || s.score > 100) {
        setError(`Score for "${s.name}" must be between 0 and 100.`);
        return;
      }
    }

    const payload = {
      name: name.trim(),
      role: role.trim() || "Student",
      study_hours: Number(studyHours),
      has_deadlines: hasDeadlines,
      subjects: cleanedSubjects,
    };

    try {
      setSubmitting(true);
      await onSubmit(payload);
    } catch (err) {
      setError(err.message || "Failed to save. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="student-form-page">
      <div className="student-form-card">
        <div className="student-form-header">
          {onCancel && (
            <button
              type="button"
              className="form-close-button"
              onClick={onCancel}
              title="Close"
            >
              ×
            </button>
          )}

          <span className="section-label">GET STARTED</span>
          <h1>Welcome to StudyMate AI</h1>
          <p>
            Tell us about your subjects and study time. StudyMate AI will
            build a personalized plan for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="student-form">
          <div className="form-row">
            <label>
              <span>Your name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Godfrey"
                autoFocus
              />
            </label>

            <label>
              <span>Role</span>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Student"
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              <span>Study hours available today</span>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={studyHours}
                onChange={(e) => setStudyHours(e.target.value)}
              />
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={hasDeadlines}
                onChange={(e) => setHasDeadlines(e.target.checked)}
              />
              <span>I have upcoming deadlines</span>
            </label>
          </div>

          <div className="subjects-section">
            <div className="subjects-header">
              <div>
                <span className="section-label">SUBJECTS</span>
                <h3>What are you studying?</h3>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={addSubject}
              >
                + Add subject
              </button>
            </div>

            <div className="subject-rows">
              {subjects.map((subject, index) => (
                <div className="subject-row" key={index}>
                  <input
                    type="text"
                    placeholder="Subject name"
                    value={subject.name}
                    onChange={(e) =>
                      updateSubject(index, "name", e.target.value)
                    }
                  />

                  <select
                    value={subject.difficulty}
                    onChange={(e) =>
                      updateSubject(index, "difficulty", e.target.value)
                    }
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Score"
                    value={subject.score}
                    onChange={(e) =>
                      updateSubject(index, "score", e.target.value)
                    }
                  />

                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => removeSubject(index)}
                    disabled={subjects.length === 1}
                    title={
                      subjects.length === 1
                        ? "You need at least one subject"
                        : "Remove subject"
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <button
            type="submit"
            className="primary-button form-submit"
            disabled={submitting}
          >
            {submitting ? "Building your plan..." : "Generate my study plan →"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default StudentForm;