
function Settings() {
return ( <section className="section page-section"> <div className="section-heading"> <div> <span className="section-label">PREFERENCES</span> <h3>Settings</h3> </div> </div>


  <article className="settings-card">
    <div className="setting-row">
      <div>
        <strong>Student Profile</strong>
        <span>
          Manage your StudyMate AI profile information.
        </span>
      </div>

      <button className="secondary-button">
        Manage
      </button>
    </div>

    <div className="setting-row">
      <div>
        <strong>Study Preferences</strong>
        <span>
          Configure your preferred learning schedule.
        </span>
      </div>

      <button className="secondary-button">
        Configure
      </button>
    </div>

    <div className="setting-row">
      <div>
        <strong>Notifications</strong>
        <span>
          Control study reminders and learning updates.
        </span>
      </div>

      <button className="secondary-button">
        Manage
      </button>
    </div>
  </article>
</section>


);
}

export default Settings;
