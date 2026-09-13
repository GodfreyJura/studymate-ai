from pydantic import BaseModel, Field


class SubjectData(BaseModel):
    name: str
    difficulty: str
    score: int = Field(..., ge=0, le=100)


class StudentData(BaseModel):
    name: str
    role: str
    subjects: list[SubjectData]
    study_hours: float = Field(..., ge=0, le=24)
    has_deadlines: bool = False


class QuizData(BaseModel):
    student_name: str
    subject: str
    score: int = Field(..., ge=0, le=100)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    student_context: dict | None = None


class SummarizeRequest(BaseModel):
    notes: str = Field(..., min_length=1, max_length=20000)
    focus: str | None = None


class QuizGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200)
    difficulty: str = "Medium"
    count: int = Field(5, ge=1, le=10)