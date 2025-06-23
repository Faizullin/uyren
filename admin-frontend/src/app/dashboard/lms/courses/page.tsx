import PageContainer from "@/components/common/page-container";
import CourseListPage from "@/features/courses/components/course-list-page";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Courses',
    description: 'Manage your courses'
};

export default async function Page() {
    return (
        <PageContainer scrollable={false}>
            <div className='flex flex-1 flex-col space-y-4'>
                <CourseListPage />
            </div>
        </PageContainer>
    );
}
