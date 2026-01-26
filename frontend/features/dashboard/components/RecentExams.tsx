import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Exam {
  id: string;
  title: string;
  status: "ready" | "draft";
  statusLabel: string;
  questionsCount: number;
  gradeLevel: string;
}

const mockExams: Exam[] = [
  {
    id: "1",
    title: "Midterm Exam: Modern History",
    status: "ready",
    statusLabel: "Graded",
    questionsCount: 25,
    gradeLevel: "10th Grade",
  },
  {
    id: "2",
    title: "Physics Final: Thermodynamics",
    status: "draft",
    statusLabel: "Unpublished",
    questionsCount: 40,
    gradeLevel: "12th Grade",
  },
];

function ExamCard({ exam }: { exam: Exam }) {
  const isReady = exam.status === "ready";
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <Badge 
            variant={isReady ? "success" : "warning"}
            className="uppercase text-xs font-bold"
          >
            {exam.status}
          </Badge>
          <span className="text-xs text-muted-foreground italic">
            {exam.statusLabel}
          </span>
        </div>

        <h3 className="font-semibold text-lg mb-3">{exam.title}</h3>
        
        <p className="text-sm text-muted-foreground">
          {exam.questionsCount} Questions • {exam.gradeLevel}
        </p>
      </CardContent>

      <CardFooter className="p-6 pt-0 flex gap-2">
        {isReady ? (
          <>
            <Button className="flex-1">Preview</Button>
            <Button variant="outline" className="flex-1">
              Assign
            </Button>
          </>
        ) : (
          <>
            <Button className="flex-1">Edit Draft</Button>
            <Button variant="outline" className="flex-1">
              Settings
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

export function RecentExams() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Recent Exams</h2>
        <Button variant="link" className="text-primary">
          View all
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {mockExams.map((exam) => (
          <ExamCard key={exam.id} exam={exam} />
        ))}
      </div>
    </div>
  );
}
