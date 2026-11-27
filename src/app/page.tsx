import { redirect } from 'next/navigation';

export default function Home() {
  // Redireciona para o dashboard com idioma padrão português
  // O middleware irá verificar a autenticação e redirecionar para login se necessário
  redirect('/pt/dashboard');
}
