import GSISNavbar from './GSISNavbar';
import GSISFooter from './GSISFooter';

export default function GSISLayout({ children }) {
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col overflow-x-hidden pb-[env(safe-area-inset-bottom)]">
      <GSISNavbar />
      <main className="flex-1 pt-20 w-full overflow-x-hidden">{children}</main>
      <GSISFooter />
    </div>
  );
}
