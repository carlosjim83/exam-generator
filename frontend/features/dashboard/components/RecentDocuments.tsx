import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Share2, MoreVertical } from "lucide-react";

interface Document {
  id: string;
  name: string;
  modifiedDate: string;
  size: string;
  type: "pdf" | "docx";
}

const mockDocuments: Document[] = [
  {
    id: "1",
    name: "Introduction to Calculus.pdf",
    modifiedDate: "Oct 12, 2023",
    size: "2.4 MB",
    type: "pdf",
  },
  {
    id: "2",
    name: "Organic Chemistry Lab Notes.docx",
    modifiedDate: "Oct 10, 2023",
    size: "1.1 MB",
    type: "docx",
  },
];

function DocumentIcon({ type }: { type: "pdf" | "docx" }) {
  if (type === "pdf") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
        <svg
          className="h-5 w-5 text-red-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
        </svg>
      </div>
    );
  }
  
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
      <FileText className="h-5 w-5 text-blue-600" />
    </div>
  );
}

function DocumentItem({ document }: { document: Document }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <DocumentIcon type={document.type} />
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{document.name}</h4>
        <p className="text-xs text-muted-foreground">
          Modified {document.modifiedDate} • {document.size}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Share2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function RecentDocuments() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Recent Documents</h2>
        <Button variant="link" className="text-primary">
          View all
        </Button>
      </div>
      
      <div className="space-y-2">
        {mockDocuments.map((doc) => (
          <DocumentItem key={doc.id} document={doc} />
        ))}
      </div>
    </div>
  );
}
