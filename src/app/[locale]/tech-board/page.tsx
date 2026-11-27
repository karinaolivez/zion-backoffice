import type { Metadata } from 'next';
import { TechBoard } from '@/components/tech-board/tech-board';

export const metadata: Metadata = {
  title: 'Kanban · Time de Tecnologia',
  robots: { index: false, follow: false },
};

/**
 * Kanban do time de tecnologia.
 * Fica fora do layout autenticado do backoffice: não usa login Zion nem sidebar.
 * O acesso é por uma senha compartilhada do time (TECH_BOARD_PASSWORD).
 */
export default function TechBoardPage() {
  return <TechBoard />;
}
