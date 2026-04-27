'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Student {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  joinedAt: string;
  isActive: boolean;
}

interface StudentListProps {
  students: Student[];
  loading?: boolean;
  onRemoveStudent: (studentId: string) => Promise<void>;
}

export function StudentList({ students, loading = false, onRemoveStudent }: StudentListProps) {
  const { t } = useTranslation('classes');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredStudents = students.filter(
    (student) =>
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRemove = async (student: Student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const confirmRemove = async () => {
    if (!studentToDelete) return;

    setIsDeleting(true);
    try {
      await onRemoveStudent(studentToDelete.id);
      toast.success(
        t('studentList.success.removed', {
          name: `${studentToDelete.firstName} ${studentToDelete.lastName}`,
        })
      );
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    } catch (error) {
      console.error('Failed to remove student:', error);
      toast.error(t('studentList.errors.failed'));
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={`student-skeleton-${i}`}
            className="flex items-center gap-4 p-4 border rounded-lg"
          >
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('studentList.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('studentList.noStudents')}</h3>
            <p className="text-muted-foreground">
              {searchTerm ? t('studentList.noSearchResults') : t('studentList.noStudentsYet')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground">
              <div className="col-span-4">{t('studentList.name')}</div>
              <div className="col-span-4">{t('studentList.email')}</div>
              <div className="col-span-3">{t('studentList.joinedDate')}</div>
              <div className="col-span-1"></div>
            </div>

            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 items-center border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="col-span-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      {student.firstName.charAt(0)}
                      {student.lastName.charAt(0)}
                    </div>
                    <span className="font-medium">
                      {student.firstName} {student.lastName}
                    </span>
                  </div>
                </div>
                <div className="col-span-4 text-sm text-muted-foreground">{student.email}</div>
                <div className="col-span-3 text-sm text-muted-foreground">
                  {new Date(student.joinedAt).toLocaleDateString()}
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button size="sm" variant="ghost" onClick={() => handleRemove(student)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('studentList.removeConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('studentList.removeConfirmDescription', {
                name: `${studentToDelete?.firstName} ${studentToDelete?.lastName}`,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('studentList.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} disabled={isDeleting}>
              {isDeleting ? t('studentList.removing') : t('studentList.removeButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
