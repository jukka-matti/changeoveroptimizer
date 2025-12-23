export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t py-4 bg-muted/40 mt-auto">
      <div className="container flex flex-col items-center justify-between gap-4 normal:h-12 normal:flex-row max-w-container-normal mx-auto px-6">
        <p className="text-center text-sm leading-loose text-muted-foreground normal:text-left">
          © {currentYear} <a href="https://rdmaic.com" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">RDMAIC Oy</a>. 
          Built in Finland.
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors">Support</a>
          <span className="text-muted-foreground/30">|</span>
          <span className="font-mono">v1.0.0</span>
        </div>
      </div>
    </footer>
  );
}

