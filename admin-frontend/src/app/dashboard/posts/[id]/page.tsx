import PageContainer from "@/components/common/page-container";
import PostContentEditorPage from "@/features/posts/components/post-content-editor-page";
import { notFound } from "next/navigation";
import "./styles.scss"; // Ensure you have the correct path to your styles

interface PostContentEditorPageProps {
    params: Promise<{ id: string }>;
}

export default async function Page({ params }: PostContentEditorPageProps) {
    const { id } = await params
    if (!id) {
        notFound();
    }
    return (
        <PageContainer scrollable={false}>
            <div className='flex flex-1 flex-col space-y-4'>
                <PostContentEditorPage postId={parseInt(id)} />
            </div>
        </PageContainer>
    );
}
