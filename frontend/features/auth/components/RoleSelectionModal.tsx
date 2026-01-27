'use client';

import { useState } from 'react';
import { GraduationCap, BookOpen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: 'TEACHER' | 'STUDENT') => void;
}

export function RoleSelectionModal({ isOpen, onClose, onSelectRole }: RoleSelectionModalProps) {
  const [hoveredRole, setHoveredRole] = useState<'TEACHER' | 'STUDENT' | null>(null);

  if (!isOpen) return null;

  const handleSelectRole = (role: 'TEACHER' | 'STUDENT') => {
    onSelectRole(role);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full animate-in zoom-in-95 duration-200 relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* Header */}
          <div className="text-center pt-8 pb-6 px-6">
            <h2 className="text-3xl font-bold text-gray-900">Choose Your Role</h2>
            <p className="text-gray-600 mt-2">Sign in with Google as a teacher or student</p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid grid-cols-2 gap-6 p-6 py-8">
            {/* Teacher Card */}
            <button
              onClick={() => handleSelectRole('TEACHER')}
              onMouseEnter={() => setHoveredRole('TEACHER')}
              onMouseLeave={() => setHoveredRole(null)}
              className={`
                relative overflow-hidden rounded-xl p-8 text-center transition-all duration-300 border-2 will-change-transform
                ${
                  hoveredRole === 'TEACHER'
                    ? 'border-blue-500 shadow-lg shadow-blue-500/20 scale-105'
                    : 'border-gray-200 hover:border-blue-300'
                }
              `}
            >
              {/* Background Gradient */}
              <div
                className={`
                  absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 transition-opacity duration-300
                  ${hoveredRole === 'TEACHER' ? 'opacity-100' : 'opacity-50'}
                `}
              />

              {/* Content */}
              <div className="relative z-10">
                {/* Icon */}
                <div
                  className={`
                    w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-300
                    ${hoveredRole === 'TEACHER' ? 'bg-blue-500 scale-110' : 'bg-blue-400'}
                  `}
                >
                  <GraduationCap className="w-10 h-10 text-white" />
                </div>

                {/* Text */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Teacher</h3>
                <p className="text-sm text-gray-600">Create and manage exams for your students</p>

                {/* Badge - Always rendered to reserve space */}
                <div
                  className={`
                    mt-4 inline-block px-4 py-1 text-xs font-semibold rounded-full transition-all duration-200
                    ${
                      hoveredRole === 'TEACHER'
                        ? 'bg-blue-500 text-white opacity-100 scale-100'
                        : 'bg-transparent text-transparent opacity-0 scale-95'
                    }
                  `}
                >
                  Click to continue
                </div>
              </div>
            </button>

            {/* Student Card */}
            <button
              onClick={() => handleSelectRole('STUDENT')}
              onMouseEnter={() => setHoveredRole('STUDENT')}
              onMouseLeave={() => setHoveredRole(null)}
              className={`
                relative overflow-hidden rounded-xl p-8 text-center transition-all duration-300 border-2 will-change-transform
                ${
                  hoveredRole === 'STUDENT'
                    ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 scale-105'
                    : 'border-gray-200 hover:border-emerald-300'
                }
              `}
            >
              {/* Background Gradient */}
              <div
                className={`
                  absolute inset-0 bg-gradient-to-br from-emerald-50 to-green-100 transition-opacity duration-300
                  ${hoveredRole === 'STUDENT' ? 'opacity-100' : 'opacity-50'}
                `}
              />

              {/* Content */}
              <div className="relative z-10">
                {/* Icon */}
                <div
                  className={`
                    w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-300
                    ${hoveredRole === 'STUDENT' ? 'bg-emerald-500 scale-110' : 'bg-emerald-400'}
                  `}
                >
                  <BookOpen className="w-10 h-10 text-white" />
                </div>

                {/* Text */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Student</h3>
                <p className="text-sm text-gray-600">Take exams and track your progress</p>

                {/* Badge - Always rendered to reserve space */}
                <div
                  className={`
                    mt-4 inline-block px-4 py-1 text-xs font-semibold rounded-full transition-all duration-200
                    ${
                      hoveredRole === 'STUDENT'
                        ? 'bg-emerald-500 text-white opacity-100 scale-100'
                        : 'bg-transparent text-transparent opacity-0 scale-95'
                    }
                  `}
                >
                  Click to continue
                </div>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="p-6 pt-0 text-center">
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
