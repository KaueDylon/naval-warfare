import { useNavigate, useLocation } from 'react-router-dom';

/**
 * BottomNav — navegação mobile fixa (visível apenas em telas < md).
 * Itens fixos e consistentes em todas as páginas que o usam.
 */
const NAV_ITEMS = [
  { icon: 'home', label: 'HQ', path: '/' },
  { icon: 'military_tech', label: 'Rank', path: '/ranking' },
  { icon: 'history', label: 'Histórico', path: '/history' },
  { icon: 'person', label: 'Perfil', path: '/profile' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="bg-surface-container-lowest border-t-2 border-outline-variant fixed bottom-0 left-0 right-0 z-50 md:hidden flex justify-around items-center h-14 safe-area-bottom">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.path;

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive
                ? 'text-primary'
                : 'text-on-surface-variant active:text-primary'
            }`}
          >
            <span className={`material-symbols-outlined text-[22px] ${isActive ? '' : 'opacity-70'}`}>
              {item.icon}
            </span>
            <span
              className={`text-[9px] uppercase mt-0.5 tracking-wider ${isActive ? 'font-bold' : ''}`}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
