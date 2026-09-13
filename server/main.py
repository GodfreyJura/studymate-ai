import uuid

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import (
    QuizData,
    SubjectData,
    StudentData,
    ChatRequest,
    SummarizeRequest,
    QuizGenerateRequest,
)

from ai import (
    generate_insight,
    chat_reply,
    summarize_notes,
    generate_quiz,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def evaluate_score(score):
    if score >= 80:
        return "Excellent"
    elif score >= 70:
        return "Good"
    elif score >= 50:
        return "Average"
    else:
        return "Needs improvement"


def get_quiz_recommendation(score):
    if score >= 80:
        return "Excellent performance. Continue practicing to maintain your understanding."
    elif score >= 70:
        return "Good performance. Review the areas where you lost marks and keep practicing."
    elif score >= 50:
        return "Average performance. Spend more time reviewing the key concepts before attempting another quiz."
    else:
        return "Your performance needs improvement. Focus on understanding the basics and practice regularly."


def get_quiz_priority(score):
    if score < 50:
        return "High"
    elif score < 70:
        return "Medium"
    else:
        return "Low"


def analyze_quiz(student_name, subject, score):
    return {
        "student": student_name,
        "subject": subject,
        "score": score,
        "performance": evaluate_score(score),
        "recommendation": get_quiz_recommendation(score),
        "priority": get_quiz_priority(score)
    }


def get_learning_action(score):
    if score < 50:
        return "Focus on the fundamentals and practice guided exercises."
    elif score < 70:
        return "Review your weak areas and practice more questions."
    elif score < 80:
        return "Reinforce your understanding and complete additional exercises."
    else:
        return "Maintain your performance and challenge yourself with advanced exercises."


def get_subject_recommendation(subjects):
    weakest_subject = min(
        subjects,
        key=lambda subject: subject.score
    )

    action = get_learning_action(
        weakest_subject.score
    )

    return (
        f"{weakest_subject.name} needs attention. "
        f"Your score is {weakest_subject.score}%. "
        f"{action}"
    )


def get_priority(study_load, study_hours, has_deadlines):
    if has_deadlines and study_hours < 2:
        return "High"
    elif study_load == "Heavy workload" and study_hours < 2:
        return "High"
    elif study_load == "Heavy workload" and study_hours < 4:
        return "Medium"
    else:
        return "Low"


def adjust_priority_by_difficulty(priority, difficulty):
    if difficulty == "Hard":
        if priority == "High":
            return "High"
        elif priority == "Medium":
            return "High"
        else:
            return "Medium"

    elif difficulty == "Medium":
        return priority

    else:
        if priority == "High":
            return "Medium"
        else:
            return priority


def get_subject_priority(
    study_load,
    study_hours,
    has_deadlines,
    difficulty
):
    priority = get_priority(
        study_load,
        study_hours,
        has_deadlines
    )

    return adjust_priority_by_difficulty(
        priority,
        difficulty
    )


def adjust_priority_by_score(priority, score):
    if score < 50:
        return "High"
    elif score < 70:
        if priority == "Low":
            return "Medium"
        return priority
    else:
        return priority


def get_final_subject_priority(
    study_load,
    study_hours,
    has_deadlines,
    difficulty,
    score
):
    priority = get_subject_priority(
        study_load,
        study_hours,
        has_deadlines,
        difficulty
    )

    return adjust_priority_by_score(
        priority,
        score
    )


def get_priority_reason(
    priority,
    difficulty,
    score,
    has_deadlines
):
    if priority == "High":
        if score < 50:
            return (
                f"High priority because your score is {score}%, "
                "which indicates that this subject needs significant improvement."
            )
        elif has_deadlines:
            return (
                "High priority because you have an upcoming deadline "
                "and this subject requires immediate attention."
            )
        elif difficulty == "Hard":
            return (
                "High priority because this is a difficult subject "
                "that requires additional study time."
            )
        else:
            return "High priority because this subject requires immediate attention."

    elif priority == "Medium":
        if score < 70:
            return (
                f"Medium priority because your score is {score}%. "
                "More practice is needed to strengthen your understanding."
            )
        elif difficulty == "Hard":
            return (
                "Medium priority because the subject is difficult "
                "and requires consistent practice."
            )
        else:
            return "Medium priority because this subject needs regular attention."

    else:
        if score >= 80:
            return (
                f"Low priority because your score is {score}%. "
                "Your performance is strong, so focus on maintaining it."
            )
        else:
            return (
                f"Low priority because your score is {score}%. "
                "Continue reviewing the subject consistently."
            )


def get_study_strategy(score, difficulty, priority):
    if score < 50:
        if difficulty == "Hard":
            return [
                "Review the fundamentals step by step.",
                "Break the topic into smaller concepts.",
                "Practice guided examples before attempting difficult questions.",
                "Repeat exercises until the basic concepts are understood."
            ]
        elif difficulty == "Medium":
            return [
                "Review the core concepts.",
                "Identify the topics causing difficulty.",
                "Practice guided questions.",
                "Review mistakes after each exercise."
            ]
        else:
            return [
                "Review the basic concepts.",
                "Practice simple exercises first.",
                "Identify areas where mistakes occur.",
                "Gradually move to more challenging questions."
            ]

    elif score < 70:
        if difficulty == "Hard":
            return [
                "Review the topics where marks were lost.",
                "Practice intermediate problems.",
                "Use worked examples to strengthen understanding.",
                "Test yourself without referring to notes."
            ]
        else:
            return [
                "Review your weak areas.",
                "Practice additional questions.",
                "Correct mistakes and review the concepts behind them.",
                "Take another practice quiz."
            ]

    elif score < 80:
        return [
            "Review the topics where you lost marks.",
            "Complete additional exercises.",
            "Practice applying concepts to new problems.",
            "Take periodic quizzes to reinforce understanding."
        ]

    else:
        if difficulty == "Hard":
            return [
                "Maintain your current understanding.",
                "Practice advanced problems.",
                "Explore challenging applications of the subject.",
                "Use quizzes to test deeper understanding."
            ]

        return [
            "Maintain your current performance.",
            "Complete additional exercises.",
            "Challenge yourself with more advanced questions.",
            "Periodically review the core concepts."
        ]


def get_recommendation(
    study_load,
    study_hours,
    has_deadlines
):
    if has_deadlines and study_hours < 2:
        return (
            "You have upcoming deadlines and limited study time. "
            "Prioritize urgent tasks and create a focused study plan."
        )
    elif study_load == "Heavy workload" and study_hours < 2:
        return (
            "Your workload is heavy and you have limited study time. "
            "Prioritize your most important subjects."
        )
    elif study_load == "Focused" and study_hours >= 2:
        return (
            "You have a focused workload. Use your available time "
            "to master difficult concepts."
        )
    elif study_hours < 1:
        return (
            "Your available study time is very limited. "
            "Try to create a consistent daily study routine."
        )
    elif study_hours <= 4:
        return (
            "You have a manageable study schedule. "
            "Stay consistent and review your subjects regularly."
        )
    else:
        return (
            "You have strong study time available. "
            "Remember to take regular breaks and avoid overloading yourself."
        )


def create_study_plan(
    subjects,
    study_load,
    study_hours,
    has_deadlines
):
    study_plan = []

    for subject in subjects:
        priority = get_final_subject_priority(
            study_load,
            study_hours,
            has_deadlines,
            subject.difficulty,
            subject.score
        )

        reason = get_priority_reason(
            priority,
            subject.difficulty,
            subject.score,
            has_deadlines
        )

        action = get_learning_action(
            subject.score
        )

        strategy = get_study_strategy(
            subject.score,
            subject.difficulty,
            priority
        )

        study_plan.append({
            "subject": subject.name,
            "score": subject.score,
            "difficulty": subject.difficulty,
            "priority": priority,
            "reason": reason,
            "action": action,
            "strategy": strategy
        })

    return study_plan


def allocate_study_time(
    subjects,
    study_hours,
    has_deadlines,
    study_load
):
    priority_weights = {
        "High": 3,
        "Medium": 2,
        "Low": 1
    }

    plan = []
    total_weight = 0

    for subject in subjects:
        priority = get_final_subject_priority(
            study_load,
            study_hours,
            has_deadlines,
            subject.difficulty,
            subject.score
        )

        reason = get_priority_reason(
            priority,
            subject.difficulty,
            subject.score,
            has_deadlines
        )

        action = get_learning_action(
            subject.score
        )

        strategy = get_study_strategy(
            subject.score,
            subject.difficulty,
            priority
        )

        weight = priority_weights[priority]
        total_weight += weight

        plan.append({
            "subject": subject.name,
            "difficulty": subject.difficulty,
            "score": subject.score,
            "priority": priority,
            "reason": reason,
            "action": action,
            "strategy": strategy,
            "weight": weight
        })

    for item in plan:
        allocated_hours = (
            item["weight"] / total_weight
        ) * study_hours

        total_minutes = round(
            allocated_hours * 60
        )

        hours = total_minutes // 60
        minutes = total_minutes % 60

        if hours > 0 and minutes > 0:
            item["time"] = f"{hours} hour {minutes} minutes"
        elif hours > 0:
            item["time"] = f"{hours} hour"
        else:
            item["time"] = f"{minutes} minutes"

        del item["weight"]

    return plan


# ============================================================
# Routes
# ============================================================


@app.get("/api/health")
def health_check():
    student = {
        "name": "Godfrey",
        "role": "Student",
        "subjects": [
            "Python",
            "Database Systems",
            "Cybersecurity"
        ]
    }

    learning = []

    for subject in student["subjects"]:
        learning.append(
            "I am currently learning " + subject
        )

    return {
        "app": "StudyMate AI",
        "version": "1.0",
        "status": "running",
        "developer": "Godfrey Jura",
        "project_type": "AI Study Platform",
        "backend": "Python + FastAPI",
        "student": student,
        "learning": learning
    }


@app.get("/api/quiz")
def quiz(
    student_name: str,
    subject: str,
    score: int
):
    if not (0 <= score <= 100):
        raise HTTPException(
            status_code=400,
            detail="Score must be between 0 and 100"
        )

    return analyze_quiz(
        student_name,
        subject,
        score
    )


@app.post("/api/quiz")
def submit_quiz(data: QuizData):
    return analyze_quiz(
        data.student_name,
        data.subject,
        data.score
    )


@app.get("/api/score-priority-test")
def score_priority_test():
    return {
        "original_priority": "Low",
        "score": 45,
        "final_priority": adjust_priority_by_score(
            "Low",
            45
        )
    }


@app.get("/api/final-priority-test")
def final_priority_test():
    priority = get_final_subject_priority(
        "Balanced",
        3,
        True,
        "Hard",
        45
    )

    return {
        "study_load": "Balanced",
        "study_hours": 3,
        "has_deadlines": True,
        "difficulty": "Hard",
        "score": 45,
        "final_priority": priority,
        "reason": get_priority_reason(
            priority,
            "Hard",
            45,
            True
        ),
        "action": get_learning_action(45),
        "strategy": get_study_strategy(
            45,
            "Hard",
            priority
        )
    }


@app.post("/api/student")
def create_student(data: StudentData):
    if not data.name:
        raise HTTPException(
            status_code=400,
            detail="Student name is required"
        )

    if not data.subjects:
        raise HTTPException(
            status_code=400,
            detail="At least one subject is required"
        )

    total_subjects = len(data.subjects)

    if total_subjects <= 2:
        study_load = "Focused"
    elif total_subjects <= 4:
        study_load = "Balanced"
    else:
        study_load = "Heavy workload"

    learning_message = (
        f"I am currently studying {total_subjects} subjects."
    )

    learning_plan = [
        f"I am studying {subject.name}"
        for subject in data.subjects
    ]

    recommendation = get_recommendation(
        study_load,
        data.study_hours,
        data.has_deadlines
    )

    subject_recommendation = get_subject_recommendation(
        data.subjects
    )

    priority = get_priority(
        study_load,
        data.study_hours,
        data.has_deadlines
    )

    study_plan = create_study_plan(
        data.subjects,
        study_load,
        data.study_hours,
        data.has_deadlines
    )

    time_plan = allocate_study_time(
        data.subjects,
        data.study_hours,
        data.has_deadlines,
        study_load
    )

    return {
        "plan_id": str(uuid.uuid4()),
        "name": data.name,
        "role": data.role,
        "total_subjects": total_subjects,
        "learning_message": learning_message,
        "learning_plan": learning_plan,
        "study_load": study_load,
        "study_hours": data.study_hours,
        "has_deadlines": data.has_deadlines,
        "recommendation": recommendation,
        "subject_recommendation": subject_recommendation,
        "priority": priority,
        "study_plan": study_plan,
        "time_plan": time_plan
    }


@app.post("/api/insight")
def create_insight(data: StudentData):
    """Get a personalized AI insight for the student's current plan."""
    if not data.name:
        raise HTTPException(status_code=400, detail="Student name is required")

    if not data.subjects:
        raise HTTPException(status_code=400, detail="At least one subject is required")

    total_subjects = len(data.subjects)

    if total_subjects <= 2:
        study_load = "Focused"
    elif total_subjects <= 4:
        study_load = "Balanced"
    else:
        study_load = "Heavy workload"

    study_plan = create_study_plan(
        data.subjects,
        study_load,
        data.study_hours,
        data.has_deadlines,
    )

    student_data = {
        "name": data.name,
        "role": data.role,
        "study_hours": data.study_hours,
        "has_deadlines": data.has_deadlines,
        "study_load": study_load,
        "study_plan": study_plan,
    }

    insight = generate_insight(student_data)

    return {"insight": insight}


@app.post("/api/chat")
def chat(data: ChatRequest):
    """AI tutor chat — one question, one answer."""
    if not data.message.strip():
        raise HTTPException(status_code=400, detail="Message is required")

    reply = chat_reply(data.message.strip(), data.student_context)
    return {"reply": reply}


@app.post("/api/summarize")
def summarize(data: SummarizeRequest):
    """Summarize study notes."""
    if not data.notes.strip():
        raise HTTPException(status_code=400, detail="Notes are required")

    summary = summarize_notes(data.notes.strip(), data.focus)
    return {"summary": summary}


@app.post("/api/generate-quiz")
def generate_quiz_route(data: QuizGenerateRequest):
    """Generate quiz questions on a topic."""
    if not data.topic.strip():
        raise HTTPException(status_code=400, detail="Topic is required")

    quiz = generate_quiz(data.topic.strip(), data.difficulty, data.count)
    return {"quiz": quiz}