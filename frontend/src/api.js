const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function handleResponse(response) {
  if (!response.ok) {
    let detail = "Something went wrong. Please try again.";
    try {
      const error = await response.json();
      detail = error.detail || detail;
    } catch {
      // response wasn't JSON — keep default message
    }
    throw new Error(detail);
  }
  return response.json();
}

export async function createStudent(studentData) {
  const response = await fetch(`${API_URL}/api/student`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(studentData),
  });

  return handleResponse(response);
}

export async function submitQuiz({ student_name, subject, score }) {
  const response = await fetch(`${API_URL}/api/quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_name, subject, score }),
  });

  return handleResponse(response);
}

export async function getHealth() {
  const response = await fetch(`${API_URL}/api/health`);
  return handleResponse(response);
}

export async function getInsight(studentData) {
  const response = await fetch(`${API_URL}/api/insight`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: studentData.name,
      role: studentData.role,
      study_hours: studentData.study_hours,
      has_deadlines: studentData.has_deadlines,
      subjects: studentData.study_plan.map((s) => ({
        name: s.subject,
        difficulty: s.difficulty,
        score: s.score,
      })),
    }),
  });

  return handleResponse(response);
}

export { API_URL };

export async function sendChatMessage(message, studentContext = null) {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      student_context: studentContext,
    }),
  });
  return handleResponse(response);
}

export async function summarizeNotes(notes, focus = null) {
  const response = await fetch(`${API_URL}/api/summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes, focus }),
  });
  return handleResponse(response);
}

export async function generateQuiz({ topic, difficulty = "Medium", count = 5 }) {
  const response = await fetch(`${API_URL}/api/generate-quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, difficulty, count }),
  });
  return handleResponse(response);
}