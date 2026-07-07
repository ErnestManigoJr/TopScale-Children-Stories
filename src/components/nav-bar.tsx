import Link from "next/link";

export function NavBar() {
  return (
    <header className="border-b bg-white/70 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <span className="text-2xl">🍲</span>
          <span>Soup Stack</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Create
          </Link>
          <Link href="/library" className="hover:text-foreground transition-colors">
            Library
          </Link>
        </nav>
      </div>
    </header>
  );
}
