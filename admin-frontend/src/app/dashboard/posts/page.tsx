import PageContainer from "@/components/common/page-container";
import PostListPage from "@/features/posts/components/post-list-page";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Posts',
    description: 'List of posts'
};

export default async function Page() {
    return (
        <PageContainer scrollable={false}>
            <div className='flex flex-1 flex-col space-y-4'>
                <PostListPage />
            </div>
        </PageContainer>
    );
}