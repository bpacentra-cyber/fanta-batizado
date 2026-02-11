"use client";

import Link from "next/link";

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85">
    {children}
  </span>
);

const Card = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 sm:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-xl">
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
        <div className="mt-2 text-white/80 leading-relaxed">{children}</div>
      </div>
    </div>
  </section>
);

export default function RegolamentoPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* HERO */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-56 right-[-120px] h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-3xl px-6 pt-10 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge>Fanta Batizado</Badge>
                <Badge>Regolamento Ufficiale*</Badge>
                <Badge>*più o meno</Badge>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                📜 Regolamento
              </h1>

              <p className="text-white/70 leading-relaxed">
                Benvenuti nel gioco che nessuno aveva chiesto… ma che ora nessuno
                potrà più ignorare. <br /><br />
                Gli ideatori del gioco preferiscono tenere il presente Fanta Batizado segreto agli altri gruppi che parteciperanno all&apos;evento. <br /><br />
                <b>• Prima regola del FANTA BATIZADO</b>: Non parlate mai del Fanta Batizado<br />
                <b>• Seconda regola del FANTA BATIZADO</b>: Non parlate mai del Fanta Batizado!
              </p>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <Link
                href="/"
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                ← Home
              </Link>
              <Link
                href="/mercato"
                className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
              >
                Vai al Mercato
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto w-full max-w-3xl px-6 pb-14 space-y-5">
        <Card title="Ringraziamenti de coração" icon="🫡">
          <p>
            Un’idea partorita grazie a:
            <br />
            <b>Graduado Maui</b> • <b>Graduado Zombie</b> • <b>Licurì</b> •{" "}
            <b>Cobrinha</b>
          </p>
          <p className="mt-2">
            Con la preziosa collaborazione di:
            <br />
            👉 <b>un esaurimento nervoso di Instrutor Frodo</b> per creare l&apos;app.
          </p>
        </Card>

        <Card title="Missione del gioco" icon="🎯">
          <p>
            Crea la <b>squadra più devastante del Batizado</b> e conquista:
          </p>
          <ul className="mt-3 list-disc pl-5 space-y-1">
            <li>🏆 gloria eterna</li>
            <li>😎 rispetto temporaneo</li>
            <li>😂 prese in giro assicurate per i prossimi 10 anni</li>
          </ul>
          <p className="mt-3">
            Vince chi accumula più punti grazie a{" "}
            <b>bonus epici</b> e <b>malus tragicomici.</b>
          </p>
        </Card>

        <Card title="I Sacri Dobrões" icon="💰">
          <p>
            Ogni partecipante è <b>capitano della propria squadra</b> 👑 e riceve:
          </p>
          <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-white/70 text-sm">Budget iniziale</div>
            <div className="text-3xl font-extrabold tracking-tight">
              500 Dbr
            </div>
          </div>

          <p className="mt-3">
            Usali con saggezza… oppure buttali tutti su un Mestre e spera negli
            dei della capoeira.
          </p>

          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <li className="rounded-2xl border border-white/10 bg-black/20 p-3">
              📉 Il budget scala mentre scegli
            </li>
            <li className="rounded-2xl border border-white/10 bg-black/20 p-3">
              🔄 Puoi cambiare idea fino alla conferma
            </li>
            <li className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:col-span-2">
              🚫 Se sfori… niente acquisti.
            </li>
          </ul>
        </Card>

        <Card title="La Squadra dei Sogni" icon="👥">
          <p>
            Ogni utente crea <b>una sola squadra</b>. Composizione:
          </p>
          <ul className="mt-3 list-disc pl-5 space-y-1">
            <li>da <b>1 a 6 membri</b></li>
            <li>scelte di cuore ❤️</li>
            <li>affidati al tuo intuito</li>
          </ul>
          <p className="mt-3">
            Una volta confermata… <b>che Oxóssi ti accompagni</b> 🙏
          </p>
        </Card>

        <Card title="Bonus & Malus" icon="⚡">
          <p>
            Durante il Batizado succederanno cose leggendarie. E no…
            <br />
            <b>non le dimenticheremo</b>.
          </p>
          <p className="mt-2">
            Ogni azione può:
            <br />
            ➕  ➖ regalarti punti o toglierli<br />
          </p>
          <p className="mt-2">
            La lista completa delle azioni è nella sezione{" "}
            <b>Azioni</b>.
          </p>

          <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-white/70 text-sm">Autorità suprema</div>
            <div className="text-lg font-extrabold">👑 Admin: Instrutor Frodo</div>
            <div className="mt-1 text-white/60 text-sm">
              Appelli? Ricorsi? Discussioni? Valuteremo. Male.
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/azioni"
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Vai a Azioni →
            </Link>
            <Link
              href="/classifica"
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Vai a Classifica →
            </Link>
          </div>
        </Card>

        <Card title="FAQ Assurde" icon="🤡">
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="font-bold">❓ Posso corrompere l’admin?</div>
              <div className="text-white/75 mt-1">
                Puoi provarci. Ma ricordati: l’admin ha il potere del “NO”.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="font-bold">❓ Se perdo posso dare la colpa all’algoritmo?</div>
              <div className="text-white/75 mt-1">
                Certo. È ovvio. Ma il gruppo non ti crederà comunque.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="font-bold">❓ Posso rifare la squadra se piango?</div>
              <div className="text-white/75 mt-1">
                Solo se piangi in roda, con Mestre Delei che ti giudica.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="font-bold">❓ Se vinco divento Mestre?</div>
              <div className="text-white/75 mt-1">
                No. Però puoi vantarti come se lo fossi. E avrai un&apos;aura potentissima.
              </div>
            </div>
          </div>
        </Card>

        <section className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6">
          <h2 className="text-xl font-extrabold tracking-tight">🔥 DA RICORDARE SEMPRE</h2>
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-white/85">
            <li className="rounded-2xl border border-white/10 bg-black/20 p-3">
              ⚡ Axé sopra ogni cosa
            </li>
            <li className="rounded-2xl border border-white/10 bg-black/20 p-3">
              😂 Divertirsi è obbligatorio
            </li>
            <li className="rounded-2xl border border-white/10 bg-black/20 p-3">
              🗣 Le polemiche valgono -1000 Dbr morali
            </li>
            <li className="rounded-2xl border border-white/10 bg-black/20 p-3">
              🏆 Chiunque vincerà… gloria eterna avrà!
            </li>
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/mercato"
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90"
            >
              Entra nel Mercato 🪙
            </Link>
            <Link
              href="/squadre"
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10"
            >
              Vedi Squadre 👀
            </Link>
          </div>

          <p className="mt-4 text-xs text-white/50">
            *Questo regolamento è ufficiale finché l’admin non cambia idea.
          </p>
        </section>
      </div>
    </main>
  );
}
