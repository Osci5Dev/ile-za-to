import Link from 'next/link';

export default function PolitykaPrywatnosci() {
  return (
    <main className="min-h-screen bg-black text-zinc-400 flex flex-col items-center py-16 px-6 font-sans">
      <div className="w-full max-w-2xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">
            Polityka Prywatności
          </h1>
          <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest">
            Serwis: ILE ZA TO DAM? // Ostatnia aktualizacja: 30.03.2026
          </p>
        </header>
        <div className="space-y-10 text-sm leading-relaxed border-t border-zinc-900 pt-10">
          <section>
            <h2 className="text-white font-bold uppercase mb-3 flex items-center gap-2">
              <span className="text-zinc-700">01.</span> Administrator Danych
            </h2>
            <p>
              Administratorem serwisu ilezatodam.pl jest osoba fizyczna nieprowadząca działalności gospodarczej. 
              W sprawach związanych z działaniem serwisu oraz prywatnością możesz skontaktować się pod adresem: 
              <span className="text-zinc-200 ml-1 underline">[kontakt.ilezato@gmail.com]</span>.
            </p>
          </section>
          <section>
            <h2 className="text-white font-bold uppercase mb-3 flex items-center gap-2">
              <span className="text-zinc-700">02.</span> Mechanizm Local Storage
            </h2>
            <p className="mb-4">
              Serwis nie wykorzystuje tradycyjnych plików cookies do śledzenia użytkowników. Korzystamy z technologii <strong>Web Storage (LocalStorage)</strong> w celu:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-500">
              <li>Zapisywania Twoich statystyk gry (liczba wygranych, serie zwycięstw).</li>
              <li>Przechowywania stanu aktualnej rozgrywki (Twoje próby), abyś mógł wrócić do gry w ciągu dnia.</li>
            </ul>
            <p className="mt-4 italic text-xs text-zinc-600">
              Dane te są przechowywane wyłącznie na Twoim urządzeniu. Administrator nie ma do nich dostępu i nie przesyła ich na swoje serwery.
            </p>
          </section>
          <section>
            <h2 className="text-white font-bold uppercase mb-3 flex items-center gap-2">
              <span className="text-zinc-700">03.</span> Pochodzenie Treści
            </h2>
            <p>
              Wszelkie dane dotyczące produktów (tytuły, zdjęcia, ceny) prezentowane w Serwisie pochodzą z publicznie dostępnych informacji w serwisie <strong>Allegro</strong>. 
              Prezentowane treści mają charakter wyłącznie informacyjno-rozrywkowy i nie stanowią oferty handlowej w rozumieniu Kodeksu Cywilnego. 
              Wszystkie znaki towarowe i materiały graficzne należą do ich prawnych właścicieli.
            </p>
          </section>
          <section>
            <h2 className="text-white font-bold uppercase mb-3 flex items-center gap-2">
              <span className="text-zinc-700">04.</span> Narzędzia Zewnętrzne
            </h2>
            <p>
              Dla zapewnienia stabilności i dostępności serwisu, korzystamy z usług:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-zinc-500">
              <li><strong>Vercel</strong> – hosting strony (może logować adresy IP w celach bezpieczeństwa i diagnostyki).</li>
              <li><strong>Supabase</strong> – baza danych produktów.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-white font-bold uppercase mb-3 flex items-center gap-2">
              <span className="text-zinc-700">05.</span> Twoje Prawa (RODO)
            </h2>
            <p>
              Zgodnie z RODO, masz prawo do usunięcia swoich danych. W przypadku naszej strony możesz to zrobić samodzielnie w dowolnym momencie poprzez:
            </p>
            <div className="mt-3 p-4 bg-zinc-950 border border-zinc-900 rounded-lg font-mono text-[11px] text-zinc-500">
              Ustawienia Przeglądarki {'>'} Prywatność {'>'} Zarządzaj danymi witryn {'>'} Usuń dane dla domeny ilezatodam.pl
            </div>
          </section>
        </div>
        <div className="flex flex-col items-center mt-16">
          <Link href="/" className="group">
            <button className="bg-white text-black font-black px-12 py-4 rounded-2xl text-sm uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-xl">
              Rozumiem, wracam do gry
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