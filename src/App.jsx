import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import BottomNav from './components/BottomNav/BottomNav'
import TodayPage from './pages/TodayPage/TodayPage'
import PlanPage from './pages/PlanPage/PlanPage'
import RecipesPage from './pages/RecipesPage/RecipesPage'
import RecipeDetailPage from './pages/RecipeDetailPage/RecipeDetailPage'
import ShoppingPage from './pages/ShoppingPage/ShoppingPage'
import styles from './App.module.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className={styles.app}>
        <div className={styles.bgBlobs} aria-hidden="true" />
        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<Navigate to="/today" replace />} />
            <Route path="/today" element={<TodayPage />} />
            <Route path="/plan" element={<PlanPage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/shopping" element={<ShoppingPage />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
