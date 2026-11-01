import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import BottomNav from './components/BottomNav/BottomNav'
import TodayPage from './pages/TodayPage/TodayPage'
import PlanPage from './pages/PlanPage/PlanPage'
import PlanWizardPage from './pages/PlanWizardPage/PlanWizardPage'
import RecipesPage from './pages/RecipesPage/RecipesPage'
import RecipeDetailPage from './pages/RecipeDetailPage/RecipeDetailPage'
import AddRecipePage from './pages/AddRecipePage/AddRecipePage'
import ShoppingPage from './pages/ShoppingPage/ShoppingPage'
import SettingsPage from './pages/SettingsPage/SettingsPage'
import HouseholdPage from './pages/HouseholdPage/HouseholdPage'
import MemberWizard from './pages/MemberWizard/MemberWizard'
import MemberProfilePage from './pages/MemberProfilePage/MemberProfilePage'
import styles from './App.module.css'

// Start aplikacji (/). „Udostępnij → mealplanner” z innej aplikacji (share_target w manifeście) otwiera
// /?title=…&text=…&url=… — link do przepisu (w url albo w tekście, np. z Instagrama) → import przepisu.
function Start() {
  const [params] = useSearchParams()
  const shared = ['url', 'text', 'title'].map(k => params.get(k) ?? '').join(' ')
  const link = shared.match(/https?:\/\/[^\s"'<>]+/)?.[0]
  return <Navigate to={link ? `/recipes/new?url=${encodeURIComponent(link)}` : '/today'} replace />
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <div className={styles.app}>
        <div className={styles.bgBlobs} aria-hidden="true" />
        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<Start />} />
            <Route path="/today" element={<TodayPage />} />
            <Route path="/plan" element={<PlanPage />} />
            <Route path="/plan/ai" element={<PlanWizardPage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/new" element={<AddRecipePage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/recipes/:id/edit" element={<AddRecipePage />} />
            <Route path="/shopping" element={<ShoppingPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/household" element={<HouseholdPage />} />
            <Route path="/settings/household/new" element={<MemberWizard />} />
            <Route path="/settings/household/:id" element={<MemberProfilePage />} />
            <Route path="/settings/household/:id/edit" element={<MemberWizard />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
