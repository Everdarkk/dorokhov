import ts         from '$lib/assets/icons/typescript.svg'
import css        from '$lib/assets/icons/css.svg'
import react      from '$lib/assets/icons/react.svg'
import svelte     from '$lib/assets/icons/svelte.svg'
import supabase   from '$lib/assets/icons/supabase.svg'
import git        from '$lib/assets/icons/git.svg'
import vercel     from '$lib/assets/icons/vercel.svg'
import figma     from '$lib/assets/icons/figma.svg'
import vscode     from '$lib/assets/icons/vscode.svg'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TechCard {
  /** Unique identifier */
  id: number
  /** Display name shown in popup title */
  name: string
  /** Vite-resolved icon URL */
  icon: string
  /** One-liner shown in popup — what it is and why it's great */
  summary: string
  /** Organic blob border-radius — horizontal axis */
  rx: string
  /** Organic blob border-radius — vertical axis */
  ry: string
  /** CSS morph animation duration in seconds */
  morphDuration: number
  /** CSS morph animation delay in seconds (negative to offset phase) */
  morphDelay: number
  /** Inner radial gradient primary colour */
  accent1: string
  /** Inner radial gradient highlight colour */
  accent2: string
}

// ─── Data ────────────────────────────────────────────────────────────────────

export const techCards: TechCard[] = [
  {
    id: 1,
    name: 'TypeScript',
    icon: ts,
    summary: 'TypeScript — це «розумна» надбудова над JavaScript, яка додає в код чіткі правила та підказки щодо типів даних. Вона допомагає знаходити помилки ще під час написання коду, роблячи створення складних сайтів та програм надійнішим і зрозумілішим.',
    rx: '58% 42% 52% 48%',
    ry: '44% 56% 42% 58%',
    morphDuration: 9,
    morphDelay: 0,
    accent1: '#1a3a6e',
    accent2: '#3178c6',
  },
  {
    id: 2,
    name: 'CSS',
    icon: css,
    summary: 'CSS3 — це сучасний стандарт стилів, який відповідає за зовнішній вигляд вебсторінок, дозволяючи налаштовувати кольори, шрифти та розташування елементів. Завдяки йому сайти в буквальному сенсі оживають та привабливими. Повний контроль над анімаціями та адаптивністю під мобільні пристрої.',
    rx: '44% 56% 62% 38%',
    ry: '60% 40% 48% 52%',
    morphDuration: 11,
    morphDelay: -2,
    accent1: '#1a3850',
    accent2: '#2965f1',
  },
  {
    id: 3,
    name: 'React / Next.js',
    icon: react,
    summary: 'Компонентний користувацький інтерфейс найпопулярнішої бібліотеки React та потужний набір інструментів її надбудови - Next.JS - для серверної генерації сторінок та метаданих, ідеально для SEO та великих продуктових застосунків.',
    rx: '62% 38% 44% 56%',
    ry: '38% 62% 56% 44%',
    morphDuration: 10,
    morphDelay: -4,
    accent1: '#0e3044',
    accent2: '#61dafb',
  },
  {
    id: 4,
    name: 'Svelte / SvelteKit',
    icon: svelte,
    summary: 'Svelte та SvelteKit — це інноваційний інструмент для створення інтерфейсів та каркас, побудований над ним, який автоматично вирішує питання навігації між сторінками та обробки даних та на відміну від інших бібліотек, виконує всю складну роботу ще під час збірки проєкту, а не в браузері користувача. Завдяки цьому сайти виходять неймовірно швидкими, а код - лаконічним.',
    rx: '48% 52% 58% 42%',
    ry: '54% 46% 40% 60%',
    morphDuration: 13,
    morphDelay: -6,
    accent1: '#4a1a0e',
    accent2: '#ff3e00',
  },
  {
    id: 5,
    name: 'Supabase',
    icon: supabase,
    summary: 'Supabase — це сучасна відкрита платформа, яка надає розробникам усі необхідні інструменти для роботи з даними та користувачами «з коробки». Вона дозволяє миттєво створити надійну базу даних, налаштувати реєстрацію через Google або пошту та зберігати файли, не витрачаючи тижні на написання складного серверного коду.',
    rx: '40% 60% 48% 52%',
    ry: '56% 44% 60% 40%',
    morphDuration: 12,
    morphDelay: -8,
    accent1: '#0a3328',
    accent2: '#3ecf8e',
  },
  {
    id: 6,
    name: 'Git / GitHub',
    icon: git,
    summary: 'Git — це розумна система контролю версій, яка запам’ятовує кожну зміну в коді вашого проєкту та дозволяє миттєво повернутися до будь-якої попередньої точки в часі. GitHub — це найбільша у світі хмарна платформа для зберігання Git-проєктів, яка слугує «соціальною мережею» для розробників та місцем для спільної роботи.',
    rx: '54% 46% 40% 60%',
    ry: '42% 58% 54% 46%',
    morphDuration: 10,
    morphDelay: -3,
    accent1: '#2a1a0e',
    accent2: '#f05032',
  },
  {
    id: 7,
    name: 'Vercel',
    icon: vercel,
    summary: 'Vercel — це сучасна хмарна платформа, яка дозволяє миттєво публікувати ваші вебсайти в інтернеті прямо з коду на GitHub. Вона бере на себе всю складну роботу з налаштування серверів, щоб ваш сайт завантажувався блискавично швидко в будь-якій точці світу.',
    rx: '50% 50% 56% 44%',
    ry: '46% 54% 44% 56%',
    morphDuration: 11,
    morphDelay: -5,
    accent1: '#1a1a2e',
    accent2: '#c8c8d4',
  },
  {
    id: 8,
    name: 'Figma',
    icon: figma,
    summary: 'Figma — це провідний інструмент для дизайну інтерфейсів, у якому створюються візуальні концепції майбутніх сайтів. Вміння працювати з Figma дозволяє розробнику точно переносити дизайнерські рішення в код, зберігаючи кожен піксель, відступ та анімацію саме такими, якими вони були задумані.',
    rx: '42% 58% 35% 65%',
    ry: '55% 45% 62% 38%',
    morphDuration: 12,
    morphDelay: -1,
    accent1: '#2c1e31',
    accent2: '#a259ff'
  },
  {
    id: 9,
    name: 'VS Code',
    icon: vscode,
    summary: 'Visual Studio Code — це основний робочий інструмент, потужний редактор коду з безмежними можливостями налаштування. Завдяки величезній екосистемі розширень та інтегрованому терміналу, він перетворює процес написання коду на швидкий, інтелектуальний та приємний досвід.',
    rx: '46% 54% 50% 50%',
    ry: '52% 48% 58% 42%',
    morphDuration: 11.5,
    morphDelay: -4.5,
    accent1: '#00223e',
    accent2: '#007acc',
  },
]