import PageContainer from "@/components/common/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Activity,
    Calendar,
    FileText
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: 'Dashboard',
    description: 'Admin dashboard overview'
};

export default async function DashboardPage() {
    return (
        <PageContainer>
            <div className="flex flex-1 flex-col space-y-8">
                {/* Welcome Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>                    <p className="text-muted-foreground">
                        Here&apos;s what&apos;s happening with your content today.
                    </p>
                </div>

                {/* Quick Stats Cards
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">24</div>
                            <p className="text-xs text-muted-foreground">
                                <span className="text-green-600">+2</span> from last month
                            </p>
                        </CardContent>
                    </Card>                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Media Files</CardTitle>
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">156</div>
                            <p className="text-xs text-muted-foreground">
                                <span className="text-green-600">+12</span> from last month
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">1,234</div>
                            <p className="text-xs text-muted-foreground">
                                <span className="text-green-600">+15%</span> from last week
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">89</div>
                            <p className="text-xs text-muted-foreground">
                                <span className="text-green-600">+3</span> from yesterday
                            </p>
                        </CardContent>
                    </Card>
                </div> */}

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Quick Actions
                            </CardTitle>
                            <CardDescription>
                                Get started with common tasks
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Link href="/dashboard/posts" className="block">
                                <Button variant="outline" className="w-full justify-start gap-2">
                                    <FileText className="h-4 w-4" />
                                    Manage Posts
                                </Button>
                            </Link>

                            {/* <Button variant="outline" className="w-full justify-start gap-2">
                                <PlusCircle className="h-4 w-4" />
                                Create New Post
                            </Button>
                            <Button variant="outline" className="w-full justify-start gap-2">
                                <ImageIcon className="h-4 w-4" />
                                Media Library
                            </Button>
                            
                            <Button variant="outline" className="w-full justify-start gap-2">
                                <BarChart3 className="h-4 w-4" />
                                View Analytics
                            </Button> */}
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Recent Activity
                            </CardTitle>
                            <CardDescription>
                                Your latest content updates
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between border-b border-border pb-3">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">New post published</p>
                                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                                </div>
                                <Badge variant="secondary">Published</Badge>
                            </div>

                            <div className="flex items-center justify-between border-b border-border pb-3">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Media files uploaded</p>
                                    <p className="text-xs text-muted-foreground">4 hours ago</p>
                                </div>
                                <Badge variant="outline">Media</Badge>
                            </div>

                            <div className="flex items-center justify-between border-b border-border pb-3">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Post updated</p>
                                    <p className="text-xs text-muted-foreground">Yesterday</p>
                                </div>
                                <Badge variant="secondary">Updated</Badge>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Draft saved</p>
                                    <p className="text-xs text-muted-foreground">2 days ago</p>
                                </div>
                                <Badge variant="outline">Draft</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* System Status
                <Card>
                    <CardHeader>
                        <CardTitle>System Status</CardTitle>
                        <CardDescription>
                            Everything is running smoothly
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                <span className="text-sm">Server Status</span>
                                <Badge variant="secondary" className="ml-auto">Operational</Badge>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                <span className="text-sm">Database</span>
                                <Badge variant="secondary" className="ml-auto">Healthy</Badge>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                <span className="text-sm">CDN</span>
                                <Badge variant="secondary" className="ml-auto">Online</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card> */}
            </div>
        </PageContainer>
    );
}
