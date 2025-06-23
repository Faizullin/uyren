import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | LMS Dashboard',
    default: 'LMS Dashboard',
  },
  description: 'Learning Management System - manage lessons, courses, students, and educational content.',
};

export default function LMSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    children
  );
}
