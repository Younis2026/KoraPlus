import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { Layout } from '@/components/layout';
import { AdminLayout } from '@/components/admin-layout';
import { AuthProvider } from '@/components/auth-provider';
import HomePage from '@/pages/home';
import MatchesPage from '@/pages/matches';
import MatchDetailPage from '@/pages/match-detail';
import PredictionsPage from '@/pages/predictions';
import NewsPage from '@/pages/news';
import NewsArticlePage from '@/pages/news-article';
import ProfilePage from '@/pages/profile';
import ProfileSetupPage from '@/pages/profile-setup';
import LeaderboardPage from '@/pages/leaderboard';
import NotFound from '@/pages/not-found';

import AdminLoginPage from '@/pages/admin-login';
import AdminDashboardPage from '@/pages/admin-dashboard';
import AdminMatchesPage from '@/pages/admin-matches';
import AdminNewsPage from '@/pages/admin-news';
import AdminPredictionsPage from '@/pages/admin-predictions';
import AdminUsersPage from '@/pages/admin-users';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* Admin Routes — must be declared before main Layout route */}
      <Route path="/admin" component={() => <AdminLayout><AdminLoginPage /></AdminLayout>} />
      <Route path="/admin/dashboard" component={() => <AdminLayout><AdminDashboardPage /></AdminLayout>} />
      <Route path="/admin/matches" component={() => <AdminLayout><AdminMatchesPage /></AdminLayout>} />
      <Route path="/admin/news" component={() => <AdminLayout><AdminNewsPage /></AdminLayout>} />
      <Route path="/admin/predictions" component={() => <AdminLayout><AdminPredictionsPage /></AdminLayout>} />
      <Route path="/admin/users" component={() => <AdminLayout><AdminUsersPage /></AdminLayout>} />
      
      {/* Main App Routes */}
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/matches" component={MatchesPage} />
            <Route path="/matches/:id" component={MatchDetailPage} />
            <Route path="/predictions" component={PredictionsPage} />
            <Route path="/news" component={NewsPage} />
            <Route path="/news/:id" component={NewsArticlePage} />
            <Route path="/leaderboard" component={LeaderboardPage} />
            <Route path="/profile" component={ProfilePage} />
            <Route path="/profile/setup" component={ProfileSetupPage} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
