import { useState } from 'react'
import { useShoppingList } from '../../hooks/useShoppingList'
import { getWeekStart, toDateString } from '../../lib/dates'
import styles from './ShoppingPage.module.css'

const WEEK_START_STR = toDateString(getWeekStart())

export default function ShoppingPage() {
  const { items, loading, addItem, toggleItem, removeItem, clearChecked, generateFromMealPlan } =
    useShoppingList()
  const [shopMode,   setShopMode]   = useState(false)
  const [inputVal,   setInputVal]   = useState('')
  const [generating, setGenerating] = useState(false)

  const unchecked = items.filter(i => !i.is_checked)
  const checked   = items.filter(i =>  i.is_checked)

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
    return (
      <div className={styles.shopOverlay}>
        <div className={styles.shopTop}>
          <span className={styles.shopTitle}>Tryb sklepowy</span>
          <button className={styles.shopExitBtn} onClick={() => setShopMode(false)} type="button">
            ✕ Wyjdź
          </button>
        </div>

        <div className={styles.shopList}>
          {unchecked.map(item => (
            <div key={item.id} className={styles.shopItem} onClick={() => toggleItem(item.id)}>
              <span className={styles.shopCheck} />
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
                  <span className={[styles.shopCheck, styles.shopCheckDone].join(' ')}>✓</span>
                  <span className={styles.shopItemName}>{item.name}</span>
                  {item.amount && <span className={styles.shopItemAmount}>{item.amount}</span>}
                </div>
              ))}
            </div>
          )}

          {allDone && (
            <div className={styles.shopComplete}>
              <p className={styles.shopCompleteText}>✅ Wszystko kupione!</p>
              <button className={styles.shopExitBtn} onClick={() => setShopMode(false)} type="button">
                Wyjdź
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── Tryb edycji ───────────────────────────────────────
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Zakupy</h1>
        {items.length > 0 && (
          <button className={styles.shopModeBtn} onClick={() => setShopMode(true)} type="button">
            🛒 Sklep
          </button>
        )}
      </header>

      <button
        className={styles.generateBtn}
        onClick={handleGenerate}
        disabled={generating}
        type="button"
      >
        {generating ? '…' : '✨ Generuj z planu tygodnia'}
      </button>

      <div className={styles.list}>
        {loading && [0, 1, 2, 3].map(i => <div key={i} className={styles.skeleton} />)}

        {!loading && items.length === 0 && (
          <p className={styles.empty}>
            Lista jest pusta. Dodaj produkt ręcznie lub wygeneruj z planu tygodnia.
          </p>
        )}

        {!loading && unchecked.map(item => (
          <div key={item.id} className={styles.item} onClick={() => toggleItem(item.id)}>
            <span className={styles.checkbox} />
            <span className={styles.itemName}>{item.name}</span>
            {item.amount && <span className={styles.itemAmount}>{item.amount}</span>}
            <button
              className={styles.removeBtn}
              onClick={e => { e.stopPropagation(); removeItem(item.id) }}
              type="button"
              aria-label="Usuń"
            >×</button>
          </div>
        ))}

        {!loading && checked.length > 0 && (
          <>
            <div className={styles.separator}>
              <span>Zaznaczone ({checked.length})</span>
              <button className={styles.clearBtn} onClick={clearChecked} type="button">
                Wyczyść
              </button>
            </div>
            {checked.map(item => (
              <div
                key={item.id}
                className={[styles.item, styles.itemChecked].join(' ')}
                onClick={() => toggleItem(item.id)}
              >
                <span className={[styles.checkbox, styles.checkboxChecked].join(' ')}>✓</span>
                <span className={styles.itemName}>{item.name}</span>
                {item.amount && <span className={styles.itemAmount}>{item.amount}</span>}
                <button
                  className={styles.removeBtn}
                  onClick={e => { e.stopPropagation(); removeItem(item.id) }}
                  type="button"
                  aria-label="Usuń"
                >×</button>
              </div>
            ))}
          </>
        )}
      </div>

      <div className={styles.spacer} />

      {/* Pasek dodawania — przyklejony nad nawigacją */}
      <div className={styles.addBar}>
        <input
          type="text"
          placeholder="Dodaj produkt…"
          className={styles.addInput}
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button className={styles.addBtn} onClick={handleAdd} type="button">+</button>
      </div>
    </div>
  )
}
