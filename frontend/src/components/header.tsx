import { Navigation } from "./navigation";

export const Header = () => {
  return (
    <header className="w-full sticky top-0 bg-white/80 backdrop-blur-md border-b-2 border-muted z-50">
      <div className="container flex justify-between items-center mx-auto px-4 py-4">
        <div>
          <span>RaffleNow</span>
        </div>

        <Navigation />

        <div>
          <span>Usuario</span>
        </div>
      </div>
    </header>
  );
};
