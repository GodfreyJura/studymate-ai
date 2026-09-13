import { useEffect, useState } from "react";
import "./styles/global.css";
import "./styles/Dashboard.css";
import "./styles/Subjects.css";
import "./styles/StudyPlan.css";
import "./styles/QuizPerformance.css";
import "./styles/Settings.css";
import "./styles/StudentForm.css";
import "./styles/AITutor.css";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Subjects from "./components/Subjects";
import StudyPlan from "./components/StudyPlan";
import QuizPerformance from "./components/QuizPerformance";
import Settings from "./components/Settings";
import StudentForm from "./components/StudentForm";
import AiTutor from "./components/AiTutor";
import { createStudent } from "./api";

const STORAGE_KEY = "studymate-student";

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToStorage(payload) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

function App() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const [savedInput] = useState(loadFromStorage);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(Boolean(savedInput));
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(!savedInput);

  useEffect(() => {
    if (!savedInput) return;

    let ignore = false;

    (async () => {
      try {
        const data = await createStudent(savedInput);
        if (!ignore) {
          setStudentData(data);
          setError("");
        }
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [savedInput]);

  async function refreshPlan(input) {
    const data = await createStudent(input);
    setStudentData(data);
    saveToStorage(input);
  }

  async function handleFormSubmit(input) {
    await refreshPlan(input);
    setShowForm(false);
    setActiveSection("dashboard");
  }

  function handleRetry() {
    const saved = loadFromStorage();
    if (saved) {
      setLoading(true);
      setError("");
      createStudent(saved)
        .then((data) => setStudentData(data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }

  const getSectionTitle = () => {
    const titles = {
      dashboard: "Student Dashboard",
      subjects: "My Subjects",
      "study-plan": "Study Plan",
      quiz: "Quiz Performance",
      tutor: "AI Tutor",
      settings: "Settings",
    };
    return titles[activeSection] || "Student Dashboard";
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h3>Loading your learning data...</h3>
          <p>StudyMate AI is preparing your dashboard.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-state">
          <div className="error-icon">!</div>
          <h3>Unable to load your learning data</h3>
          <p>{error}</p>
          <button className="primary-button" onClick={handleRetry}>
            Try again
          </button>
        </div>
      );
    }

    if (!studentData) return null;

    if (activeSection === "dashboard") return <Dashboard data={studentData} />;
    if (activeSection === "subjects") return <Subjects data={studentData} />;
    if (activeSection === "study-plan") return <StudyPlan data={studentData} />;
    if (activeSection === "quiz") return <QuizPerformance data={studentData} />;
    if (activeSection === "tutor") return <AiTutor data={studentData} />;
    if (activeSection === "settings") return <Settings />;

    return <Dashboard data={studentData} />;
  };

  return (
    <div className="app">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="page-label">STUDYMATE AI</span>
            <h2>{getSectionTitle()}</h2>
          </div>

          <div className="topbar-actions">
            <button
              className="secondary-button"
              onClick={() => setShowForm(true)}
              title="Create a new study plan"
            >
              + New plan
            </button>

            <button
              className="secondary-button"
              onClick={() => setShowForm(true)}
              title="Update your subjects or hours"
            >
              Edit profile
            </button>

            <div className="profile">
              <div className="avatar">
                {(studentData?.name || "S").charAt(0).toUpperCase()}
              </div>

              <div>
                <strong>{studentData?.name || "Student"}</strong>
                <span>{studentData?.role || "Student"}</span>
              </div>
            </div>
          </div>
        </header>

        {renderContent()}
      </main>

      {showForm && (
        <div className="form-modal-backdrop">
          <StudentForm
            onSubmit={handleFormSubmit}
            onCancel={
              savedInput || studentData ? () => setShowForm(false) : undefined
            }
            initialData={loadFromStorage()}
          />
        </div>
      )}
    </div>
  );
}

export default App;