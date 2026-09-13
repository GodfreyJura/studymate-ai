function Sidebar({ activeSection, setActiveSection }) {
  const navigation = [
    { id: "dashboard", icon: "⌂", label: "Dashboard" },
    { id: "subjects", icon: "▣", label: "My Subjects" },
    { id: "study-plan", icon: "✓", label: "Study Plan" },
    { id: "quiz", icon: "◈", label: "Quiz Performance" },
    { id: "tutor", icon: "✦", label: "AI Tutor" },
  ];

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
          <div className="avatar">G</div>

          <div>
            <strong>Godfrey</strong>
            <span>Student</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;