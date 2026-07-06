import { useNavigate, useLocation } from 'react-router-dom';

/**
 * BottomNav — navegação mobile fixa na parte inferior.
 *
 * Props:
 *   items — array de { icon, label, path, onClick, active }
 *           Se 'path' for fornecido, navega para ele ao clicar.
 *           Se 'onClick' for fornecido, executa a função.
 *           'active' força destaque; se omitido, compara com a rota atual.
 */
export default function BottomNav({ items = [] }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="bg-surface-container-lowest border-t-2 border-outline-variant fixed bottom-0 w-full z-50 md:hidden flex justify-around items-center h-16">
      {items.map((item, i) => {
        const isActive = item.active ?? (item.path && pathname === item.path);
        const handleClick = item.onClick ?? (() => item.path && navigate(item.path));

        return (
          <button
            key={i}
            onClick={handleClick}
            disabled={item.disabled}
            className={`flex flex-col items-center justify-center p-2 transition-colors disabled:opacity-50 ${
              isActive
                ? 'text-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined mb-0.5">{item.icon}</span>
            <span className="text-[10px] uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
