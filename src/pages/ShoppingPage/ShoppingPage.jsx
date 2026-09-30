import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useShoppingList } from '../../hooks/useShoppingList'
import { getWeekStart, toDateString } from '../../lib/dates'
import styles from './ShoppingPage.module.css'

const WEEK_START_STR = toDateString(getWeekStart())

// Emoji nagłówków kategorii (dopasowanie po fragmencie nazwy, bez wielkości liter)
const CATEGORY_EMOJI = [
  ['warzyw', '🥬'], ['owoc', '🍎'], ['nabiał', '🥛'], ['mięs', '🥩'], ['ryb', '🐟'],
  ['pieczyw', '🍞'], ['przypraw', '🧂'], ['napoj', '🧃'], ['napój', '🧃'], ['mrożon', '🧊'],
  ['słodycz', '🍫'], ['chemi', '🧴'],
]

function categoryEmoji(category) {
  const c = (category || '').toLowerCase()
  return CATEGORY_EMOJI.find(([key]) => c.includes(key))?.[1] ?? '🛒'
}

// Grupowanie z zachowaniem kolejności pierwszego wystąpienia; "Inne" zawsze na końcu
function groupByCategory(items) {
  const groups = new Map()
  for (const item of items) {
    const cat = item.category || 'Inne'
    if (!groups.has(cat)) groups.set(cat, [])
    groups.get(cat).push(item)
  }
  return [...groups.entries()].sort(([a], [b]) => (a === 'Inne') - (b === 'Inne'))
}

export default function ShoppingPage() {
  const { items, loading, addItem, toggleItem, removeItem, clearChecked, generateFromMealPlan } =
    useShoppingList()
  const [shopMode,   setShopMode]   = useState(false)
  const [inputVal,   setInputVal]   = useState('')
  const [generating, setGenerating] = useState(false)
  const [collapsed,  setCollapsed]  = useState(() => new Set())

  const unchecked = items.filter(i => !i.is_checked)
  const checked   = items.filter(i =>  i.is_checked)

  function toggleCategory(cat) {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  async function handleAdd() {
    const name = inputVal.trim()
    if (!name) return
    setInputVal('')
    await addItem({ name })
  }

  async function handleGenerate() {
    setGenerating(true)
    await generateFromMealPlan(WEEK_START_STR)
    setGenerating(false)
  }

  // ─── Tryb sklepowy ─────────────────────────────────────
  if (shopMode) {
    const allDone = items.length > 0 && unchecked.length === 0
    // Portal do <body>: pełny ekran ponad dolną nawigacją
    return createPortal(
      <div className={styles.shopOverlay}>
        <div className={styles.shopTop}>
          <button className={`glass ${styles.shopExitBtn}`} onClick={() => setShopMode(false)} type="button">
            ‹ Lista
          </button>
          <span className={styles.shopTitle}>W sklepie</span>
          <span className={styles.shopCounter}>{checked.length}/{items.length}</span>
        </div>

        <div className={styles.shopList}>
          {unchecked.map(item => (
            <div key={item.id} className={styles.shopItem} onClick={() => toggleItem(item.id)}>
              <span className={styles.shopItemName}>{item.name}</span>
              {item.amount && <span className={styles.shopItemAmount}>{item.amount}</span>}
            </div>
          ))}

          {checked.length > 0 && (
            <div className={styles.shopDoneGroup}>
              {checked.map(item => (
                <div
                  key={item.id}
                  className={[styles.shopItem, styles.shopItemDone].join(' ')}
                  onClick={() => toggleItem(item.id)}
                >
                  <span className={styles.shopItemName}>{item.name}</span>
                  {item.amount && <span className={styles.shopItemAmount}>{item.amount}</span>}
                </div>
              ))}
            </div>
          )}

          {allDone && (
            <div className={styles.shopComplete}>
              <p className={styles.shopCompleteText}>✅ Wszystko kupione!</p>
              <button className="btn-primary" onClick={() => setShopMode(false)} type="button">
                Wróć do listy
              </button>
            </div>
          )}
        </div>
      </div>,
      document.body
    )
  }

  // ─── Tryb edycji ───────────────────────────────────────
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className="page-title">Zakupy</h1>
        {items.length > 0 && (
          <button className={`btn-glow ${styles.shopModeBtn}`} onClick={() => setShopMode(true)} type="button">
            Tryb sklepowy
          </button>
        )}
      </header>

      <button
        className={`glass ${styles.generateBtn}`}
        onClick={handleGenerate}
        disabled={generating}
        type="button"
      >
        {generating ? 'Generuję…' : '✨ Generuj z planu tygodnia'}
      </button>

      <div className={styles.list}>
        {loading && [0, 1, 2, 3].map(i => <div key={i} className={`glass ${styles.skeleton}`} />)}

        {!loading && items.length === 0 && (
          <p className={styles.empty}>
            Lista jest pusta. Dodaj produkt ręcznie lub wygeneruj z planu tygodnia.
          </p>
        )}

        {!loading && groupByCategory(unchecked).map(([cat, catItems]) => {
          const isCollapsed = collapsed.has(cat)
          return (
            <section key={cat} className={styles.group}>
              <button
                className={`glass glow ${styles.categoryHeader}`}
                onClick={() => toggleCategory(cat)}
                type="button"
                aria-expanded={!isCollapsed}
              >
                <span className={styles.categoryEmoji}>{categoryEmoji(cat)}</span>
                <span className={styles.categoryName}>{cat}</span>
                <span className={styles.categoryCount}>{catItems.length}</span>
                <span className={[styles.chevron, isCollapsed ? styles.chevronCollapsed : ''].join(' ')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
              </button>

              {!isCollapsed && catItems.map(item => (
                <div key={item.id} className={`glass glow ${styles.item}`} onClick={() => toggleItem(item.id)}>
                  <span className={styles.checkbox} />
                  <span className={styles.itemText}>
                    <span className={styles.itemName}>{item.name}</span>
                    {item.amount && <span className={styles.itemAmount}>{item.amount}</span>}
                  </span>
                  <button
                    className={styles.removeBtn}
                    onClick={e => { e.stopPropagation(); removeItem(item.id) }}
                    type="button"
                    aria-label={`Usuń ${item.name}`}
                  >×</button>
                </div>
              ))}
            </section>
          )
        })}

        {!loading && checked.length > 0 && (
          <section className={styles.group}>
            <div className={styles.separator}>
              <span>Kupione ({checked.length})</span>
              <button className={styles.clearBtn} onClick={clearChecked} type="button">
                Wyczyść
              </button>
            </div>
            {checked.map(item => (
              <div
                key={item.id}
                className={`glass ${styles.item} ${styles.itemChecked}`}
                onClick={() => toggleItem(item.id)}
              >
                <span className={`${styles.checkbox} ${styles.checkboxChecked}`}>✓</span>
                <span className={styles.itemText}>
                  <span className={styles.itemName}>{item.name}</span>
                  {item.amount && <span className={styles.itemAmount}>{item.amount}</span>}
                </span>
                <button
                  className={styles.removeBtn}
                  onClick={e => { e.stopPropagation(); removeItem(item.id) }}
                  type="button"
                  aria-label={`Usuń ${item.name}`}
                >×</button>
              </div>
            ))}
          </section>
        )}
      </div>

      {/* Pasek dodawania — szklana pigułka nad nawigacją */}
      <div className={styles.addBar}>
        <div className={`glass glow ${styles.addPill}`}>
          <input
            type="text"
            placeholder="Dodaj produkt…"
            className={styles.addInput}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button className={styles.addBtn} onClick={handleAdd} type="button" aria-label="Dodaj produkt">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
