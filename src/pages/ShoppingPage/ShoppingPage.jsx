import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useShoppingList } from '../../hooks/useShoppingList'
import { getWeekStart, toDateString, getWeekRange } from '../../lib/dates'
import { categoryEmoji, categoryOrder } from '../../lib/shopping'
import styles from './ShoppingPage.module.css'

// Zakres generowania: bieżący tydzień od dziś (nie kupujemy na miniony dzień) albo cały następny
function weekRanges() {
  const today = new Date()
  const thisStart = getWeekStart(today)
  const thisEnd = new Date(thisStart); thisEnd.setDate(thisEnd.getDate() + 6)
  const nextStart = new Date(thisStart); nextStart.setDate(nextStart.getDate() + 7)
  const nextEnd = new Date(nextStart); nextEnd.setDate(nextEnd.getDate() + 6)
  return {
    current: { from: toDateString(today), to: toDateString(thisEnd), label: 'Ten tydzień', sub: `od dziś do ${thisEnd.getDate()}.${String(thisEnd.getMonth() + 1).padStart(2, '0')}` },
    next:    { from: toDateString(nextStart), to: toDateString(nextEnd), label: 'Następny tydzień', sub: getWeekRange(nextStart) },
  }
}

// Grupy w kolejności sklepowej (src/lib/shopping.js → CATEGORIES)
function groupByCategory(items) {
  const groups = new Map()
  for (const item of items) {
    const cat = item.category || 'Inne'
    if (!groups.has(cat)) groups.set(cat, [])
    groups.get(cat).push(item)
  }
  return [...groups.entries()].sort(([a], [b]) => categoryOrder(a) - categoryOrder(b))
}

function plural(n, one, few, many) {
  if (n === 1) return one
  const d = n % 10, dd = n % 100
  return d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? few : many
}

export default function ShoppingPage() {
  const { items, loading, addItem, toggleItem, removeItem, clearChecked, generateFromMealPlan, hasOpenAutoItems } =
    useShoppingList()
  const [askMode,    setAskMode]    = useState(false) // pytanie: zastąpić czy dopisać
  const [shopMode,   setShopMode]   = useState(false)
  const [inputVal,   setInputVal]   = useState('')
  const [generating, setGenerating] = useState(false)
  const [collapsed,  setCollapsed]  = useState(() => new Set())
  const [range,      setRange]      = useState('current')
  const [genResult,  setGenResult]  = useState(null) // { text, warn? }
  const ranges = weekRanges()

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

  function handleGenerateClick() {
    setGenResult(null)
    // Na liście są niekupione produkty z planu → zapytaj, czy zastąpić czy dopisać
    if (hasOpenAutoItems) setAskMode(true)
    else handleGenerate('replace')
  }

  async function handleGenerate(mode) {
    setAskMode(false)
    setGenerating(true)
    setGenResult(null)
    const { from, to } = ranges[range]
    const { error, stats } = await generateFromMealPlan({ from, to, mode })
    setGenerating(false)

    if (error) { setGenResult({ text: 'Nie udało się wygenerować listy. Spróbuj ponownie.', warn: true }); return }
    if (!stats.meals) { setGenResult({ text: 'W tym okresie nic nie jest zaplanowane.', warn: true }); return }

    const parts = []
    if (stats.items) {
      parts.push(`Dodano ${stats.items} ${plural(stats.items, 'produkt', 'produkty', 'produktów')} z ${stats.recipes} ${plural(stats.recipes, 'przepisu', 'przepisów', 'przepisów')}${stats.updated ? ` (${stats.updated} zsumowano z listą)` : ''}.`)
    } else {
      parts.push('Zaplanowane posiłki nie mają przepisów ze składnikami.')
    }
    if (stats.withoutRecipe.length) {
      const names = [...new Set(stats.withoutRecipe)]
      parts.push(`Bez przepisu (dodaj ręcznie, co trzeba): ${names.slice(0, 4).join(', ')}${names.length > 4 ? '…' : ''}.`)
    }
    if (stats.items && !stats.aiUsed) parts.push('AI chwilowo niedostępne — kategorie dobrane automatycznie, nazwy bez ujednolicenia.')
    setGenResult({ text: parts.join(' '), warn: !stats.items })
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
          {/* Kolejność alejek: kategorie jak w sklepie, z małymi nagłówkami */}
          {groupByCategory(unchecked).map(([cat, catItems]) => {
            const isCollapsed = collapsed.has(cat)
            return (
              <div key={cat}>
                <button
                  className={styles.shopCategory}
                  onClick={() => toggleCategory(cat)}
                  type="button"
                  aria-expanded={!isCollapsed}
                >
                  <span className={styles.shopCategoryName}>{categoryEmoji(cat)} {cat}</span>
                  <span className={styles.shopCategoryCount}>{catItems.length}</span>
                  <span className={[styles.chevron, isCollapsed ? styles.chevronCollapsed : ''].join(' ')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
                  </span>
                </button>
                {!isCollapsed && catItems.map(item => (
                  <div key={item.id} className={styles.shopItem} onClick={() => toggleItem(item.id)}>
                    <span className={styles.shopItemName}>{item.name}</span>
                    {item.amount && <span className={styles.shopItemAmount}>{item.amount}</span>}
                  </div>
                ))}
              </div>
            )
          })}

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

      <div className={styles.generateBox}>
        <div className={styles.rangeRow} role="radiogroup" aria-label="Zakres planu">
          {Object.entries(ranges).map(([key, r]) => (
            <button
              key={key}
              className={`${styles.rangeChip} ${range === key ? styles.rangeOn : ''}`}
              onClick={() => setRange(key)}
              type="button"
              role="radio"
              aria-checked={range === key}
            >
              <span>{r.label}</span>
              <span className={styles.rangeSub}>{r.sub}</span>
            </button>
          ))}
        </div>
        {askMode ? (
          <div className={`glass ${styles.askBox}`}>
            <p>Na liście są już niekupione produkty z planu. Co zrobić?</p>
            <div className={styles.askActions}>
              <button className={`btn-glow ${styles.askBtn}`} onClick={() => handleGenerate('replace')} type="button">
                Zastąp listę
              </button>
              <button className={`btn-primary ${styles.askBtn}`} onClick={() => handleGenerate('append')} type="button">
                Dopisz i zsumuj
              </button>
            </div>
            <button className={styles.askCancel} onClick={() => setAskMode(false)} type="button">Anuluj</button>
          </div>
        ) : (
          <button
            className={`glass ${styles.generateBtn}`}
            onClick={handleGenerateClick}
            disabled={generating}
            type="button"
          >
            {generating ? 'Zbieram składniki…' : '✨ Generuj z planu'}
          </button>
        )}
        {genResult && (
          <p className={`${styles.genResult} ${genResult.warn ? styles.genWarn : ''}`}>{genResult.text}</p>
        )}
      </div>

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
