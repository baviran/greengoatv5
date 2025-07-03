"use client"

import * as React from "react"

// Color showcase data
const BRAND_COLORS = [
  { name: '--tt-brand-color-50', value: 'var(--tt-brand-color-50)' },
  { name: '--tt-brand-color-100', value: 'var(--tt-brand-color-100)' },
  { name: '--tt-brand-color-200', value: 'var(--tt-brand-color-200)' },
  { name: '--tt-brand-color-300', value: 'var(--tt-brand-color-300)' },
  { name: '--tt-brand-color-400', value: 'var(--tt-brand-color-400)' },
  { name: '--tt-brand-color-500', value: 'var(--tt-brand-color-500)' },
  { name: '--tt-brand-color-600', value: 'var(--tt-brand-color-600)' },
  { name: '--tt-brand-color-700', value: 'var(--tt-brand-color-700)' },
  { name: '--tt-brand-color-800', value: 'var(--tt-brand-color-800)' },
  { name: '--tt-brand-color-900', value: 'var(--tt-brand-color-900)' },
  { name: '--tt-brand-color-950', value: 'var(--tt-brand-color-950)' }
]

const GRAY_COLORS_LIGHT = [
  { name: '--tt-gray-light-50', value: 'var(--tt-gray-light-50)' },
  { name: '--tt-gray-light-100', value: 'var(--tt-gray-light-100)' },
  { name: '--tt-gray-light-200', value: 'var(--tt-gray-light-200)' },
  { name: '--tt-gray-light-300', value: 'var(--tt-gray-light-300)' },
  { name: '--tt-gray-light-400', value: 'var(--tt-gray-light-400)' },
  { name: '--tt-gray-light-500', value: 'var(--tt-gray-light-500)' },
  { name: '--tt-gray-light-600', value: 'var(--tt-gray-light-600)' },
  { name: '--tt-gray-light-700', value: 'var(--tt-gray-light-700)' },
  { name: '--tt-gray-light-800', value: 'var(--tt-gray-light-800)' },
  { name: '--tt-gray-light-900', value: 'var(--tt-gray-light-900)' }
]

const GRAY_COLORS_DARK = [
  { name: '--tt-gray-dark-50', value: 'var(--tt-gray-dark-50)' },
  { name: '--tt-gray-dark-100', value: 'var(--tt-gray-dark-100)' },
  { name: '--tt-gray-dark-200', value: 'var(--tt-gray-dark-200)' },
  { name: '--tt-gray-dark-300', value: 'var(--tt-gray-dark-300)' },
  { name: '--tt-gray-dark-400', value: 'var(--tt-gray-dark-400)' },
  { name: '--tt-gray-dark-500', value: 'var(--tt-gray-dark-500)' },
  { name: '--tt-gray-dark-600', value: 'var(--tt-gray-dark-600)' },
  { name: '--tt-gray-dark-700', value: 'var(--tt-gray-dark-700)' },
  { name: '--tt-gray-dark-800', value: 'var(--tt-gray-dark-800)' },
  { name: '--tt-gray-dark-900', value: 'var(--tt-gray-dark-900)' }
]

const HIGHLIGHT_COLORS = [
  { name: '--tt-color-highlight-yellow', value: 'var(--tt-color-highlight-yellow)' },
  { name: '--tt-color-highlight-green', value: 'var(--tt-color-highlight-green)' },
  { name: '--tt-color-highlight-blue', value: 'var(--tt-color-highlight-blue)' },
  { name: '--tt-color-highlight-purple', value: 'var(--tt-color-highlight-purple)' },
  { name: '--tt-color-highlight-red', value: 'var(--tt-color-highlight-red)' },
  { name: '--tt-color-highlight-gray', value: 'var(--tt-color-highlight-gray)' },
  { name: '--tt-color-highlight-brown', value: 'var(--tt-color-highlight-brown)' },
  { name: '--tt-color-highlight-orange', value: 'var(--tt-color-highlight-orange)' },
  { name: '--tt-color-highlight-pink', value: 'var(--tt-color-highlight-pink)' }
]

const GREEN_COLORS = [
  { name: '--tt-color-green-inc-5', value: 'var(--tt-color-green-inc-5)' },
  { name: '--tt-color-green-inc-4', value: 'var(--tt-color-green-inc-4)' },
  { name: '--tt-color-green-inc-3', value: 'var(--tt-color-green-inc-3)' },
  { name: '--tt-color-green-inc-2', value: 'var(--tt-color-green-inc-2)' },
  { name: '--tt-color-green-inc-1', value: 'var(--tt-color-green-inc-1)' },
  { name: '--tt-color-green-base', value: 'var(--tt-color-green-base)' },
  { name: '--tt-color-green-dec-1', value: 'var(--tt-color-green-dec-1)' },
  { name: '--tt-color-green-dec-2', value: 'var(--tt-color-green-dec-2)' },
  { name: '--tt-color-green-dec-3', value: 'var(--tt-color-green-dec-3)' },
  { name: '--tt-color-green-dec-4', value: 'var(--tt-color-green-dec-4)' },
  { name: '--tt-color-green-dec-5', value: 'var(--tt-color-green-dec-5)' }
]

const YELLOW_COLORS = [
  { name: '--tt-color-yellow-inc-5', value: 'var(--tt-color-yellow-inc-5)' },
  { name: '--tt-color-yellow-inc-4', value: 'var(--tt-color-yellow-inc-4)' },
  { name: '--tt-color-yellow-inc-3', value: 'var(--tt-color-yellow-inc-3)' },
  { name: '--tt-color-yellow-inc-2', value: 'var(--tt-color-yellow-inc-2)' },
  { name: '--tt-color-yellow-inc-1', value: 'var(--tt-color-yellow-inc-1)' },
  { name: '--tt-color-yellow-base', value: 'var(--tt-color-yellow-base)' },
  { name: '--tt-color-yellow-dec-1', value: 'var(--tt-color-yellow-dec-1)' },
  { name: '--tt-color-yellow-dec-2', value: 'var(--tt-color-yellow-dec-2)' },
  { name: '--tt-color-yellow-dec-3', value: 'var(--tt-color-yellow-dec-3)' },
  { name: '--tt-color-yellow-dec-4', value: 'var(--tt-color-yellow-dec-4)' },
  { name: '--tt-color-yellow-dec-5', value: 'var(--tt-color-yellow-dec-5)' }
]

const RED_COLORS = [
  { name: '--tt-color-red-inc-5', value: 'var(--tt-color-red-inc-5)' },
  { name: '--tt-color-red-inc-4', value: 'var(--tt-color-red-inc-4)' },
  { name: '--tt-color-red-inc-3', value: 'var(--tt-color-red-inc-3)' },
  { name: '--tt-color-red-inc-2', value: 'var(--tt-color-red-inc-2)' },
  { name: '--tt-color-red-inc-1', value: 'var(--tt-color-red-inc-1)' },
  { name: '--tt-color-red-base', value: 'var(--tt-color-red-base)' },
  { name: '--tt-color-red-dec-1', value: 'var(--tt-color-red-dec-1)' },
  { name: '--tt-color-red-dec-2', value: 'var(--tt-color-red-dec-2)' },
  { name: '--tt-color-red-dec-3', value: 'var(--tt-color-red-dec-3)' },
  { name: '--tt-color-red-dec-4', value: 'var(--tt-color-red-dec-4)' },
  { name: '--tt-color-red-dec-5', value: 'var(--tt-color-red-dec-5)' }
]

const TEXT_COLORS = [
  { name: '--tt-color-text-gray', value: 'var(--tt-color-text-gray)' },
  { name: '--tt-color-text-brown', value: 'var(--tt-color-text-brown)' },
  { name: '--tt-color-text-orange', value: 'var(--tt-color-text-orange)' },
  { name: '--tt-color-text-yellow', value: 'var(--tt-color-text-yellow)' },
  { name: '--tt-color-text-green', value: 'var(--tt-color-text-green)' },
  { name: '--tt-color-text-blue', value: 'var(--tt-color-text-blue)' },
  { name: '--tt-color-text-purple', value: 'var(--tt-color-text-purple)' },
  { name: '--tt-color-text-pink', value: 'var(--tt-color-text-pink)' },
  { name: '--tt-color-text-red', value: 'var(--tt-color-text-red)' }
]

const THEME_VARIABLES = [
  { name: '--tt-bg-color', label: 'צבע רקע' },
  { name: '--tt-border-color', label: 'צבע גבול' },
  { name: '--tt-cursor-color', label: 'צבע הסמן' },
  { name: '--tt-selection-color', label: 'צבע הבחירה' },
  { name: '--tt-card-bg-color', label: 'רקע כרטיס' },
  { name: '--tt-sidebar-bg-color', label: 'רקע סרגל צד' },
  { name: '--blockquote-bg-color', label: 'צבע ציטוט' },
  { name: '--link-text-color', label: 'צבע קישור' },
  { name: '--separator-color', label: 'צבע מפריד' },
  { name: '--placeholder-color', label: 'צבע מסמן מקום' }
]

const CHECKBOX_VARIABLES = [
  { name: '--tt-checklist-bg-color', label: 'רקע תיבת סימון' },
  { name: '--tt-checklist-bg-active-color', label: 'רקע תיבת סימון פעילה' },
  { name: '--tt-checklist-border-color', label: 'גבול תיבת סימון' },
  { name: '--tt-checklist-border-active-color', label: 'גבול תיבת סימון פעילה' },
  { name: '--tt-checklist-check-icon-color', label: 'צבע סמל תיבת סימון' }
]

const CODE_VARIABLES = [
  { name: '--tt-inline-code-bg-color', label: 'רקע קוד מוטבע' },
  { name: '--tt-inline-code-text-color', label: 'טקסט קוד מוטבע' },
  { name: '--tt-inline-code-border-color', label: 'גבול קוד מוטבע' },
  { name: '--tt-codeblock-bg', label: 'רקע בלוק קוד' },
  { name: '--tt-codeblock-text', label: 'טקסט בלוק קוד' },
  { name: '--tt-codeblock-border', label: 'גבול בלוק קוד' }
]

const RADIUS_VARIABLES = [
  { name: '--tt-radius-xxs', label: 'קטן מאוד (2px)' },
  { name: '--tt-radius-xs', label: 'קטן (4px)' },
  { name: '--tt-radius-sm', label: 'בינוני קטן (6px)' },
  { name: '--tt-radius-md', label: 'בינוני (8px)' },
  { name: '--tt-radius-lg', label: 'גדול (12px)' },
  { name: '--tt-radius-xl', label: 'גדול מאוד (16px)' }
]

const TRANSITION_VARIABLES = [
  { name: '--tt-transition-duration-short', label: 'משך קצר (0.1s)' },
  { name: '--tt-transition-duration-default', label: 'משך ברירת מחדל (0.2s)' },
  { name: '--tt-transition-duration-long', label: 'משך ארוך (0.64s)' },
  { name: '--tt-transition-easing-default', label: 'החלקת ברירת מחדל' },
  { name: '--tt-transition-easing-cubic', label: 'החלקה קובית' },
  { name: '--tt-transition-easing-quart', label: 'החלקה רבעית' },
  { name: '--tt-transition-easing-circ', label: 'החלקה עגולה' },
  { name: '--tt-transition-easing-back', label: 'החלקה אחורה' }
]

interface ColorSwatchProps {
  name: string
  value: string
  showText?: boolean
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ name, value, showText = true }) => (
  <div className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
    <div 
      className="w-8 h-8 rounded-md border border-gray-300 dark:border-gray-600"
      style={{ backgroundColor: value }}
    />
    {showText && (
      <div className="flex-1 min-w-0">
        <div className="font-mono text-xs text-gray-600 dark:text-gray-400">{name}</div>
        <div className="font-mono text-xs text-gray-500 dark:text-gray-500">{value}</div>
      </div>
    )}
  </div>
)

interface VariableShowcaseProps {
  name: string
  label: string
}

const VariableSwatch: React.FC<VariableShowcaseProps> = ({ name, label }) => (
  <div className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
    <div 
      className="w-8 h-8 rounded-md border border-gray-300 dark:border-gray-600"
      style={{ backgroundColor: `var(${name})` }}
    />
    <div className="flex-1 min-w-0">
      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</div>
      <div className="font-mono text-xs text-gray-600 dark:text-gray-400">{name}</div>
    </div>
  </div>
)

export const TipTapStyleGuide: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = React.useState(false)

  React.useEffect(() => {
    // Check initial theme
    const isDark = document.documentElement.classList.contains('dark')
    setIsDarkMode(isDark)
    
    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark')
          setIsDarkMode(isDark)
        }
      })
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          מדריך העיצוב של TipTap
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          מדריך מקיף המציג את כל הסגנונות, המשתנים והרכיבים הזמינים
        </p>
        <button
          onClick={toggleTheme}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          העבר למצב {isDarkMode ? 'בהיר' : 'כהה'}
        </button>
      </div>

      {/* Quick Navigation */}
      <section className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">ניווט מהיר</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
          <a href="#typography" className="text-blue-500 hover:text-blue-600 transition-colors">טיפוגרפיה</a>
          <a href="#lists" className="text-blue-500 hover:text-blue-600 transition-colors">רשימות</a>
          <a href="#brand-colors" className="text-blue-500 hover:text-blue-600 transition-colors">צבעי המותג</a>
          <a href="#gray-colors" className="text-blue-500 hover:text-blue-600 transition-colors">צבעים אפורים</a>
          <a href="#highlight-colors" className="text-blue-500 hover:text-blue-600 transition-colors">צבעי הדגשה</a>
          <a href="#green-colors" className="text-blue-500 hover:text-blue-600 transition-colors">צבעים ירוקים</a>
          <a href="#yellow-colors" className="text-blue-500 hover:text-blue-600 transition-colors">צבעים צהובים</a>
          <a href="#red-colors" className="text-blue-500 hover:text-blue-600 transition-colors">צבעים אדומים</a>
          <a href="#text-colors" className="text-blue-500 hover:text-blue-600 transition-colors">צבעי טקסט</a>
          <a href="#theme-variables" className="text-blue-500 hover:text-blue-600 transition-colors">משתני ערכת נושא</a>
          <a href="#checkbox-variables" className="text-blue-500 hover:text-blue-600 transition-colors">משתני תיבות סימון</a>
          <a href="#code-variables" className="text-blue-500 hover:text-blue-600 transition-colors">משתני קוד</a>
          <a href="#radius-variables" className="text-blue-500 hover:text-blue-600 transition-colors">משתני עיגול פינות</a>
          <a href="#transition-variables" className="text-blue-500 hover:text-blue-600 transition-colors">משתני מעברים</a>
        </div>
      </section>

             {/* Typography Showcase */}
       <section id="typography" className="space-y-6">
         <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
           טיפוגרפיה
         </h2>
        <div className="tiptap ProseMirror space-y-4 p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <h1>כותרת ראשית - H1</h1>
          <h2>כותרת משנית - H2</h2>
          <h3>כותרת שלישית - H3</h3>
          <h4>כותרת רביעית - H4</h4>
          <h5>כותרת חמישית - H5</h5>
          <h6>כותרת שישית - H6</h6>
          
          <p>זהו טקסט רגיל בפסקה. הוא מכיל <strong>טקסט מודגש</strong>, <em>טקסט נטוי</em>, <u>טקסט קו תחתון</u>, <s>טקסט קו חוצה</s>, ו<code>קוד מוטבע</code>.</p>
          
          <p>זוהי פסקה נוספת עם <mark>טקסט מודגש ברקע</mark> ו<a href="#" style={{ color: 'var(--link-text-color)' }}>קישור</a>.</p>
          
          <blockquote style={{ borderRight: '4px solid var(--blockquote-bg-color)', paddingRight: '1rem', margin: '1rem 0', fontStyle: 'italic' }}>
            זוהי ציטטה. היא משמשת להדגיש תוכן חשוב או לצטט מקורות חיצוניים.
          </blockquote>
          
          <pre style={{ 
            backgroundColor: 'var(--tt-codeblock-bg)', 
            color: 'var(--tt-codeblock-text)', 
            border: '1px solid var(--tt-codeblock-border)',
            padding: '1rem',
            borderRadius: '0.375rem',
            fontFamily: 'monospace'
          }}>
            {`function hello() {
  console.log("Hello, World!");
}`}
          </pre>
        </div>
      </section>

                    {/* Lists Showcase */}
       <section id="lists" className="space-y-6">
         <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
           רשימות
         </h2>
         <div className="tiptap ProseMirror space-y-4 p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
           <div>
             <h3>רשימה מונוגרת:</h3>
             <ul>
               <li>פריט ראשון</li>
               <li>פריט שני</li>
               <li>פריט שלישי</li>
             </ul>
           </div>
           
           <div>
             <h3>רשימה ממוספרת:</h3>
             <ol>
               <li>פריט ראשון</li>
               <li>פריט שני</li>
               <li>פריט שלישי</li>
             </ol>
           </div>
         </div>
       </section>

             {/* Brand Colors */}
       <section id="brand-colors" className="space-y-6">
         <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
           צבעי המותג
         </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BRAND_COLORS.map((color) => (
            <ColorSwatch key={color.name} {...color} />
          ))}
        </div>
      </section>

             {/* Gray Colors */}
       <section id="gray-colors" className="space-y-6">
         <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
           צבעים אפורים
         </h2>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div>
             <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">מצב בהיר</h3>
             <div className="space-y-2">
               {GRAY_COLORS_LIGHT.map((color) => (
                 <ColorSwatch key={color.name} {...color} />
               ))}
             </div>
           </div>
           <div>
             <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">מצב כהה</h3>
             <div className="space-y-2">
               {GRAY_COLORS_DARK.map((color) => (
                 <ColorSwatch key={color.name} {...color} />
               ))}
             </div>
           </div>
         </div>
       </section>

       {/* Highlight Colors */}
       <section id="highlight-colors" className="space-y-6">
         <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
           צבעי הדגשה
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {HIGHLIGHT_COLORS.map((color) => (
             <ColorSwatch key={color.name} {...color} />
           ))}
         </div>
         <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
           <p className="text-sm text-gray-600 dark:text-gray-400">
             דוגמאות לצבעי הדגשה: 
             <span style={{ backgroundColor: 'var(--tt-color-highlight-yellow)', padding: '0 0.25rem', borderRadius: '0.125rem' }}>צהוב</span>
             {' '}
             <span style={{ backgroundColor: 'var(--tt-color-highlight-green)', padding: '0 0.25rem', borderRadius: '0.125rem' }}>ירוק</span>
             {' '}
             <span style={{ backgroundColor: 'var(--tt-color-highlight-blue)', padding: '0 0.25rem', borderRadius: '0.125rem' }}>כחול</span>
             {' '}
             <span style={{ backgroundColor: 'var(--tt-color-highlight-purple)', padding: '0 0.25rem', borderRadius: '0.125rem' }}>סגול</span>
             {' '}
             <span style={{ backgroundColor: 'var(--tt-color-highlight-red)', padding: '0 0.25rem', borderRadius: '0.125rem' }}>אדום</span>
           </p>
         </div>
       </section>

       {/* Green Color Scale */}
       <section id="green-colors" className="space-y-6">
         <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
           סולם צבעים ירוק
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {GREEN_COLORS.map((color) => (
             <ColorSwatch key={color.name} {...color} />
           ))}
         </div>
       </section>

       {/* Yellow Color Scale */}
       <section id="yellow-colors" className="space-y-6">
         <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
           סולם צבעים צהוב
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {YELLOW_COLORS.map((color) => (
             <ColorSwatch key={color.name} {...color} />
           ))}
         </div>
       </section>

       {/* Red Color Scale */}
       <section id="red-colors" className="space-y-6">
         <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
           סולם צבעים אדום
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {RED_COLORS.map((color) => (
             <ColorSwatch key={color.name} {...color} />
           ))}
         </div>
       </section>

       {/* Text Colors */}
       <section id="text-colors" className="space-y-6">
         <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
           צבעי טקסט
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {TEXT_COLORS.map((color) => (
             <ColorSwatch key={color.name} {...color} />
           ))}
         </div>
         <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
           <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
             דוגמאות לצבעי טקסט:
           </p>
           <div className="space-y-2">
             <p><span style={{ color: 'var(--tt-color-text-gray)' }}>טקסט בצבע אפור</span></p>
             <p><span style={{ color: 'var(--tt-color-text-brown)' }}>טקסט בצבע חום</span></p>
             <p><span style={{ color: 'var(--tt-color-text-orange)' }}>טקסט בצבע כתום</span></p>
             <p><span style={{ color: 'var(--tt-color-text-yellow)' }}>טקסט בצבע צהוב</span></p>
             <p><span style={{ color: 'var(--tt-color-text-green)' }}>טקסט בצבע ירוק</span></p>
             <p><span style={{ color: 'var(--tt-color-text-blue)' }}>טקסט בצבע כחול</span></p>
             <p><span style={{ color: 'var(--tt-color-text-purple)' }}>טקסט בצבע סגול</span></p>
             <p><span style={{ color: 'var(--tt-color-text-pink)' }}>טקסט בצבע ורוד</span></p>
             <p><span style={{ color: 'var(--tt-color-text-red)' }}>טקסט בצבע אדום</span></p>
           </div>
         </div>
       </section>

       {/* Theme Variables */}
       <section id="theme-variables" className="space-y-6">
         <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
           משתני ערכת נושא
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {THEME_VARIABLES.map((variable) => (
             <VariableSwatch key={variable.name} name={variable.name} label={variable.label} />
           ))}
         </div>
       </section>

       {/* Checkbox Variables */}
       <section id="checkbox-variables" className="space-y-6">
         <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
           משתני תיבות סימון
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {CHECKBOX_VARIABLES.map((variable) => (
             <VariableSwatch key={variable.name} name={variable.name} label={variable.label} />
           ))}
         </div>
       </section>

       {/* Code Variables */}
       <section id="code-variables" className="space-y-6">
         <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
           משתני קוד
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {CODE_VARIABLES.map((variable) => (
             <VariableSwatch key={variable.name} name={variable.name} label={variable.label} />
           ))}
         </div>
       </section>

       {/* Radius Variables */}
       <section id="radius-variables" className="space-y-6">
         <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
           משתני עיגול פינות
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {RADIUS_VARIABLES.map((variable) => (
             <div key={variable.name} className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
               <div 
                 className="w-8 h-8 bg-blue-500 border border-gray-300 dark:border-gray-600"
                 style={{ borderRadius: `var(${variable.name})` }}
               />
               <div className="flex-1 min-w-0">
                 <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{variable.label}</div>
                 <div className="font-mono text-xs text-gray-600 dark:text-gray-400">{variable.name}</div>
               </div>
             </div>
           ))}
         </div>
       </section>

       {/* Transition Variables */}
       <section id="transition-variables" className="space-y-6">
         <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
           משתני מעברים
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {TRANSITION_VARIABLES.map((variable) => (
             <div key={variable.name} className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
               <div className="w-8 h-8 bg-purple-500 rounded-md border border-gray-300 dark:border-gray-600 transition-transform hover:scale-110"
                    style={{ 
                      transitionDuration: variable.name.includes('duration') ? `var(${variable.name})` : 'var(--tt-transition-duration-default)',
                      transitionTimingFunction: variable.name.includes('easing') ? `var(${variable.name})` : 'var(--tt-transition-easing-default)'
                    }}
               />
               <div className="flex-1 min-w-0">
                 <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{variable.label}</div>
                 <div className="font-mono text-xs text-gray-600 dark:text-gray-400">{variable.name}</div>
               </div>
             </div>
           ))}
         </div>
         <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
           <p className="text-sm text-gray-600 dark:text-gray-400">
             העבר עם העכבר על הריבועים הסגולים למעלה כדי לראות את אפקטי המעבר השונים בפעולה.
           </p>
         </div>
       </section>

      {/* CSS Variables Reference */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
          מדריך משתני CSS
        </h2>
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">איך להשתמש</h3>
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <p>
              כל הצבעים והמשתנים זמינים כתכונות CSS מותאמות אישית. אתה יכול להשתמש בהם בסגנונות שלך:
            </p>
            <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg font-mono text-sm">
{`.my-element {
  background-color: var(--tt-brand-color-500);
  color: var(--tt-gray-light-900);
  border: 1px solid var(--tt-border-color);
}`}
            </pre>
            <p>
              משתני הערכת נושא מחליפים אוטומטית בין מצבים בהירים וכהים על בסיס הקלאס <code>.dark</code> על האלמנט html.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
} 