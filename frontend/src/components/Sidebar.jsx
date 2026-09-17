function Sidebar({ activeSection, setActiveSection, studentData }) {
  const navigation = [
    { id: "dashboard", icon: "⌂", label: "Dashboard" },
    { id: "subjects", icon: "▣", label: "My Subjects" },
    { id: "study-plan", icon: "✓", label: "Study Plan" },
    { id: "quiz", icon: "◈", label: "Quiz Performance" },
    { id: "tutor", icon: "✦", label: "AI Tutor" },
  ];

  const studentName = studentData?.name || "Student";
  const studentRole = studentData?.role || "Student";
  const initial = studentName.charAt(0).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">S</div>

        <div>
          <h1>StudyMate</h1>
          <span>AI Learning Platform</span>
        </div>
      </div>

      <nav className="navigation">
        {navigation.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${
              activeSection === item.id ? "active" : ""
            }`}
            onClick={() => setActiveSection(item.id)}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button
          className={`nav-item ${
            activeSection === "settings" ? "active" : ""
          }`}
          onClick={() => setActiveSection("settings")}
        >
          <span>⚙</span>
          Settings
        </button>

        <div className="student-mini-profile">
          <div className="avatar">{initial}</div>

          <div>
            <strong>{studentName}</strong>
            <span>{studentRole}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;