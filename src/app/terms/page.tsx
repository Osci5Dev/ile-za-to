import Link from 'next/link';

export default function Regulamin() {
  return (
    <main className="min-h-screen bg-black text-zinc-400 flex flex-col items-center py-16 px-6 font-sans">
      <div className="w-full max-w-2xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">
            Regulamin Serwisu
          </h1>
          <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest">
            ILEZATO.PL // WARUNKI KORZYSTANIA
          </p>
        </header>
        <div className="space-y-10 text-sm leading-relaxed border-t border-zinc-900 pt-10">
          <section>
            <h2 className="text-white font-bold uppercase mb-3 flex items-center gap-2">
              <span className="text-zinc-700">01.</span> Postanowienia Ogólne
            </h2>
            <p>
              Niniejszy regulamin określa zasady korzystania z serwisu rozrywkowego „ILE ZA TO?” dostępnego pod adresem ilezato.pl. 
              Serwis ma charakter gry logicznej polegającej na odgadywaniu cen produktów. Korzystanie z serwisu jest bezpłatne i nie wymaga rejestracji konta.
            </p>
          </section>
          <section>
            <h2 className="text-white font-bold uppercase mb-3 flex items-center gap-2">
              <span className="text-zinc-700">02.</span> Zasady Gry
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-zinc-500">
              <li>Użytkownik ma za zadanie odgadnąć cenę produktu dnia w maksymalnie 5 próbach.</li>
              <li>Wszystkie wyniki (seria zwycięstw, statystyki) są zapisywane lokalnie na urządzeniu użytkownika i mogą zostać utracone po wyczyszczeniu danych przeglądarki.</li>
              <li>Zabrania się wykorzystywania skryptów, botów lub innych narzędzi automatyzujących w celu manipulacji wynikami gry.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-white font-bold uppercase mb-3 flex items-center gap-2">
              <span className="text-zinc-700">03.</span> Własność Intelektualna
            </h2>
            <p>
              Dane o produktach (tytuły, wizerunki produktów, ceny) są własnością serwisu <strong>Allegro</strong> lub sprzedawców tam ogłaszających. 
              Serwis „ILE ZA TO?” wykorzystuje te dane wyłącznie w celach informacyjno-rozrywkowych. 
              Kod źródłowy oraz oprawa graficzna serwisu stanowią własność Administratora i są chronione prawem autorskim.
            </p>
          </section>
          <section>
            <h2 className="text-white font-bold uppercase mb-3 flex items-center gap-2">
              <span className="text-zinc-700">04.</span> Wyłączenie Odpowiedzialności
            </h2>
            <p className="mb-4">
              Administrator dokłada starań, aby dane były rzetelne, jednak:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-500">
              <li>Ceny prezentowane w grze mogą być nieaktualne, zaokrąglone lub pochodzić z ofert archiwalnych.</li>
              <li><strong>Prezentowane ceny nie stanowią oferty handlowej</strong> w rozumieniu art. 66 Kodeksu Cywilnego.</li>
              <li>Administrator nie ponosi odpowiedzialności za jakiekolwiek decyzje zakupowe podjęte na podstawie informacji z serwisu.</li>
            </ul>
          </section>
            <section>
            <h2 className="text-white font-bold uppercase mb-3 flex items-center gap-2">
                <span className="text-zinc-700">05.</span> Wsparcie Serwisu
            </h2>
            <p>
                Użytkownik ma możliwość dobrowolnego wsparcia Serwisu poprzez platformy typu „Buy Me a Coffee”. 
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-zinc-500">
                <li>Wszelkie wpłaty są całkowicie dobrowolne i nie są warunkiem dostępu do gry.</li>
                <li>Środki z darowizn są przeznaczane wyłącznie na pokrycie kosztów utrzymania infrastruktury technicznej, w tym bazy danych Supabase oraz hostingu.</li>
                <li>Dokonanie wpłaty nie stanowi zakupu żadnej usługi ani towaru i nie daje użytkownikowi dodatkowych przywilejów wewnątrz Serwisu.</li>
            </ul>
            </section>
          <section>
            <h2 className="text-white font-bold uppercase mb-3 flex items-center gap-2">
              <span className="text-zinc-700">06.</span> Postanowienia Końcowe
            </h2>
            <p>
              Administrator zastrzega sobie prawo do zmiany niniejszego regulaminu w dowolnym momencie. 
              Dalsze korzystanie z serwisu po wprowadzeniu zmian oznacza ich akceptację. 
              Wszelkie uwagi dotyczące działania strony należy kierować na adres: <strong>[Twój E-mail]</strong>.
            </p>
          </section>
        </div>
        <div className="flex flex-col items-center mt-16">
          <Link href="/" className="group">
            <button className="bg-white text-black font-black px-12 py-4 rounded-2xl text-sm uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-xl">
              Akceptuję, wracam
            </button>
          </Link>
          <p className="mt-6 text-[10px] text-zinc-700 uppercase tracking-widest font-bold">
            Gra stworzona dla zabawy. Miłego zgadywania!
          </p>
        </div>
      </div>
    </main>
  );
}